import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../my-health/health-repository';
import { MealImageComponent } from '../shared/components/meal-image/meal-image.component';
import { MealPlanStore } from '../food/meal-plan.store';
import { PRIORITIES, Priority, ProfileService } from '../core/profile/profile.service';
import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { FigmaIconComponent } from '../shared/design/figma/figma-icon.component';
import { PatientDesignState } from '../shared/design/figma/patient-design-state.service';
import { CareReminders } from '../my-health/care-reminders.service';
import { localIsoDate } from '../shared/calendar-date';
import { impactLine, symptomParts } from '../my-health/checkins';
import { dayName, nextStep, recentActivity, whenLabel } from './today-state';

interface Intent {
  priority: Priority;
  title: string;
  hint: string;
  route: string;
  /** The button on the first-use card: says exactly what tapping it does. */
  action: string;
}

const INTENTS: Record<Priority, Intent> = {
  diagnosis: {
    priority: 'diagnosis',
    title: 'Understand my scan',
    hint: 'Add your report and see what it says',
    route: '/tabs/health',
    action: 'Add my report',
  },
  food: {
    priority: 'food',
    title: 'Figure out food',
    hint: 'Plan meals or find one for today',
    route: '/tabs/food',
    action: 'Plan my meals',
  },
  symptoms: {
    priority: 'symptoms',
    title: 'Log how I feel',
    hint: 'A short check-in for today',
    route: `/health/check-in/today`,
    action: 'Start a check-in',
  },
  appointment: {
    priority: 'appointment',
    title: 'Prepare for a visit',
    hint: 'Questions and a summary to take with you',
    route: '/tabs/appointment',
    action: 'Add a question',
  },
};

/**
 * TOD-01 on first use: what she wants to do now. Afterwards TOD-02: one next step from what she
 * saved, then TOD-03: what she did and where it went.
 */
@Component({
  selector: 'app-today',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, RouterLink, MealImageComponent, FigmaFrameComponent, FigmaIconComponent],
  templateUrl: './today.page.html',
})
export class TodayPage implements OnInit {
  readonly design = inject(PatientDesignState);
  readonly plannedToday = computed(() => this.plans.today());
  readonly savedServings = computed(() => this.plans.plan()?.servings ?? 1);
  get profileView() {
    return { fibroidCount: this.design.count(), largestSize: this.design.size() };
  }
  get latestCheckIn() {
    return this.design.latestView();
  }
  get savedReport() {
    return this.design.savedReport();
  }
  get hasMealPlan() {
    return !!this.plans.plan();
  }
  readonly sourceNext = computed(() => {
    const n = this.next();
    const item = {
      eyebrow: 'Choose what helps',
      title: 'What would be useful today?',
      text: 'Start with your report, food, symptoms, or an appointment question.',
      action: 'Review my health',
      icon: 'home',
      route: '/tabs/health',
      params: {} as Record<string, string>,
    };
    if (n.kind === 'appointment')
      return {
        ...item,
        eyebrow: 'Coming up',
        title: 'Prepare for your appointment',
        text: `Your appointment is saved for ${n.date}. Review your questions and health summary.`,
        action: 'Review appointment summary',
        icon: 'visit',
        route: '/tabs/appointment',
      };
    if (n.kind === 'review')
      return {
        ...item,
        eyebrow: 'Follow-up',
        title: n.title,
        text: `Review ${n.date}.`,
        action: 'See my next steps',
        icon: 'visit',
        route: '/tabs/appointment',
      };
    if (n.kind === 'report')
      return {
        ...item,
        eyebrow: 'Unfinished report',
        title: 'Finish checking what Sanelle captured',
        text: `${n.report.title} is saved, but its extracted details still need your confirmation.`,
        action: 'Check report details',
        icon: 'health',
        route: '/health/report/check',
        params: { id: n.report.id },
      };
    if (n.kind === 'checkin') {
      const e = this.design.checkin(n.entry);
      return {
        ...item,
        eyebrow: 'Your latest check-in',
        title: e.symptoms.join(', ') || 'Check-in saved',
        text: `${e.impact}. Add another check-in only if something changed.`,
        action: 'See symptom history',
        icon: 'health',
        route: '/health/symptoms',
      };
    }
    if (n.kind === 'meal')
      return {
        ...item,
        eyebrow: 'Your saved meal',
        title: n.day?.meal?.name ?? 'No meal planned today',
        text: 'Your servings, substitutions and shopping list are ready.',
        action: 'Open meal plan',
        icon: 'food',
        route: '/food/plan',
      };
    return item;
  });
  onCloseIntent() {
    void this.choose(null);
  }
  go(screen: string) {
    void this.router.navigateByUrl('/tabs/' + (screen === 'visit' ? 'appointment' : screen));
  }
  openLog() {
    void this.router.navigateByUrl('/health/check-in/today');
  }
  onViewSymptoms() {
    void this.router.navigateByUrl('/health/symptoms');
  }
  openClaim() {
    void this.router.navigate(['/learn/C17'], { queryParams: { from: 'today' } });
  }
  openNext() {
    const n = this.sourceNext();
    void this.router.navigate([n.route], { queryParams: n.params });
  }
  private readonly router = inject(Router);
  private readonly health = inject(HealthRepository);
  private readonly plans = inject(MealPlanStore);
  private readonly profile = inject(ProfileService);
  private readonly reminders = inject(CareReminders);

  readonly today = localIsoDate();
  readonly dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(),
  );
  readonly name = this.profile.name;
  readonly initial = computed(() => (this.name() || 'S').charAt(0).toUpperCase());
  /** Until she chooses a start, or records something after setup: then Today shows what she did instead. */
  readonly firstUse = computed(() => {
    if (this.profile.profile().firstUseDone) return false;
    const r = this.health.record();
    // Setup answers (diagnosis details, an appointment date) don't count: the first-visit card builds on them.
    const recorded =
      r.symptoms.length ||
      r.questions.length ||
      (r.results ?? []).length ||
      (r.reports ?? []).length ||
      !!this.plans.plan();
    return !recorded;
  });

  /** Her priorities first, in the fixed order; then the rest. */
  readonly intents = computed(() => {
    const chosen = this.profile.profile().priorities;
    return [...PRIORITIES.filter((p) => chosen.includes(p)), ...PRIORITIES.filter((p) => !chosen.includes(p))].map(
      (p) => INTENTS[p],
    );
  });

  /** Where a first-use choice starts: the first useful screen, not an empty overview. */
  private start(intent: Intent): Intent {
    if (intent.priority === 'appointment')
      return {
        ...intent,
        title: 'Add your first appointment question',
        route: '/tabs/appointment?start=question',
        hint: this.health.record().appointment.date
          ? 'Your saved date is ready. Start with one question you want to remember.'
          : 'Start with one question. You can add a date whenever you have one.',
      };
    if (intent.priority === 'food')
      return {
        ...intent,
        title: 'Find food that fits your day',
        route: '/food/requirements',
        hint: 'Review your food requirements and practical needs before choosing meals.',
      };
    // Nothing to review yet on a first visit: go straight to adding the report.
    if (intent.priority === 'diagnosis') return { ...intent, route: '/health/report/new' };
    return intent;
  }
  readonly firstAction = computed(() => this.start(this.intents()[0]));
  /** Her other onboarding choices, so picking several never hides any of them. */
  readonly alsoChosen = computed(() => {
    const chosen = this.profile.profile().priorities;
    return this.intents()
      .slice(1)
      .filter((i) => chosen.includes(i.priority))
      .map((i) => this.start(i));
  });
  readonly next = computed(() => nextStep(this.health.record(), this.plans.plan(), this.today));
  readonly activity = computed(() => recentActivity(this.health.record(), this.plans.plan()));
  readonly shortcuts = computed(() => this.intents().filter((i) => !this.isLead(i.priority)));

  ngOnInit() {
    void this.ionViewWillEnter();
  }
  async ionViewWillEnter() {
    await Promise.all([this.health.load(), this.plans.load(), this.profile.load()]);
    void this.reminders.reconcile(this.health.record().tasks ?? []).catch(() => undefined);
  }

  async choose(intent: Intent | null) {
    await this.profile.save({ firstUseDone: true }).catch(() => undefined);
    if (intent) void this.router.navigateByUrl(intent.route);
  }

  when(days: number) {
    return whenLabel(days);
  }

  day(iso: string) {
    return dayName(iso);
  }

  checkinSummary(entry: Parameters<typeof symptomParts>[0]): string {
    return [impactLine(entry), ...symptomParts(entry)].filter(Boolean).join(' · ') || 'A note';
  }

  /** The lead card already covers this destination. */
  private isLead(priority: Priority): boolean {
    const kind = this.next().kind;
    return (
      (priority === 'appointment' && (kind === 'appointment' || kind === 'review')) ||
      (priority === 'diagnosis' && kind === 'report') ||
      (priority === 'symptoms' && kind === 'checkin') ||
      (priority === 'food' && kind === 'meal')
    );
  }
}
