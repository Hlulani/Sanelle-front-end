import { ChangeDetectionStrategy, Component, OnChanges, Input, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { FigmaIconComponent } from '../shared/design/figma/figma-icon.component';
import { IonContent } from '@ionic/angular/standalone';
import { RecipeCatalog } from './recipe-catalog.service';
import { FoodProfileService } from './food-profile.service';
import { PlanEditor } from './plan-editor.service';
import { RankedOption, conflictStatus } from './meal-plan';
import { MealResponse } from '../core/models/meal.model';
import { MealImageComponent } from '../shared/components/meal-image/meal-image.component';
import { scaleIngredientAmount } from '../core/services/ingredient-scaling.util';
import { messageFor } from '../core/errors/errors';
import { RecipeShoppingComponent } from './recipe-shopping.component';

@Component({
  selector: 'app-flexible-recipe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, FigmaIconComponent, MealImageComponent, RecipeShoppingComponent],
  templateUrl: './flexible-recipe.component.html',
})
export class FlexibleRecipeComponent implements OnChanges {
  private readonly catalog = inject(RecipeCatalog);
  private readonly food = inject(FoodProfileService);
  private readonly editor = inject(PlanEditor);
  private readonly router = inject(Router);
  private readonly params = inject(ActivatedRoute).snapshot;
  @Input() id = '';
  @Input() date: string | null = null;
  @Input() showShopping = true;
  stage: 'plan' | 'cook' = 'plan';
  ngOnChanges() {
    if (this.id) void this.load();
  }
  readonly meal = signal<MealResponse | null>(null);
  readonly option = signal<RankedOption | null>(null);
  readonly profile = this.food.profile;
  readonly servings = signal(1);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly conflict = computed(() => {
    const m = this.meal();
    return m
      ? conflictStatus(
          {
            mealId: m.id,
            name: m.name,
            imageUrl: m.imageUrl ?? null,
            prepTimeMinutes: m.prepTimeMinutes ?? null,
            tags: m.tags,
            reasons: [],
          },
          m,
          this.profile(),
        )
      : null;
  });
  readonly decrease = (n: number) => Math.max(1, n - 1);
  readonly increase = (n: number) => Math.min(12, n + 1);
  ionViewWillEnter() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.editor.load();
      this.servings.set(this.editor.plan()?.servings ?? this.profile().household);
      const id = this.id || this.params.paramMap.get('id') || '';
      this.meal.set(await this.catalog.recipe(id));
      this.option.set((await this.editor.options()).find((o) => o.meal.mealId === id) ?? null);
    } catch (e) {
      this.error.set(messageFor(e, 'The recipe couldn’t load. Try again.'));
    } finally {
      this.loading.set(false);
    }
  }
  amount(raw: string) {
    return raw ? scaleIngredientAmount(raw, this.servings()) : 'Amount not specified';
  }
  async favourite() {
    await this.run(async () => {
      await this.food.toggleFavourite(this.meal()!.id);
      this.notice.set(
        this.profile().favourites.includes(this.meal()!.id) ? 'Saved to your favourites.' : 'Removed from favourites.',
      );
    });
  }
  async dislike(ingredient: string) {
    await this.run(async () => {
      await this.food.dislikeIngredientIn(this.meal()!.id, ingredient);
      this.notice.set('Preference saved. Future suggestions will flag this ingredient.');
    });
  }
  async use() {
    await this.run(async () => {
      const o = this.option();
      if (!o) return;
      if (this.date && this.editor.plan()?.days.some((d) => d.date === this.date)) {
        await this.router.navigate(['/food/swap', this.date], { queryParams: { meal: o.meal.mealId } });
      } else {
        await this.router.navigate(['/food/plan'], {
          queryParams: { new: 1, meal: o.meal.mealId, servings: this.servings() },
        });
      }
    });
  }
  private async run(action: () => Promise<void>) {
    this.saving.set(true);
    this.error.set(null);
    try {
      await action();
    } catch (e) {
      this.error.set(messageFor(e, 'Your change couldn’t be saved.'));
    } finally {
      this.saving.set(false);
    }
  }
}
