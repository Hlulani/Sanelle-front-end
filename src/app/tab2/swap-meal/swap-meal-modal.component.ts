import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonList,
  IonListHeader,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Observable, catchError, map, of, startWith, switchMap } from 'rxjs';
import { MealPlanItem, MealPlansService, ProteinPreference } from '../../core/services/meal-plans.service';
import { FoodRestrictionsService } from '../../core/services/food-restrictions.service';
import { MealImageComponent } from '../../shared/components/meal-image/meal-image.component';

/** What the alternatives must match: the choices the plan was made with. */
export interface SwapCriteria {
  proteinPreference: ProteinPreference;
  maxPrepMinutes: number | null;
}

type Alternatives = { status: 'idle' | 'loading' | 'error' } | { status: 'ready'; options: MealPlanItem[] };

/**
 * Offers alternatives for one meal that fit the same choices and food exclusions. It only
 * suggests; the page decides what changes, so a swap can't touch a plan it didn't come from.
 */
@Component({
  selector: 'app-swap-meal-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonListHeader,
    IonSpinner,
    MealImageComponent,
  ],
  templateUrl: './swap-meal-modal.component.html',
  styleUrls: ['./swap-meal-modal.component.scss'],
})
export class SwapMealModalComponent {
  private readonly plans = inject(MealPlansService);
  private readonly food = inject(FoodRestrictionsService);

  /** The meal being replaced; the dialog is open while there is one. */
  readonly meal = input<MealPlanItem | null>(null);
  readonly criteria = input.required<SwapCriteria>();
  readonly busy = input(false);
  /** Set by the page when saving the chosen meal failed. */
  readonly saveError = input<string | null>(null);

  readonly chosen = output<MealPlanItem>();
  readonly closed = output<void>();

  private readonly attempt = signal(0);

  /** Alternatives for the current meal. A newer request cancels a slower, older one. */
  readonly alternatives = toSignal(
    toObservable(computed(() => ({ meal: this.meal(), attempt: this.attempt() }))).pipe(
      switchMap(({ meal }) =>
        meal ? this.fetch(meal, untracked(this.criteria)) : of<Alternatives>({ status: 'idle' }),
      ),
    ),
    { initialValue: { status: 'idle' } as Alternatives },
  );

  readonly options = computed(() => {
    const a = this.alternatives();
    return a.status === 'ready' ? a.options : [];
  });

  retry() {
    this.attempt.update((n) => n + 1);
  }

  meta(meal: MealPlanItem): string {
    const tag = meal.tags?.[0];
    const parts: string[] = [];
    if (tag) parts.push(tag.charAt(0).toUpperCase() + tag.slice(1));
    if (meal.prepTimeMinutes) parts.push(`${meal.prepTimeMinutes} min`);
    return parts.join(' · ') || 'Alternative option';
  }

  choose(option: MealPlanItem) {
    const current = this.meal();
    if (current)
      this.chosen.emit({
        ...option,
        mealType: current.mealType,
        imageUrl: option.imageUrl ?? null,
        tags: option.tags ?? [],
        reasons: option.reasons ?? [],
      });
  }

  private fetch(meal: MealPlanItem, criteria: SwapCriteria): Observable<Alternatives> {
    const { allergies, dislikes } = this.food.restrictions();
    return this.plans
      .swapOptions({ mealType: meal.mealType, currentMealId: meal.mealId, ...criteria, allergies, dislikes })
      .pipe(
        map((options): Alternatives => ({ status: 'ready', options })),
        startWith<Alternatives>({ status: 'loading' }),
        catchError(() => of<Alternatives>({ status: 'error' })),
      );
  }
}
