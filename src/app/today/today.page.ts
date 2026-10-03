import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth/auth.service';
import { PlanStoreService } from '../core/services/plan-store.service';
import { MealPlanItem } from '../core/services/meal-plans.service';
import { HealthRepository } from '../my-health/health-repository';
import { FINDINGS, FINDING_KEYS, Finding, findingOrUnknown } from '../my-health/diagnosis.model';
import { FindingStatusComponent } from '../my-health/finding-status.component';
import { EvidenceTopicsService } from '../learn/evidence-topics.service';
import { MealImageComponent } from '../shared/components/meal-image/meal-image.component';

const MEAL_TYPE_LABELS: Record<MealPlanItem['mealType'], string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

function localIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type NextStep =
  | { kind: 'start' }
  | { kind: 'ask'; finding: Finding; question: string }
  | { kind: 'summary' };

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, MealImageComponent, FindingStatusComponent],
  templateUrl: './today.page.html',
  styleUrls: ['./today.page.scss'],
})
export class TodayPage implements OnInit {
  private auth = inject(AuthService);
  private planStore = inject(PlanStoreService);
  private router = inject(Router);
  private topics = inject(EvidenceTopicsService);
  private health = inject(HealthRepository);

  private readonly plan = toSignal(this.planStore.plan$, { initialValue: null });

  readonly defs = FINDINGS;
  readonly mealTypeLabels = MEAL_TYPE_LABELS;
  readonly foodTopic = this.topics.get('dairy');
  readonly justSaved = signal<string | null>(null);

  readonly dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  readonly findings = computed(() => FINDING_KEYS.map((k) => findingOrUnknown(this.health.record(), k)));
  readonly hasRecords = this.health.hasAnyFinding;

  /** Days until the appointment, or null if none is set (or it has passed). */
  readonly daysToAppointment = computed(() => {
    const date = this.health.record().appointment.date;
    if (!date) return null;
    const today = new Date(localIsoDate(new Date()) + 'T00:00:00');
    const appt = new Date(date + 'T00:00:00');
    const days = Math.round((appt.getTime() - today.getTime()) / 86400000);
    return days >= 0 ? days : null;
  });

  /** The single next action shown at the top of Today. */
  readonly next = computed<NextStep>(() => {
    if (!this.hasRecords()) return { kind: 'start' };
    const asked = new Set(this.health.record().questions.map((q) => q.text.toLowerCase()));
    const missing = this.findings().find(
      (f) => f.completeness.state === 'unknown' && !asked.has(FINDINGS[f.key].questionIfUnknown.toLowerCase()),
    );
    return missing ? { kind: 'ask', finding: missing, question: FINDINGS[missing.key].questionIfUnknown } : { kind: 'summary' };
  });

  readonly ask = computed(() => {
    const n = this.next();
    return n.kind === 'ask' ? n : null;
  });

  readonly questionCount = computed(() => this.health.record().questions.length);
  readonly todayIso = localIsoDate(new Date());
  readonly loggedToday = computed(() => (this.health.record().symptoms ?? []).some((s) => s.date === this.todayIso));

  readonly todaysMeals = computed<MealPlanItem[]>(() => {
    const plan = this.plan();
    if (!plan) return [];
    const today = localIsoDate(new Date());
    return plan.daysPlan.find((d) => d.date === today)?.meals ?? [];
  });

  readonly hasPlan = computed(() => !!this.plan());

  ngOnInit() {
    void this.planStore.init();
  }

  ionViewWillEnter() {
    void this.health.load();
  }

  name(): string {
    return this.auth.getUsername() || '';
  }

  start() {
    this.router.navigate(['/health/record', 'count'], { queryParams: { flow: 1 } });
  }

  async saveQuestion(step: { finding: Finding; question: string }) {
    await this.health.addQuestion(step.question, step.finding.key);
    this.justSaved.set(step.question);
  }

  openMeal(meal: MealPlanItem) {
    this.router.navigate(['/meal-details', meal.mealId]);
  }

  planMeals() {
    this.router.navigateByUrl('/tabs/tab2');
  }
}
