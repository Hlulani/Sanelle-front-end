import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonButton,
  IonText,
  IonList,
  IonModal,
  IonListHeader,
  IonButtons,
  IonDatetime,
  IonIcon,
  IonSpinner,
  IonInput,
  IonTextarea,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

import {
  MealPlansService,
  Duration,
  GenerateMealPlanRequest,
  GenerateMealPlanResponse,
  MealPlanItem,
  DayPlan,
  PROTEIN_PREFERENCES,
  ProteinPreference,
} from '../core/services/meal-plans.service';
import { AuthService } from '../core/auth/auth.service';
import { FocusPreferencesService } from '../core/services/focus-preferences.service';
import { NotificationService } from '../core/services/notification.service';
import { Router, RouterLink } from '@angular/router';
import { PlanStoreService } from '../core/services/plan-store.service';
import { ALLERGENS, AllergenCode, FoodRestrictionsService, sameRestrictions } from '../core/services/food-restrictions.service';
import { MealProgressService } from '../core/services/meal-progress.service';
import { ChallengesService, ChallengeDefinition, ChallengeProgress } from '../core/services/challenges.service';
import { CustomChallengesService } from '../core/services/custom-challenges.service';
import { CustomChallengeResponse, ChallengeMemberResponse } from '../core/services/api.service';
import { InitialAvatarComponent } from '../shared/components/initial-avatar/initial-avatar.component';
import { Share } from '@capacitor/share';

type CustomChallengeMechanic = 'meals-in-period' | 'days-in-period' | 'streak';

// Numeric UI duration (segment value / day-iteration count) — distinct from the
// wire-format `Duration` enum sent to the backend in the generate request.
type PlanDuration = 7 | 14 | 30;

type SwapOption = {
  id: string;
  name: string;
  imageUrl?: string | null;
  meta?: string;
  tags: string[];
  prepTimeMinutes?: number | null;
  reasons: string[];
};

import { localDay, replaceMealSlot, startPlanOn } from './plan-actions';
import { MealImageComponent } from '../shared/components/meal-image/meal-image.component';

@Component({
  selector: 'app-tab2',
  standalone: true,
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    InitialAvatarComponent,
    MealImageComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonButton,
    IonText,
    IonList,
    IonModal,
    IonListHeader,
    IonButtons,
    IonDatetime,
    IonIcon,
    IonSpinner,
    IonInput,
    IonTextarea,
  ],
})
export class Tab2Page implements OnInit {
  private mealPlansService = inject(MealPlansService);
  private foodRestrictions = inject(FoodRestrictionsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private planStore = inject(PlanStoreService);
  mealProgress = inject(MealProgressService);
  challengesService = inject(ChallengesService);
  customChallengesService = inject(CustomChallengesService);
  private focusPreferences = inject(FocusPreferencesService);
  private notifications = inject(NotificationService);

  // --- Custom challenges: create ---
  createModalOpen = signal(false);
  creatingChallenge = signal(false);
  createError = signal<string | null>(null);
  newChallengeName = '';
  newChallengeDescription = '';
  newChallengeType = signal<CustomChallengeMechanic>('meals-in-period');
  newChallengeTarget = 10;
  newChallengeDuration = 14;
  createdChallenge = signal<CustomChallengeResponse | null>(null);

  // --- Custom challenges: join by code ---
  joinModalOpen = signal(false);
  joiningChallenge = signal(false);
  joinError = signal<string | null>(null);
  joinCode = '';

  // --- Custom challenges: member lists, fetched lazily per challenge ---
  private membersCache = signal<Record<string, ChallengeMemberResponse[]>>({});
  private loadingMembersFor = new Set<string>();

  ngOnInit(): void {
    void Promise.all([this.foodRestrictions.load(), this.mealProgress.init()]).then(() => this.ready.set(true)).catch(() => this.error.set('Could not load your saved food choices. Please reload before making a plan.'));

    void this.focusPreferences.loadDiet().then((diet) => {
      if (diet && !this.planStore.getPlanSnapshot()?.preferences) this.proteinPreference.set(diet);
    });


    this.planStore.plan$.subscribe((plan) => {
      const previous = this.selectedDay()?.date;
      this.plan.set(plan);
      if (plan) {
        const index = plan.daysPlan.findIndex((day) => day.date === previous);
        this.selectedDayIndex.set(index >= 0 ? index : this.indexOfTodayOrFirst(plan));
        if (plan.preferences) this.restorePreferences(plan.preferences);
        this.preferencesOpen.set(false);
      }
    });
  }
  private todayLocalYYYYMMDD(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

  private parseLocalDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return null;
    const [y, m, d] = parts;
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  private formatDate(dateStr: string, options: Intl.DateTimeFormatOptions): string {
    const d = this.parseLocalDate(dateStr);
    if (!d || Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-US', options).format(d);
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  readonly ready = signal(false);
  readonly today = localDay(new Date());
  readonly settingsStep = signal<'schedule' | 'food' | 'review'>('schedule');
  readonly planView = signal<'day' | 'week'>('day');
  readonly previewPlan = signal<GenerateMealPlanResponse | null>(null);
  readonly displayPlan = computed(() => this.previewPlan() ?? this.plan());
  readonly savingPlan = signal(false);
  readonly planStatus = signal<string | null>(null);
  readonly undoPlan = signal<GenerateMealPlanResponse | null>(null);
  readonly communityOpen = signal(false);
  private communityLoaded = false;
  readonly swapError = signal<string | null>(null);
  private swapDay = '';
  private swapReference: GenerateMealPlanResponse | null = null;
  private swapRequest = 0;
  readonly dayWindow = computed(() => {
    const start = Math.floor(this.selectedDayIndex() / 7) * 7;
    return (this.displayPlan()?.daysPlan ?? []).slice(start, start + 7).map((day, i) => ({ day, index: start + i }));
  });
  readonly ended = computed(() => { const days = this.plan()?.daysPlan; return !!days?.length && days[days.length - 1].date < this.today; });

  openCommunity() {
    this.communityOpen.update((open) => !open);
    if (this.communityLoaded) return;
    this.communityLoaded = true;
    void this.challengesService.init(); this.challengesService.refreshCounts();
    void this.customChallengesService.init().then(() => this.customChallengesService.refresh(() => this.loadAllCustomChallengeMembers()));
  }
  private restorePreferences(p: GenerateMealPlanRequest & { startDate: string }) {
    this.duration.set(p.duration === 'DAYS_7' ? 7 : p.duration === 'DAYS_14' ? 14 : 30);
    this.fastingStyle.set(p.fastingStyle === 'NO_FASTING_3_MEALS' ? 'NO_FASTING_3_MEALS' : 'FASTING_16_8');
    this.proteinPreference.set(p.proteinPreference); this.maxPrepMinutes.set(p.maxPrepMinutes); this.startDateISO.set(p.startDate);
  }
  openPreferences() {
    this.preferencesOpen.set(true); this.settingsStep.set('schedule');
    if (this.ended()) this.startDateISO.set(this.today);
  }
  readonly selectedDayIndex = signal<number>(0);
  // Collapsed by default once a plan already exists — a returning user should land
  // on their actual plan, not the form that generated it. Expanded when there's
  // nothing to show yet, since the form is the only thing to do at that point.
  preferencesOpen = signal<boolean>(!this.planStore.getPlanSnapshot());
  swapModalOpen = signal<boolean>(false);
  swapMeal = signal<MealPlanItem | null>(null);
  swapOptions = signal<SwapOption[]>([]);
  swapLoading = signal<boolean>(false);
  startDatePickerOpen = signal<boolean>(false);
  startDateISO = signal<string | null>(null);

  openSwap(meal: MealPlanItem) {
    const request = ++this.swapRequest;
    this.swapReference = this.displayPlan();
    this.swapDay = this.selectedDay()?.date ?? '';
    this.swapError.set(null);
    this.swapMeal.set(meal);
    this.swapOptions.set([]);
    this.swapModalOpen.set(true);
    this.swapLoading.set(true);

    const r = this.foodRestrictions.restrictions();
    const preferences = this.displayPlan()?.preferences;
    this.mealPlansService
      .swapOptions({
        mealType: meal.mealType,
        currentMealId: meal.mealId,
        proteinPreference: preferences?.proteinPreference ?? this.proteinPreference(),
        maxPrepMinutes: preferences ? preferences.maxPrepMinutes : this.maxPrepMinutes(),
        allergies: r.allergies,
        dislikes: r.dislikes,
      })
      .subscribe({
        next: (items) => {
          if (request !== this.swapRequest) return;
          this.swapOptions.set(
            items.map((m): SwapOption => ({
              id: m.mealId,
              name: m.name,
              imageUrl: m.imageUrl ?? null,
              meta: this.swapMetaLabel(m),
              tags: m.tags ?? [],
              prepTimeMinutes: m.prepTimeMinutes ?? null,
              reasons: m.reasons ?? [],
            })),
          );
          this.swapLoading.set(false);
        },
        error: () => {
          if (request !== this.swapRequest) return;
          this.swapError.set('Could not load alternatives. Check your connection and try again.');
          this.swapOptions.set([]);
          this.swapLoading.set(false);
        },
      });
  }

  private swapMetaLabel(meal: MealPlanItem): string {
    const tag = meal.tags?.[0];
    const parts: string[] = [];
    if (tag) parts.push(tag.charAt(0).toUpperCase() + tag.slice(1));
    if (meal.prepTimeMinutes) parts.push(`${meal.prepTimeMinutes} min`);
    return parts.join(' · ') || 'Alternative option';
  }



  closeSwap() {
    this.swapRequest++;
    this.swapModalOpen.set(false);
  }

  openStartDatePicker() {
    this.startDatePickerOpen.set(true);
  }

  closeStartDatePicker() {
    this.startDatePickerOpen.set(false);
  }

  onStartDateChange(value: string | string[] | null | undefined) {
    if (!value) return;
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) return;
    const dateOnly = raw.split('T')[0];
    if (dateOnly) this.startDateISO.set(dateOnly);
  }

  async applySwap(option: SwapOption) {
    const current = this.swapMeal(); const plan = this.displayPlan();
    if (!current || !plan || this.swapReference !== plan || this.savingPlan()) return;
    const replacement: MealPlanItem = { mealType: current.mealType, mealId: option.id, name: option.name, imageUrl: option.imageUrl ?? null, tags: option.tags, prepTimeMinutes: option.prepTimeMinutes, reasons: option.reasons };
    const updated = replaceMealSlot(plan, this.swapDay, current, replacement);
    this.savingPlan.set(true); this.error.set(null);
    try {
      if (this.previewPlan()) this.previewPlan.set(updated);
      else {
        await this.planStore.savePlan(updated);
        this.undoPlan.set(plan);
      }
      this.planStatus.set('Replaced only this meal on ' + this.swapDay + '.');
      this.closeSwap();
    } catch { this.swapError.set('Could not save this swap. Your meal has not changed.'); }
    finally { this.savingPlan.set(false); }
  }
  retrySwap() { const meal = this.swapMeal(); if (meal) this.openSwap(meal); }
  async acceptPreview() {
    const preview = this.previewPlan(); if (!preview || this.savingPlan() || this.foodSaving()) return;
    if (!sameRestrictions(preview.madeWith ? { allergies: preview.madeWith.allergies as AllergenCode[], dislikes: preview.madeWith.dislikes } : null, this.restrictions())) { this.error.set('Your food exclusions changed after this preview. Make a fresh preview before saving.'); return; }
    this.savingPlan.set(true); this.error.set(null);
    const previous = this.plan();
    try {
      await this.planStore.savePlan(preview);
      this.previewPlan.set(null); this.undoPlan.set(previous); this.preferencesOpen.set(false);
      this.planStatus.set('Your plan is saved. Choose a day, open a recipe or build your grocery list.');
      void this.notifications.reschedule().catch(() => undefined);
    } catch { this.error.set('Could not save the new plan. Your previous plan is still here. Please try again.'); }
    finally { this.savingPlan.set(false); }
  }
  discardPreview() { this.previewPlan.set(null); this.selectedDayIndex.set(this.plan() ? this.indexOfTodayOrFirst(this.plan()!) : 0); this.preferencesOpen.set(true); this.settingsStep.set('review'); }
  async undoChange() {
    const previous = this.undoPlan(); if (!previous || this.savingPlan()) return;
    this.savingPlan.set(true);
    try { await this.planStore.savePlan(previous); this.undoPlan.set(null); this.planStatus.set('Previous plan restored.'); }
    catch { this.error.set('Could not restore your previous plan. Please try again.'); }
    finally { this.savingPlan.set(false); }
  }
  previousDay() { this.selectDay(Math.max(0, this.selectedDayIndex() - 1)); }
  nextDay() { this.selectDay(Math.min((this.displayPlan()?.daysPlan.length ?? 1) - 1, this.selectedDayIndex() + 1)); }
  dayTitle(date: string) { return this.formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' }); }
  allergySummary() { return this.allergens.filter((a) => this.hasAllergy(a.code)).map((a) => a.label).join(', ') || 'None selected'; }
  preferenceSummary(preferences?: GenerateMealPlanRequest) {
    const meals = preferences?.fastingStyle ?? this.fastingStyle();
    const diet = preferences?.proteinPreference ?? this.proteinPreference();
    const prep = preferences ? preferences.maxPrepMinutes : this.maxPrepMinutes();
    return `${meals === 'NO_FASTING_3_MEALS' ? 'Breakfast, lunch and dinner' : 'Lunch and dinner'} · ${diet === 'ANY' ? 'any eating style' : diet.toLowerCase()} · ${prep ? 'up to ' + prep + ' minutes' : 'any prep time'}`;
  }

  selectDay(index: number): void {
    this.selectedDayIndex.set(index);
  }

  selectedDay(): DayPlan | null {
    const plan = this.displayPlan();
    if (!plan?.daysPlan?.length) return null;
    const index = Math.min(this.selectedDayIndex(), plan.daysPlan.length - 1);
    return plan.daysPlan[index] ?? null;
  }

  dayPillTop(dateStr: string): string {
    return this.relativeDayLabel(dateStr, 'short');
  }

  dayPillBottom(dateStr: string): string {
    return this.formatDate(dateStr, { day: 'numeric' });
  }


  // Eating style — the backend currently treats FASTING_16_8 and FASTING_18_6
  // identically (both produce a 2-meal lunch+dinner day), so the UI only
  // exposes the two choices that actually behave differently.
  fastingStyle = signal<'NO_FASTING_3_MEALS' | 'FASTING_16_8'>('NO_FASTING_3_MEALS');

  // Focus areas
  /** Optional prep-time limit in minutes; null means no limit. */
  maxPrepMinutes = signal<number | null>(null);
  readonly prepOptions: { label: string; value: number | null }[] = [
    { label: 'Any', value: null },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
  ];

  readonly allergens = ALLERGENS;
  readonly restrictions = computed(() => this.foodRestrictions.restrictions());
  readonly foodSaving = this.foodRestrictions.saving;
  newDislike = '';

  hasAllergy(code: AllergenCode): boolean {
    return this.restrictions().allergies.includes(code);
  }

  toggleAllergy(code: AllergenCode) {
    void this.foodRestrictions.toggleAllergy(code).catch(() => this.error.set('Could not save this allergy choice. It has not changed. Please try again.'));
  }

  async addDislike() {
    try { await this.foodRestrictions.addDislike(this.newDislike); this.newDislike = ''; }
    catch { this.error.set('Could not save this food exclusion. Please try again.'); }
  }

  removeDislike(food: string) {
    void this.foodRestrictions.removeDislike(food).catch(() => this.error.set('Could not remove this food exclusion. Please try again.'));
  }

  /** True when allergies or dislikes changed after the current plan was made. */
  readonly restrictionsChanged = computed(() => {
    const plan = this.plan();
    if (!plan) return false;
    return !sameRestrictions(
      plan.madeWith ? { allergies: plan.madeWith.allergies as AllergenCode[], dislikes: plan.madeWith.dislikes } : null,
      this.restrictions(),
    );
  });




  readonly unfilledLabel = computed(() => {
    const unfilled = this.displayPlan()?.unfilled ?? [];
    if (!unfilled.length) return null;
    const names = unfilled.map((t) => t.charAt(0) + t.slice(1).toLowerCase());
    return names.join(' and ');
  });

  // Protein preference
  proteinPreference = signal<ProteinPreference>('ANY');

  // Plan duration (weekly/biweekly/monthly)
  duration = signal<PlanDuration>(7);

  // Stores the plan result (typed)
  plan = signal<GenerateMealPlanResponse | null>(null);

  isLoading = signal(false);
  error = signal<string | null>(null);


  setDuration(value: string | number | undefined | null) {
    if (value === undefined || value === null) return;
    const n = Number(value) as PlanDuration;
    if (n === 7 || n === 14 || n === 30) this.duration.set(n);
  }

  setProteinPreference(value: string | undefined | null) {
    if (PROTEIN_PREFERENCES.includes(value as ProteinPreference)) {
      this.proteinPreference.set(value as ProteinPreference);
      void this.focusPreferences.saveDiet(value as ProteinPreference);
    }
  }

  private indexOfTodayOrFirst(plan: GenerateMealPlanResponse): number {
    const today = this.todayLocalYYYYMMDD();
    const index = plan.daysPlan.findIndex((d) => d.date === today);
    return index >= 0 ? index : 0;
  }

  private relativeDayLabel(dateStr: string, weekdayFormat: 'long' | 'short'): string {
    const today = this.todayLocalYYYYMMDD();
    const tomorrow = this.formatDateISO(this.addDays(this.parseLocalDate(today) ?? new Date(), 1));
    if (dateStr === today) return 'Today';
    if (dateStr === tomorrow) return 'Tomorrow';
    return this.formatDate(dateStr, { weekday: weekdayFormat });
  }

  planStartDate(): string {
    const manualStart = this.startDateISO();
    if (manualStart) return manualStart;
    return this.todayLocalYYYYMMDD();
  }

  planEndDate(): string {
    const start = this.parseLocalDate(this.planStartDate());
    if (!start) return this.planStartDate();
    return this.formatDateISO(this.addDays(start, this.duration() - 1));
  }

  private formatDateISO(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  planRangeLabel(): string {
    const start = this.planStartDate();
    const end = this.planEndDate();
    const startLabel = this.formatDate(start, { month: 'short', day: 'numeric' });
    const endLabel = this.formatDate(end, { month: 'short', day: 'numeric' });
    return `${startLabel} - ${endLabel}`;
  }

  planStartDayLabel(): string {
    return this.relativeDayLabel(this.planStartDate(), 'long');
  }

  planStartDateLabel(): string {
    return this.formatDate(this.planStartDate(), { month: 'short', day: 'numeric' });
  }

  planEndDayLabel(): string {
    return this.formatDate(this.planEndDate(), { weekday: 'long' });
  }

  planEndDateLabel(): string {
    return this.formatDate(this.planEndDate(), { month: 'short', day: 'numeric' });
  }

  savedRangeLabel() { const days = this.plan()?.daysPlan; return days?.length ? `${this.formatDate(days[0].date, { month: 'short', day: 'numeric' })} – ${this.formatDate(days[days.length - 1].date, { month: 'short', day: 'numeric' })}` : ''; }

  mealTypeLabel(type: MealPlanItem['mealType']): string {
    switch (type) {
      case 'BREAKFAST':
        return 'Breakfast';
      case 'LUNCH':
        return 'Lunch';
      case 'DINNER':
        return 'Dinner';
      case 'SNACK':
        return 'Snack';
      default:
        return type;
    }
  }

  mealTypeClass(type: MealPlanItem['mealType']): string {
    switch (type) {
      case 'BREAKFAST':
        return 'chip chip-breakfast';
      case 'LUNCH':
        return 'chip chip-lunch';
      case 'DINNER':
        return 'chip chip-dinner';
      case 'SNACK':
        return 'chip chip-snack';
      default:
        return 'chip';
    }
  }

  /** Factual tags only. Score-based labels ("anti-inflammatory", "iron-rich") aren't shown. */
  mealHighlights(meal: MealPlanItem): string[] {
    const factual = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'quick', 'meal-prep', 'no-cook'];
    return (meal.tags ?? [])
      .map((t) => t.toLowerCase())
      .filter((t) => factual.includes(t))
      .slice(0, 2)
      .map((t) => t.replace(/-/g, ' '))
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1));
  }

  challenges(): ChallengeDefinition[] {
    return this.challengesService.definitions();
  }

  challengeProgress(def: ChallengeDefinition): ChallengeProgress | null {
    return this.challengesService.progress(def);
  }

  challengeParticipants(def: ChallengeDefinition): number | null {
    return this.challengesService.count(def.id);
  }

  joinChallenge(def: ChallengeDefinition): void {
    this.challengesService.join(def.id);
  }

  leaveChallenge(def: ChallengeDefinition): void {
    this.challengesService.leave(def.id);
  }

  resetChallenge(def: ChallengeDefinition): void {
    this.challengesService.leave(def.id);
    this.challengesService.join(def.id);
  }

  cookedProgress(): { done: number; total: number } {
    const plan = this.plan();
    if (!plan) return { done: 0, total: 0 };

    let total = 0;
    let done = 0;
    for (const day of plan.daysPlan) {
      for (const meal of day.meals) {
        total++;
        if (this.mealProgress.isCooked(day.date, meal.mealId)) done++;
      }
    }
    return { done, total };
  }

  goToGroceryList(): void {
    if (this.previewPlan()) return;
    this.router.navigateByUrl('/tabs/tab3');
  }

  generatePlan() {
    if (!this.ready() || this.isLoading() || this.savingPlan() || this.foodSaving()) return;
    const startDate = this.planStartDate();
    if (startDate < this.today || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) { this.error.set('Choose today or a future date for the new plan.'); return; }
    if (!this.authService.hasValidToken()) {
      this.router.navigateByUrl('/auth?mode=login');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const payload: GenerateMealPlanRequest = {
      duration: (this.duration() === 7
        ? 'DAYS_7'
        : this.duration() === 14
        ? 'DAYS_14'
        : 'DAYS_30') as Duration,

      fastingStyle: this.fastingStyle(),
      proteinPreference: this.proteinPreference(),
      maxPrepMinutes: this.maxPrepMinutes(),
      allergies: this.restrictions().allergies,
      dislikes: this.restrictions().dislikes,
    };

    this.mealPlansService.generate(payload).subscribe({
      next: (res) => {
        try {
          this.previewPlan.set(startPlanOn({ ...res, madeWith: { allergies: payload.allergies, dislikes: payload.dislikes }, preferences: { ...payload, startDate } }, startDate));
          this.selectedDayIndex.set(0); this.preferencesOpen.set(false);
          this.planStatus.set('Preview ready. Swap anything you don’t want before saving.');
        } catch (error) { this.error.set(error instanceof Error ? error.message : 'Could not prepare a preview.'); }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to generate meal plan', err);
        this.error.set('Could not make a plan. Your saved meals are still here. Check your connection and try again.');
        this.isLoading.set(false);
      },
    });
  }

  openMealDetails(mealId: string, date: string) {
    if (!mealId) return;
    // A preview recipe must not mark a meal in the saved plan as cooked.
    this.router.navigate(['/meal-details', mealId], { queryParams: this.previewPlan() ? {} : { date } });
  }

  // --- Custom challenges ---

  customChallenges(): CustomChallengeResponse[] {
    return this.customChallengesService.list();
  }

  customChallengeProgress(challenge: CustomChallengeResponse): ChallengeProgress | null {
    return this.customChallengesService.progress(challenge);
  }

  membersFor(challengeId: string): ChallengeMemberResponse[] {
    return this.membersCache()[challengeId] ?? [];
  }

  extraMemberCount(challengeId: string): number {
    return Math.max(0, this.membersFor(challengeId).length - 5);
  }

  private loadAllCustomChallengeMembers(): void {
    for (const challenge of this.customChallengesService.list()) {
      this.loadMembersFor(challenge.id);
    }
  }

  private loadMembersFor(challengeId: string): void {
    if (this.membersCache()[challengeId] || this.loadingMembersFor.has(challengeId)) return;
    this.loadingMembersFor.add(challengeId);
    this.customChallengesService.getMembers(challengeId).subscribe({
      next: (members) => {
        this.membersCache.update((cache) => ({ ...cache, [challengeId]: members }));
        this.loadingMembersFor.delete(challengeId);
      },
      error: () => {
        this.loadingMembersFor.delete(challengeId);
      },
    });
  }

  openCreateModal(): void {
    this.createError.set(null);
    this.createdChallenge.set(null);
    this.newChallengeName = '';
    this.newChallengeDescription = '';
    this.newChallengeType.set('meals-in-period');
    this.newChallengeTarget = 10;
    this.newChallengeDuration = 14;
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  isStreakType(): boolean {
    return this.newChallengeType() === 'streak';
  }

  submitCreateChallenge(): void {
    const name = this.newChallengeName.trim();
    if (!name) {
      this.createError.set('Give your challenge a name.');
      return;
    }
    if (this.newChallengeTarget < 1) {
      this.createError.set('Target needs to be at least 1.');
      return;
    }

    // Streak challenges only need a target (the streak length) — give a
    // small buffer window automatically rather than asking for a separate
    // duration, same ratio as the built-in "3-Day Cooking Streak".
    const durationDays = this.isStreakType()
      ? this.newChallengeTarget + 2
      : this.newChallengeDuration;

    if (durationDays < this.newChallengeTarget) {
      this.createError.set('Duration needs to be at least as long as the target.');
      return;
    }

    this.creatingChallenge.set(true);
    this.createError.set(null);

    this.customChallengesService.create(
      name,
      this.newChallengeDescription.trim() || undefined,
      this.newChallengeType(),
      this.newChallengeTarget,
      durationDays,
      (challenge) => {
        this.creatingChallenge.set(false);
        this.createdChallenge.set(challenge);
      },
      (message) => {
        this.creatingChallenge.set(false);
        this.createError.set(message);
      },
    );
  }

  openJoinModal(): void {
    this.joinError.set(null);
    this.joinCode = '';
    this.joinModalOpen.set(true);
  }

  closeJoinModal(): void {
    this.joinModalOpen.set(false);
  }

  submitJoinCode(): void {
    const code = this.joinCode.trim();
    if (!code) {
      this.joinError.set('Enter a code first.');
      return;
    }

    this.joiningChallenge.set(true);
    this.joinError.set(null);

    this.customChallengesService.joinByCode(
      code,
      () => {
        this.joiningChallenge.set(false);
        this.closeJoinModal();
      },
      (message) => {
        this.joiningChallenge.set(false);
        this.joinError.set(message);
      },
    );
  }

  async shareChallenge(challenge: CustomChallengeResponse): Promise<void> {
    const message = `Join my "${challenge.name}" challenge on Sanelle! Use code ${challenge.inviteCode} in the app to join me.`;
    try {
      await Share.share({
        title: challenge.name,
        text: message,
        dialogTitle: 'Invite someone to your challenge',
      });
    } catch {
      // Share sheet dismissed/cancelled, or unavailable on this platform — nothing to show.
    }
  }
}
