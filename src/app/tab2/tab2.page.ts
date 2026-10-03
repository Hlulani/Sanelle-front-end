import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButton,
  IonText,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonModal,
  IonListHeader,
  IonAvatar,
  IonButtons,
  IonDatetime,
  IonIcon,
  IonSpinner,
  IonInput,
  IonTextarea,
  AlertController,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

import {
  MealPlansService,
  Duration,
  GenerateMealPlanRequest,
  GenerateMealPlanResponse,
  MealPlanItem,
  DayPlan,
  ProteinPreference,
} from '../core/services/meal-plans.service';
import { AuthService } from '../core/auth/auth.service';
import { FocusPreferencesService } from '../core/services/focus-preferences.service';
import { NotificationService } from '../core/services/notification.service';
import { Router } from '@angular/router';
import { PlanStoreService } from '../core/services/plan-store.service';
import { MealService } from '../core/services/meal.service';
import { MealResponse } from '../core/models/meal.model';
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
};

import { mealImageSrc } from '../shared/meal-photos';

@Component({
  selector: 'app-tab2',
  standalone: true,
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    InitialAvatarComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonButton,
    IonText,
    IonList,
    IonSegment,
    IonSegmentButton,
    IonModal,
    IonListHeader,
    IonAvatar,
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
  private mealService = inject(MealService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private planStore = inject(PlanStoreService);
  mealProgress = inject(MealProgressService);
  challengesService = inject(ChallengesService);
  customChallengesService = inject(CustomChallengesService);
  private focusPreferences = inject(FocusPreferencesService);
  private notifications = inject(NotificationService);
  private alertController = inject(AlertController);

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
    void this.mealProgress.init();
    void this.challengesService.init();
    this.challengesService.refreshCounts();

    void this.focusPreferences.loadDiet().then((diet) => {
      if (diet) this.proteinPreference.set(diet);
    });

    void this.customChallengesService.init().then(() => {
      this.customChallengesService.refresh(() => this.loadAllCustomChallengeMembers());
    });

    this.planStore.plan$.subscribe((plan) => {
      this.plan.set(plan);
      if (plan) this.selectedDayIndex.set(this.indexOfTodayOrFirst(plan));
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

  selectedDayIndex = signal<number>(0);
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
    this.swapMeal.set(meal);
    this.swapOptions.set([]);
    this.swapModalOpen.set(true);
    this.swapLoading.set(true);

    this.mealService.getMeals().subscribe({
      next: (meals) => {
        const options = meals
          .filter((m) => m.mealType === meal.mealType && m.id !== meal.mealId)
          .filter((m) => this.matchesProteinPreference(m))
          .filter((m) => this.withinPrepLimit(m.prepTimeMinutes))
          .map((m): SwapOption => ({
            id: m.id,
            name: m.name,
            imageUrl: m.imageUrl ?? null,
            meta: this.swapMetaLabel(m),
            tags: m.tags ?? [],
            prepTimeMinutes: m.prepTimeMinutes ?? null,
          }));

        this.swapOptions.set(options);
        this.swapLoading.set(false);
      },
      error: () => {
        this.swapOptions.set([]);
        this.swapLoading.set(false);
      },
    });
  }

  private swapMetaLabel(meal: MealResponse): string {
    const tag = meal.tags?.[0];
    const parts: string[] = [];
    if (tag) parts.push(tag.charAt(0).toUpperCase() + tag.slice(1));
    if (meal.prepTimeMinutes) parts.push(`${meal.prepTimeMinutes} min`);
    return parts.join(' · ') || 'Alternative option';
  }

  private classifyProtein(meal: MealResponse): 'MEATY' | 'VEGETARIAN' | 'VEGAN' {
    const meatKeywords = [
      'chicken', 'beef', 'turkey', 'pork', 'ham', 'bacon', 'salmon',
      'tuna', 'shrimp', 'cod', 'halibut', 'mackerel', 'sardine', 'trout', 'fish',
    ];
    const dairyEggHoneyKeywords = ['egg', 'cheese', 'yogurt', 'yoghurt', 'milk', 'butter', 'cream', 'honey'];
    const names = meal.ingredients.map((i) => i.name.toLowerCase());

    if (names.some((n) => meatKeywords.some((k) => n.includes(k)))) return 'MEATY';

    const taggedVegan = meal.tags?.some((t) => t.toLowerCase() === 'vegan');
    const noDairyEggHoney = !names.some((n) => dairyEggHoneyKeywords.some((k) => n.includes(k)));
    return taggedVegan || noDairyEggHoney ? 'VEGAN' : 'VEGETARIAN';
  }

  private matchesProteinPreference(meal: MealResponse): boolean {
    const pref = this.proteinPreference();
    if (pref === 'ANY') return true;

    const proteinClass = this.classifyProtein(meal);
    if (pref === 'MEATY') return proteinClass === 'MEATY';
    if (pref === 'VEGETARIAN') return proteinClass !== 'MEATY';
    return proteinClass === 'VEGAN';
  }

  closeSwap() {
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

  applySwap(option: SwapOption) {
    const current = this.swapMeal();
    if (!current) return;

    const plan = this.plan();
    if (!plan) return;

    const updated: GenerateMealPlanResponse = {
      ...plan,
      daysPlan: plan.daysPlan.map((day) => ({
        ...day,
        meals: day.meals.map((meal) => {
          if (meal.mealId !== current.mealId) return meal;
          return {
            ...meal,
            mealId: option.id,
            name: option.name,
            imageUrl: option.imageUrl ?? meal.imageUrl ?? null,
            tags: option.tags,
            prepTimeMinutes: option.prepTimeMinutes ?? null,
            reasons: this.swapReasons(option),
          };
        }),
      })),
    };

    this.planStore.setPlan(updated);
    this.closeSwap();
  }

  selectDay(index: number): void {
    this.selectedDayIndex.set(index);
  }

  selectedDay(): DayPlan | null {
    const plan = this.plan();
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

  withinPrepLimit(prep: number | null | undefined): boolean {
    const limit = this.maxPrepMinutes();
    return limit === null || (prep != null && prep <= limit);
  }

  /** Same wording the backend uses, so swapped meals explain themselves too. */
  private swapReasons(option: SwapOption): string[] {
    const reasons: string[] = [];
    const pref = this.proteinPreference();
    if (pref === 'VEGAN') reasons.push('Vegan, as you chose');
    else if (pref === 'VEGETARIAN') reasons.push('Vegetarian, as you chose');
    else if (pref === 'MEATY') reasons.push('Includes meat or fish, as you chose');
    const limit = this.maxPrepMinutes();
    if (option.prepTimeMinutes != null) {
      reasons.push(limit !== null ? `Ready in ${option.prepTimeMinutes} min (your limit is ${limit})` : `Ready in ${option.prepTimeMinutes} min`);
    }
    return reasons;
  }

  readonly unfilledLabel = computed(() => {
    const unfilled = this.plan()?.unfilled ?? [];
    if (!unfilled.length) return null;
    const names = unfilled.map((t) => t.charAt(0) + t.slice(1).toLowerCase());
    return names.join(' and ');
  });

  // Protein preference
  proteinPreference = signal<ProteinPreference>('ANY');

  // Plan duration (weekly/biweekly/monthly)
  duration = signal<PlanDuration>(30);

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
    if (value === 'ANY' || value === 'MEATY' || value === 'VEGETARIAN' || value === 'VEGAN') {
      this.proteinPreference.set(value);
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
    const p = this.plan();
    if (p?.daysPlan?.length) return p.daysPlan[0].date;
    return this.todayLocalYYYYMMDD();
  }

  planEndDate(): string {
    const p = this.plan();
    if (!this.startDateISO() && p?.daysPlan?.length) return p.daysPlan[p.daysPlan.length - 1].date;
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

  mealImage(meal: { name?: string | null; imageUrl?: string | null }): string | null {
    return mealImageSrc(meal.name, meal.imageUrl);
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

  private heroImageUrl(): string | null {
    const plan = this.plan();
    if (!plan) return null;

    for (const day of plan.daysPlan) {
      for (const meal of day.meals) {
        const src = mealImageSrc(meal.name, meal.imageUrl);
        if (src) return src;
      }
    }
    return null;
  }

  heroBackgroundImage(): string {
    const overlay = 'linear-gradient(145deg, rgba(116, 32, 63, 0.92) 0%, rgba(86, 21, 48, 0.95) 100%)';
    const photo = this.heroImageUrl();
    return photo ? `${overlay}, url(${photo})` : overlay;
  }

  displayName(): string {
    const username = this.authService.getUsername();
    if (username) return username;

    const email = this.authService.getUserEmail();
    if (!email) return 'there';

    const localPart = email.split('@')[0];
    const firstSegment = localPart.split(/[._+]/)[0];
    return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
  }

  goToGroceryList(): void {
    this.router.navigateByUrl('/tabs/tab3');
  }

  generatePlan() {
    if (!this.authService.hasValidToken()) {
      this.router.navigateByUrl('/auth');
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
    };

    this.mealPlansService.generate(payload).subscribe({
      next: (res) => {
        this.planStore.setPlan(res);
        this.preferencesOpen.set(false);
        this.isLoading.set(false);
        void this.notifications.reschedule();
        void this.maybePromptForNotifications();
      },
      error: (err) => {
        console.error('Failed to generate meal plan', err);
        this.error.set('Failed to generate plan');
        this.isLoading.set(false);
      },
    });
  }

  private async maybePromptForNotifications(): Promise<void> {
    if (await this.notifications.hasPromptedBefore()) return;
    if (await this.notifications.isEnabled()) return;

    await this.notifications.markPrompted();

    const alert = await this.alertController.create({
      header: 'Stay on track?',
      message: 'Get a daily nudge to cook and keep your streak going.',
      buttons: [
        { text: 'Not now', role: 'cancel' },
        { text: 'Enable', handler: () => void this.notifications.enable() },
      ],
    });
    await alert.present();
  }

openMealDetails(mealId: string, date: string) {
  if (!mealId) return;
  this.router.navigate(['/meal-details', mealId], { queryParams: { date } });
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
    const message = `Join my "${challenge.name}" challenge on Cook Through! Use code ${challenge.inviteCode} in the app to join me.`;
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
