import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth/auth.service';
import { PlanStoreService } from '../core/services/plan-store.service';
import { MealPlanItem } from '../core/services/meal-plans.service';
import { HealthRepository } from '../my-health/health-repository';
import { FINDINGS, FINDING_KEYS, FindingKey, findingOrUnknown } from '../my-health/diagnosis.model';
import { FocusPreferencesService } from '../core/services/focus-preferences.service';
import { contextLine, diagnosisStep, leadArea, nextStep, supportingAreas } from './next-step';
import { SupportId, supportActions } from './checkin-support';
import { SupportUsedService } from './support-used.service';
import { impactLine, symptomParts } from '../my-health/checkins';
import { SymptomEntry } from '../my-health/diagnosis.model';
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
  private focusPreferences = inject(FocusPreferencesService);
  private route = inject(ActivatedRoute);
  private supportUsed = inject(SupportUsedService);

  private readonly plan = toSignal(this.planStore.plan$, { initialValue: null });

  readonly defs = FINDINGS;
  readonly mealTypeLabels = MEAL_TYPE_LABELS;
  /** At most two neutral example questions, only for topics that exist in this build. */
  readonly foodExamples = [
    { id: 'dairy', text: 'Do I need to avoid dairy?' },
    { id: 'soy', text: 'What does research say about soy?' },
  ].filter((e) => !!this.topics.get(e.id));
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

  /** The single next action at the top of Today, led by what someone wants help with. */
  readonly next = computed(() => nextStep(this.health.record(), this.focusPreferences.focus()));

  readonly ask = computed(() => {
    const n = this.next();
    return n.kind === 'ask' ? n : null;
  });

  readonly progress = computed(() => {
    const n = this.next();
    return n.kind === 'continue' ? n : null;
  });

  readonly lead = computed(() => leadArea(this.focusPreferences.focus()));
  readonly supporting = computed(() => supportingAreas(this.focusPreferences.focus()));
  readonly contextLine = computed(() => contextLine(this.focusPreferences.focus()));
  /** The diagnosis entry when it isn't the lead: start, carry on, or nothing (rows show instead). */
  readonly diagnosisEntry = computed(() => diagnosisStep(this.health.record()));

  readonly questionCount = computed(() => this.health.record().questions.length);
  readonly todayIso = localIsoDate(new Date());
  readonly todayEntry = computed(() => (this.health.record().symptoms ?? []).find((s) => s.date === this.todayIso) ?? null);
  /** True right after saving today's check-in, for the "saved" confirmation. */
  readonly justCheckedIn = signal(false);
  readonly support = computed(() => {
    const entry = this.todayEntry();
    if (!entry) return [];
    return supportActions({
      entry,
      questions: this.health.record().questions,
      focus: this.focusPreferences.focus(),
      usedToday: this.supportUsed.used(),
    });
  });

  readonly todaysMeals = computed<MealPlanItem[]>(() => {
    const plan = this.plan();
    if (!plan) return [];
    const today = localIsoDate(new Date());
    return plan.daysPlan.find((d) => d.date === today)?.meals ?? [];
  });

  readonly hasPlan = computed(() => !!this.plan());

  /** Anything recorded, planned or logged. Until then Today only shows where to begin. */
  readonly started = computed(() => {
    const r = this.health.record();
    return this.hasRecords() || r.questions.length > 0 || !!r.appointment.date || (r.symptoms ?? []).length > 0 || this.hasPlan();
  });

  ngOnInit() {
    void this.planStore.init();
  }

  ionViewWillEnter() {
    void this.health.load();
    void this.focusPreferences.loadFocus();
    void this.supportUsed.load(this.todayIso);
    this.justCheckedIn.set(this.route.snapshot.queryParamMap.get('checkin') === this.todayIso);
  }

  impactOf(e: SymptomEntry): string | null {
    return impactLine(e);
  }

  partsOf(e: SymptomEntry): string[] {
    return symptomParts(e);
  }

  useSupport(id: SupportId) {
    void this.supportUsed.markUsed(id, this.todayIso);
  }

  name(): string {
    return this.auth.getUsername() || '';
  }

  /** Starts, or picks up, the diagnosis questions; "Finish later" brings her back here. */
  record(key: FindingKey = 'count') {
    this.router.navigate(['/health/record', key], { queryParams: { flow: 1, from: 'today' } });
  }

  async saveQuestion(step: { key: FindingKey; question: string }) {
    await this.health.addQuestion(step.question, step.key);
    this.justSaved.set(step.question);
  }

  openMeal(meal: MealPlanItem) {
    this.router.navigate(['/meal-details', meal.mealId]);
  }

  planMeals() {
    this.router.navigateByUrl('/tabs/tab2');
  }
}
