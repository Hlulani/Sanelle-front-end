import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { MealPlanItem } from '../../core/services/meal-plans.service';
import { MealProgressService } from '../../core/services/meal-progress.service';
import { MEAL_TYPE_LABELS } from '../../core/models/meal.model';
import { MealImageComponent } from '../../shared/components/meal-image/meal-image.component';

/** Tags that describe the meal itself. Score-based labels ("anti-inflammatory", "iron-rich") are never shown. */
const FACTUAL_TAGS = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'quick', 'meal-prep', 'no-cook'];

/** One planned meal on a day: photo, why it was chosen, and swap / recipe / cooked actions. */
@Component({
  selector: 'app-plan-meal-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonButton, IonIcon, MealImageComponent],
  templateUrl: './plan-meal-card.component.html',
  styleUrls: ['./plan-meal-card.component.scss'],
})
export class PlanMealCardComponent {
  private readonly progress = inject(MealProgressService);

  readonly meal = input.required<MealPlanItem>();
  /** The plan date this meal is planned for. */
  readonly date = input.required<string>();
  /** A preview meal can't be marked cooked: nothing is saved yet. */
  readonly preview = input(false);
  readonly busy = input(false);

  readonly swap = output<void>();
  readonly view = output<void>();

  readonly typeLabel = computed(() => MEAL_TYPE_LABELS[this.meal().mealType]);
  readonly typeClass = computed(() => `chip chip-${this.meal().mealType.toLowerCase()}`);
  readonly cooked = computed(() => this.progress.isCooked(this.date(), this.meal().mealId));
  readonly highlights = computed(() =>
    (this.meal().tags ?? [])
      .map((t) => t.toLowerCase())
      .filter((t) => FACTUAL_TAGS.includes(t))
      .slice(0, 2)
      .map((t) => t.replace(/-/g, ' '))
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
  );

  toggleCooked() {
    this.progress.toggleCooked(this.date(), this.meal().mealId);
  }
}
