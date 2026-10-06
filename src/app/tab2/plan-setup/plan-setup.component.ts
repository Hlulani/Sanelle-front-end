import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonCard, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import {
  Duration,
  GenerateMealPlanRequest,
  GenerateMealPlanResponse,
  MealPlansService,
  PROTEIN_PREFERENCES,
  ProteinPreference,
} from '../../core/services/meal-plans.service';
import { ALLERGENS, AllergenCode, FoodRestrictionsService } from '../../core/services/food-restrictions.service';
import { FocusPreferencesService } from '../../core/services/focus-preferences.service';
import { AuthService } from '../../core/auth/auth.service';
import { addDays, isIsoDate, localIsoDate } from '../../shared/calendar-date';
import { startPlanOn } from '../plan-actions';
import { dateRange, describePlanChoices } from '../plan-format';

export type SetupStep = 'schedule' | 'food' | 'review';
/** The two schedules that behave differently; the API treats 16:8 and 18:6 alike. */
type MealsPerDay = 'NO_FASTING_3_MEALS' | 'FASTING_16_8';
type PlanDays = 7 | 14 | 30;
export type SavedPlanChoices = GenerateMealPlanRequest & { startDate: string };

const DURATIONS: Record<PlanDays, Duration> = { 7: 'DAYS_7', 14: 'DAYS_14', 30: 'DAYS_30' };

/**
 * The three short steps that make a plan: her week, her food, then a check. It previews a plan;
 * it never saves one. Choices start from the saved plan, so changing one thing is quick.
 */
@Component({
  selector: 'app-plan-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, IonCard, IonCardContent, IonIcon],
  templateUrl: './plan-setup.component.html',
  styleUrls: ['./plan-setup.component.scss'],
})
export class PlanSetupComponent implements OnInit {
  private readonly plans = inject(MealPlansService);
  private readonly food = inject(FoodRestrictionsService);
  private readonly focus = inject(FocusPreferencesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly hasPlan = input(false);
  /** The choices the saved plan was made with, if any. */
  readonly saved = input<SavedPlanChoices | undefined>(undefined);
  /** False until food choices and cooking progress have loaded. */
  readonly ready = input(false);
  /** The page is saving a plan; nothing here should change meanwhile. */
  readonly busy = input(false);
  readonly open = model(false);

  readonly previewed = output<GenerateMealPlanResponse>();
  readonly failed = output<string>();

  readonly today = localIsoDate();
  readonly step = signal<SetupStep>('schedule');
  readonly loading = signal(false);

  readonly mealsPerDay = linkedSignal<MealsPerDay>(() =>
    this.saved()?.fastingStyle === 'NO_FASTING_3_MEALS' || !this.saved() ? 'NO_FASTING_3_MEALS' : 'FASTING_16_8',
  );
  readonly days = linkedSignal<PlanDays>(() => {
    const d = this.saved()?.duration;
    return d === 'DAYS_14' ? 14 : d === 'DAYS_30' ? 30 : 7;
  });
  readonly proteinPreference = linkedSignal<ProteinPreference>(() => this.saved()?.proteinPreference ?? 'ANY');
  readonly maxPrepMinutes = linkedSignal<number | null>(() => this.saved()?.maxPrepMinutes ?? null);
  readonly startDate = linkedSignal<string>(() => this.saved()?.startDate ?? this.today);

  readonly dietChoices: { value: ProteinPreference; label: string; icon: string }[] = [
    { value: 'ANY', label: 'Any', icon: 'apps-outline' },
    { value: 'PESCATARIAN', label: 'Pescatarian', icon: 'fish-outline' },
    { value: 'VEGETARIAN', label: 'Vegetarian', icon: 'leaf-outline' },
    { value: 'VEGAN', label: 'Vegan', icon: 'nutrition-outline' },
  ];
  readonly prepOptions: { label: string; value: number | null }[] = [
    { label: 'Any', value: null },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
  ];
  readonly allergens = ALLERGENS;
  readonly restrictions = this.food.restrictions;
  readonly foodSaving = this.food.saving;
  newDislike = '';

  readonly endDate = computed(() =>
    isIsoDate(this.startDate()) ? addDays(this.startDate(), this.days() - 1) : this.startDate(),
  );
  readonly rangeLabel = computed(() => dateRange(this.startDate(), this.endDate(), ' - '));
  readonly choicesLabel = computed(() =>
    describePlanChoices({
      fastingStyle: this.mealsPerDay(),
      proteinPreference: this.proteinPreference(),
      maxPrepMinutes: this.maxPrepMinutes(),
    }),
  );
  readonly allergyLabel = computed(
    () =>
      this.allergens
        .filter((a) => this.hasAllergy(a.code))
        .map((a) => a.label)
        .join(', ') || 'None selected',
  );

  ngOnInit() {
    // Someone who chose a diet at onboarding shouldn't have to choose it again.
    void this.focus.loadDiet().then((diet) => {
      if (diet && !this.saved()) this.proteinPreference.set(diet);
    });
  }

  /** Opens the setup at a step, e.g. "review" when she goes back from a preview. */
  showStep(step: SetupStep, options: { restartToday?: boolean } = {}) {
    if (options.restartToday) this.startDate.set(this.today);
    this.step.set(step);
    this.open.set(true);
  }

  toggle() {
    if (this.open()) this.open.set(false);
    else this.showStep('schedule');
  }

  setDays(value: number) {
    if (value === 7 || value === 14 || value === 30) this.days.set(value);
  }

  setProteinPreference(value: ProteinPreference) {
    if (!PROTEIN_PREFERENCES.includes(value)) return;
    this.proteinPreference.set(value);
    void this.focus.saveDiet(value);
  }

  hasAllergy(code: AllergenCode): boolean {
    return this.restrictions().allergies.includes(code);
  }

  toggleAllergy(code: AllergenCode) {
    void this.food
      .toggleAllergy(code)
      .catch(() => this.failed.emit('Could not save this allergy choice. It has not changed. Please try again.'));
  }

  async addDislike() {
    try {
      await this.food.addDislike(this.newDislike);
      this.newDislike = '';
    } catch {
      this.failed.emit('Could not save this food exclusion. Please try again.');
    }
  }

  removeDislike(food: string) {
    void this.food
      .removeDislike(food)
      .catch(() => this.failed.emit('Could not remove this food exclusion. Please try again.'));
  }

  /** Asks the server for meals that meet every choice and shows them as a preview. */
  preview() {
    if (!this.ready() || this.loading() || this.busy() || this.foodSaving()) return;
    const startDate = this.startDate();
    if (!isIsoDate(startDate) || startDate < this.today) {
      this.failed.emit('Choose today or a future date for the new plan.');
      return;
    }
    if (!this.auth.hasValidToken()) {
      void this.router.navigateByUrl('/auth?mode=login');
      return;
    }
    const { allergies, dislikes } = this.restrictions();
    const request: GenerateMealPlanRequest = {
      duration: DURATIONS[this.days()],
      fastingStyle: this.mealsPerDay(),
      proteinPreference: this.proteinPreference(),
      maxPrepMinutes: this.maxPrepMinutes(),
      allergies,
      dislikes,
    };
    this.loading.set(true);
    this.plans.generate(request).subscribe({
      next: (plan) => {
        this.loading.set(false);
        try {
          this.previewed.emit(
            startPlanOn(
              { ...plan, madeWith: { allergies, dislikes }, preferences: { ...request, startDate } },
              startDate,
            ),
          );
          this.open.set(false);
        } catch (error) {
          this.failed.emit(error instanceof Error ? error.message : 'Could not prepare a preview.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.failed.emit(
          'Could not make a plan. Your saved meals are still here. Check your connection and try again.',
        );
      },
    });
  }
}
