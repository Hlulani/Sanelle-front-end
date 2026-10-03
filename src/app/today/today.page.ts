import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth/auth.service';
import { PlanStoreService } from '../core/services/plan-store.service';
import { MealPlanItem } from '../core/services/meal-plans.service';
import { environment } from '../../environments/environment';
import { DEMO_APPOINTMENT, DEMO_FINDINGS } from '../my-health/demo-records';
import { Finding, QUESTION_FOR_UNKNOWN, SOURCE_LABELS } from '../my-health/diagnosis.model';
import { EvidenceTopicsService } from '../learn/evidence-topics.service';

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
  imports: [CommonModule, RouterLink, IonContent],
  templateUrl: './today.page.html',
  styleUrls: ['./today.page.scss'],
})
export class TodayPage implements OnInit {
  private auth = inject(AuthService);
  private planStore = inject(PlanStoreService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private topics = inject(EvidenceTopicsService);

  private readonly plan = toSignal(this.planStore.plan$, { initialValue: null });

  /** `?demo=off` previews the first-use state in development. */
  readonly showDemo = signal(environment.showDemoRecords);
  readonly appointment = DEMO_APPOINTMENT;
  readonly findings: Finding[] = DEMO_FINDINGS;
  readonly sourceLabels = SOURCE_LABELS;
  readonly mealTypeLabels = MEAL_TYPE_LABELS;

  /** Demo only: the saved state isn't stored yet. */
  readonly savedQuestions = signal<Set<string>>(new Set());

  readonly foodTopic = this.topics.get('dairy');

  readonly dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  readonly todaysMeals = computed<MealPlanItem[]>(() => {
    const plan = this.plan();
    if (!plan) return [];
    const today = localIsoDate(new Date());
    return plan.daysPlan.find((d) => d.date === today)?.meals ?? [];
  });

  readonly hasPlan = computed(() => !!this.plan());

  ngOnInit() {
    void this.planStore.init();
    if (this.route.snapshot.queryParamMap.get('demo') === 'off') this.showDemo.set(false);
  }

  name(): string {
    return this.auth.getUsername() || '';
  }

  unknownFindings(): Finding[] {
    return this.findings.filter((f) => f.completeness.state === 'unknown');
  }

  questionFor(f: Finding): string {
    return QUESTION_FOR_UNKNOWN[f.key];
  }

  isSaved(f: Finding): boolean {
    return this.savedQuestions().has(f.key);
  }

  toggleSaved(f: Finding) {
    const next = new Set(this.savedQuestions());
    if (next.has(f.key)) next.delete(f.key);
    else next.add(f.key);
    this.savedQuestions.set(next);
  }

  openMeal(meal: MealPlanItem) {
    this.router.navigate(['/meal-details', meal.mealId]);
  }

  planMeals() {
    this.router.navigateByUrl('/tabs/tab2');
  }
}
