import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MealResponse } from '../core/models/meal.model';
import { FoodProfileService, RecipeShoppingEdits } from './food-profile.service';
import { FigmaIconComponent } from '../shared/design/figma/figma-icon.component';
import { messageFor } from '../core/errors/errors';

/** The editable recipe shopping section exported in Food; names come from the actual recipe. */
@Component({
  selector: 'app-recipe-shopping',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, FigmaIconComponent],
  template: `
    <section class="shopping-section">
      <div class="section-title">
        <div>
          <p class="eyebrow">Editable list</p>
          <h2>Shopping for this meal</h2>
        </div>
      </div>
      <p class="muted">Tick what you already have. The remaining items stay on your list.</p>
      <div class="shopping-list">
        @for (item of items(); track item.key) {
          <label
            ><input
              type="checkbox"
              [checked]="item.have"
              [disabled]="saving()"
              [attr.aria-label]="'Already have ' + item.name"
              (change)="toggle(item.key)"
            />
            <span>{{ item.name }}</span>
            <button
              type="button"
              [disabled]="saving()"
              (click)="remove(item.key, item.added)"
              [attr.aria-label]="'Remove ' + item.name"
            >
              <svg figmaIcon="close" [size]="16" />
            </button>
          </label>
        }
      </div>
      <div class="shopping-add">
        <input
          [(ngModel)]="newItem"
          placeholder="Add another item"
          aria-label="Add another item"
          (keydown.enter)="add()"
        />
        <button [disabled]="saving()" (click)="add()" aria-label="Add grocery item"><svg figmaIcon="plus" /></button>
      </div>
      @if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      }
    </section>
  `,
})
export class RecipeShoppingComponent {
  private readonly food = inject(FoodProfileService);
  readonly meal = input.required<MealResponse>();
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  newItem = '';
  readonly items = computed(() => {
    const edits = this.food.recipeShoppingFor(this.meal().id);
    const names = new Map(this.meal().ingredients.map((item) => [item.name.trim().toLowerCase(), item.name]));
    return [
      ...[...names].filter(([key]) => !edits.removed.includes(key)).map(([key, name]) => ({ key, name, added: false })),
      ...edits.added.map((item) => ({ key: item.name.toLowerCase(), name: item.name, added: true })),
    ].map((item) => ({ ...item, have: edits.have.includes(item.key) }));
  });
  toggle(key: string) {
    void this.change((edits) => ({
      ...edits,
      have: edits.have.includes(key) ? edits.have.filter((item) => item !== key) : [...edits.have, key],
    }));
  }
  remove(key: string, added: boolean) {
    void this.change((edits) => ({
      ...edits,
      ...(added
        ? { added: edits.added.filter((item) => item.name.toLowerCase() !== key) }
        : { removed: [...new Set([...edits.removed, key])] }),
    }));
  }
  async add() {
    const name = this.newItem.trim();
    if (!name || this.saving() || this.items().some((item) => item.key === name.toLowerCase())) return;
    if (await this.change((edits) => ({ ...edits, added: [...edits.added, { name }] }))) this.newItem = '';
  }
  private async change(edit: (edits: RecipeShoppingEdits) => RecipeShoppingEdits): Promise<boolean> {
    if (this.saving()) return false;
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.food.editRecipeShopping(this.meal().id, edit);
      return true;
    } catch (e) {
      this.error.set(messageFor(e, 'Your shopping list couldn’t be saved. Please try again.'));
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
