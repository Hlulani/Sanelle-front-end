import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { MealService } from '../../core/services/meal.service';
import { MealResponse } from '../../core/models/meal.model';
import { EvidenceTopicsService } from '../evidence-topics.service';
import {
  EvidenceTopic,
  OUTCOME_LABELS,
  OutcomeFinding,
  OutcomeVerdict,
  STUDY_DESIGN_LABELS,
  Study,
} from '../evidence.model';
import { containsDairy } from '../food-matchers';

const VERDICT_LABELS: Record<OutcomeVerdict, string> = {
  mixed: 'Mixed results',
  'association-lower': 'Linked with lower rates',
  'association-higher': 'Linked with higher rates',
  'none-found': 'No studies found',
};

type MealsState = { state: 'loading' } | { state: 'error' } | { state: 'ready'; meals: MealResponse[] };

@Component({
  selector: 'app-food-clarity',
  standalone: true,
  imports: [CommonModule, IonContent],
  templateUrl: './food-clarity.page.html',
  styleUrls: ['./food-clarity.page.scss'],
})
export class FoodClarityPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private topics = inject(EvidenceTopicsService);
  private mealService = inject(MealService);

  readonly outcomeLabels = OUTCOME_LABELS;
  readonly verdictLabels = VERDICT_LABELS;
  readonly designLabels = STUDY_DESIGN_LABELS;

  topic: EvidenceTopic | null = null;
  readonly open = signal<string | null>('incidence');
  readonly meals = signal<MealsState>({ state: 'loading' });

  ngOnInit() {
    this.topic = this.topics.get(this.route.snapshot.paramMap.get('id') ?? '');
    if (this.topic?.relatedFood) this.loadMeals();
  }

  back() {
    this.router.navigateByUrl('/tabs/today');
  }

  toggle(f: OutcomeFinding) {
    if (!f.studyIds.length) return;
    this.open.set(this.open() === f.outcome ? null : f.outcome);
  }

  studiesFor(f: OutcomeFinding): Study[] {
    return (this.topic?.studies ?? []).filter((s) => f.studyIds.includes(s.id));
  }

  researchedLabel(): string {
    const iso = this.topic?.review.researchedOn;
    if (!iso) return '';
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  }

  loadMeals() {
    this.meals.set({ state: 'loading' });
    this.mealService.getMeals().subscribe({
      next: (all) => this.meals.set({ state: 'ready', meals: all.filter((m) => containsDairy(m.ingredients)).slice(0, 3) }),
      error: () => this.meals.set({ state: 'error' }),
    });
  }

  openMeal(m: MealResponse) {
    this.router.navigate(['/meal-details', m.id]);
  }
}
