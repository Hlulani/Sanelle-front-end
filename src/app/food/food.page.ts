import { FoodPathsComponent } from './food-paths.component';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { FigmaIconComponent } from '../shared/design/figma/figma-icon.component';
import { FlexibleRecipeComponent } from './flexible-recipe.component';
import { MealImageComponent } from '../shared/components/meal-image/meal-image.component';
import { FoodProfileService } from './food-profile.service';
import { PlanEditor } from './plan-editor.service';
import { RankedOption } from './meal-plan';
import { messageFor } from '../core/errors/errors';
@Component({
  selector: 'app-food',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FoodPathsComponent,
    IonContent,
    FigmaFrameComponent,
    FigmaIconComponent,
    FlexibleRecipeComponent,
    MealImageComponent,
  ],
  templateUrl: './food.page.html',
})
export class FoodPage implements OnInit {
  private readonly router = inject(Router);
  private readonly food = inject(FoodProfileService);
  private readonly editor = inject(PlanEditor);
  readonly options = signal<RankedOption[]>([]);
  readonly feature = computed(() => this.options()[0] ?? null);
  readonly alternatives = computed(() => this.options().slice(1, 3));
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly foodPath: string = 'meals';
  ngOnInit() {
    void this.load();
  }
  ionViewWillEnter() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.editor.load();
      this.options.set(await this.editor.options());
    } catch (e) {
      this.error.set(messageFor(e, 'Meals couldn’t load. Check your connection and try again.'));
    } finally {
      this.loading.set(false);
    }
  }
  onClaim() {
    void this.router.navigate(['/learn/C17'], { queryParams: { from: 'food' } });
  }
  findMeals() {
    void this.router.navigateByUrl('/food/find');
  }
  planMeals() {
    void this.router.navigateByUrl(this.food.reviewed() ? '/food/plan' : '/food/requirements');
  }
  requirements() {
    void this.router.navigateByUrl('/food/requirements');
  }
  recipe(id: string) {
    void this.router.navigate(['/food/recipe', id]);
  }
}
