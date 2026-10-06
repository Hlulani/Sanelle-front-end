import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { GenerateMealPlanResponse, MealPlanItem } from '../core/services/meal-plans.service';
import { AllergenCode, FoodRestrictionsService, sameRestrictions } from '../core/services/food-restrictions.service';
import { MealProgressService } from '../core/services/meal-progress.service';
import { NotificationService } from '../core/services/notification.service';
import { PlanStoreService } from '../core/services/plan-store.service';
import { MEAL_TYPE_LABELS, MealType } from '../core/models/meal.model';
import { localIsoDate } from '../shared/calendar-date';
import { MealImageComponent } from '../shared/components/meal-image/meal-image.component';
import { replaceMealSlot } from './plan-actions';
import { dateRange, describePlanChoices, formatPlanDate, relativeDay } from './plan-format';
import { PlanSetupComponent } from './plan-setup/plan-setup.component';
import { PlanMealCardComponent } from './plan-meal-card/plan-meal-card.component';
import { SwapCriteria, SwapMealModalComponent } from './swap-meal/swap-meal-modal.component';
import { CookingChallengesComponent } from './cooking-challenges/cooking-challenges.component';

/** A swap in progress: the meal, the day it's on, and the plan it was chosen from. */
interface Swap {
  meal: MealPlanItem;
  date: string;
  plan: GenerateMealPlanResponse;
}

/**
 * Nourish: her saved plan or a preview of a new one, by day or by week. A preview only replaces
 * the saved plan when she chooses "Use this plan", and the last change can be undone.
 */
@Component({
  selector: 'app-tab2',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    RouterLink,
    IonContent,
    IonIcon,
    MealImageComponent,
    PlanSetupComponent,
    PlanMealCardComponent,
    SwapMealModalComponent,
    CookingChallengesComponent,
  ],
})
export class Tab2Page implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly food = inject(FoodRestrictionsService);
  private readonly router = inject(Router);
  private readonly planStore = inject(PlanStoreService);
  private readonly mealProgress = inject(MealProgressService);
  private readonly notifications = inject(NotificationService);
  private readonly setup = viewChild(PlanSetupComponent);

  readonly ready = signal(false);
  readonly error = signal<string | null>(null);
  readonly planStatus = signal<string | null>(null);
  readonly savingPlan = signal(false);

  readonly plan = signal<GenerateMealPlanResponse | null>(null);
  readonly previewPlan = signal<GenerateMealPlanResponse | null>(null);
  readonly undoPlan = signal<GenerateMealPlanResponse | null>(null);
  readonly displayPlan = computed(() => this.previewPlan() ?? this.plan());

  readonly planView = signal<'day' | 'week'>('day');
  readonly selectedDayIndex = signal(0);
  // A returning person lands on their plan, not the form that made it.
  readonly preferencesOpen = signal(!this.planStore.getPlanSnapshot());
  readonly communityOpen = signal(false);

  readonly swapping = signal<Swap | null>(null);
  readonly swapSaveError = signal<string | null>(null);

  readonly selectedDay = computed(() => {
    const days = this.displayPlan()?.daysPlan;
    return days?.length ? days[Math.min(this.selectedDayIndex(), days.length - 1)] : null;
  });

  /** The week the selected day is in. */
  readonly dayWindow = computed(() => {
    const start = Math.floor(this.selectedDayIndex() / 7) * 7;
    return (this.displayPlan()?.daysPlan ?? []).slice(start, start + 7).map((day, i) => ({ day, index: start + i }));
  });

  readonly ended = computed(() => {
    const days = this.plan()?.daysPlan;
    return !!days?.length && days[days.length - 1].date < localIsoDate();
  });

  readonly savedRange = computed(() => {
    const days = this.plan()?.daysPlan;
    return days?.length ? dateRange(days[0].date, days[days.length - 1].date) : '';
  });

  readonly cookedProgress = computed(() => {
    let done = 0;
    let total = 0;
    for (const day of this.plan()?.daysPlan ?? []) {
      for (const meal of day.meals) {
        total++;
        if (this.mealProgress.isCooked(day.date, meal.mealId)) done++;
      }
    }
    return { done, total };
  });

  readonly previewSummary = computed(() => {
    const p = this.previewPlan()?.preferences;
    return p ? describePlanChoices(p) : '';
  });

  /** True when allergies or dislikes changed after the saved plan was made. */
  readonly restrictionsChanged = computed(() => {
    const plan = this.plan();
    return !!plan && !sameRestrictions(this.madeWith(plan), this.food.restrictions());
  });

  readonly unfilledLabel = computed(() => {
    const unfilled = this.displayPlan()?.unfilled ?? [];
    return unfilled.length ? unfilled.map((t) => t.charAt(0) + t.slice(1).toLowerCase()).join(' and ') : null;
  });

  /** Alternatives follow the choices the plan was made with, or the current ones for older plans. */
  readonly swapCriteria = computed<SwapCriteria>(() => {
    const p = this.displayPlan()?.preferences;
    const setup = this.setup();
    return {
      proteinPreference: p?.proteinPreference ?? setup?.proteinPreference() ?? 'ANY',
      maxPrepMinutes: p ? p.maxPrepMinutes : (setup?.maxPrepMinutes() ?? null),
    };
  });

  ngOnInit(): void {
    Promise.all([this.food.load(), this.mealProgress.init()])
      .then(() => this.ready.set(true))
      .catch(() => this.error.set('Could not load your saved food choices. Please reload before making a plan.'));

    this.planStore.plan$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((plan) => {
      const previous = this.selectedDay()?.date;
      this.plan.set(plan);
      if (plan) {
        const index = plan.daysPlan.findIndex((day) => day.date === previous);
        this.selectedDayIndex.set(index >= 0 ? index : this.indexOfTodayOrFirst(plan));
        this.preferencesOpen.set(false);
      }
    });
  }

  openPreferences() {
    this.setup()?.showStep('schedule', { restartToday: this.ended() });
  }

  showPreview(preview: GenerateMealPlanResponse) {
    this.error.set(null);
    this.previewPlan.set(preview);
    this.selectedDayIndex.set(0);
    this.planStatus.set('Preview ready. Swap anything you don’t want before saving.');
  }

  async acceptPreview() {
    const preview = this.previewPlan();
    if (!preview || this.savingPlan() || this.food.saving()) return;
    if (!sameRestrictions(this.madeWith(preview), this.food.restrictions())) {
      this.error.set('Your food exclusions changed after this preview. Make a fresh preview before saving.');
      return;
    }
    await this.save(
      preview,
      async () => {
        this.previewPlan.set(null);
        this.preferencesOpen.set(false);
        this.planStatus.set('Your plan is saved. Choose a day, open a recipe or build your grocery list.');
        void this.notifications.reschedule().catch(() => undefined);
      },
      'Could not save the new plan. Your previous plan is still here. Please try again.',
    );
  }

  discardPreview() {
    this.previewPlan.set(null);
    const plan = this.plan();
    this.selectedDayIndex.set(plan ? this.indexOfTodayOrFirst(plan) : 0);
    this.setup()?.showStep('review');
  }

  async undoChange() {
    const previous = this.undoPlan();
    if (!previous || this.savingPlan()) return;
    this.savingPlan.set(true);
    try {
      await this.planStore.savePlan(previous);
      this.undoPlan.set(null);
      this.planStatus.set('Previous plan restored.');
    } catch {
      this.error.set('Could not restore your previous plan. Please try again.');
    } finally {
      this.savingPlan.set(false);
    }
  }

  openSwap(meal: MealPlanItem, date: string) {
    const plan = this.displayPlan();
    if (!plan) return;
    this.swapSaveError.set(null);
    this.swapping.set({ meal, date, plan });
  }

  closeSwap() {
    this.swapping.set(null);
  }

  /** Replaces only the swapped meal on its own day, and only in the plan it was chosen from. */
  async applySwap(replacement: MealPlanItem) {
    const swap = this.swapping();
    if (!swap || swap.plan !== this.displayPlan() || this.savingPlan()) return;
    const updated = replaceMealSlot(swap.plan, swap.date, swap.meal, replacement);
    if (this.previewPlan()) {
      this.previewPlan.set(updated);
      this.afterSwap(swap.date);
      return;
    }
    this.savingPlan.set(true);
    this.error.set(null);
    try {
      await this.planStore.savePlan(updated);
      this.undoPlan.set(swap.plan);
      this.afterSwap(swap.date);
    } catch {
      this.swapSaveError.set('Could not save this swap. Your meal has not changed.');
    } finally {
      this.savingPlan.set(false);
    }
  }

  selectDay(index: number) {
    this.selectedDayIndex.set(index);
  }

  previousDay() {
    this.selectDay(Math.max(0, this.selectedDayIndex() - 1));
  }

  nextDay() {
    this.selectDay(Math.min((this.displayPlan()?.daysPlan.length ?? 1) - 1, this.selectedDayIndex() + 1));
  }

  dayTitle(date: string) {
    return formatPlanDate(date, { weekday: 'long', day: 'numeric', month: 'long' });
  }

  dayPillTop(date: string) {
    return relativeDay(date, 'short');
  }

  dayPillBottom(date: string) {
    return formatPlanDate(date, { day: 'numeric' });
  }

  mealTypeLabel(type: MealType) {
    return MEAL_TYPE_LABELS[type];
  }

  goToGroceryList() {
    if (!this.previewPlan()) void this.router.navigateByUrl('/tabs/tab3');
  }

  openMealDetails(mealId: string, date: string) {
    if (!mealId) return;
    // A preview recipe must not mark a meal in the saved plan as cooked.
    void this.router.navigate(['/meal-details', mealId], { queryParams: this.previewPlan() ? {} : { date } });
  }

  private async save(plan: GenerateMealPlanResponse, after: () => Promise<void>, failure: string) {
    this.savingPlan.set(true);
    this.error.set(null);
    const previous = this.plan();
    try {
      await this.planStore.savePlan(plan);
      this.undoPlan.set(previous);
      await after();
    } catch {
      this.error.set(failure);
    } finally {
      this.savingPlan.set(false);
    }
  }

  private afterSwap(date: string) {
    this.planStatus.set('Replaced only this meal on ' + date + '.');
    this.closeSwap();
  }

  private madeWith(plan: GenerateMealPlanResponse) {
    return plan.madeWith
      ? { allergies: plan.madeWith.allergies as AllergenCode[], dislikes: plan.madeWith.dislikes }
      : null;
  }

  private indexOfTodayOrFirst(plan: GenerateMealPlanResponse): number {
    const index = plan.daysPlan.findIndex((d) => d.date === localIsoDate());
    return index >= 0 ? index : 0;
  }
}
