import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../my-health/health-repository';
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
}

const INTENTS: Record<Priority, Intent> = {
  diagnosis: {
    priority: 'diagnosis',
    title: 'Understand my scan',
    hint: 'Add your report and see what it says',
    route: '/tabs/health',
  },
  food: { priority: 'food', title: 'Figure out food', hint: 'Plan meals or find one for today', route: '/tabs/food' },
  symptoms: {
    priority: 'symptoms',
    title: 'Log how I feel',
    hint: 'A short check-in for today',
    route: `/health/check-in/today`,
  },
  appointment: {
    priority: 'appointment',
    title: 'Prepare for a visit',
    hint: 'Questions and a summary to take with you',
    route: '/tabs/appointment',
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
  imports: [IonContent, RouterLink, FigmaFrameComponent, FigmaIconComponent],
  templateUrl: './today.page.html',
})
export class TodayPage implements OnInit {
  readonly design = inject(PatientDesignState);
  readonly mealImage = 'assets/photos/figma-meal.jpg';
  readonly fixedIntents = Object.values(INTENTS);
  readonly intentLabels = Object.values(INTENTS).map((i) => i.title);
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
  chooseIntent(label: string) {
    void this.choose(this.fixedIntents.find((i) => i.title === label) ?? null);
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
  readonly firstUse = computed(() => !this.profile.profile().firstUseDone);

  /** Her priorities first, in the fixed order; then the rest. */
  readonly intents = computed(() => {
    const chosen = this.profile.profile().priorities;
    return [...PRIORITIES.filter((p) => chosen.includes(p)), ...PRIORITIES.filter((p) => !chosen.includes(p))].map(
      (p) => INTENTS[p],
    );
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
