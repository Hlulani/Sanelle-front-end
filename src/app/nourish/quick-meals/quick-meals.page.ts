import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MealPlanItem, MealPlansService, ProteinPreference } from '../../core/services/meal-plans.service';
import { FocusPreferencesService } from '../../core/services/focus-preferences.service';
import { FoodRestrictionsService } from '../../core/services/food-restrictions.service';
import { MealImageComponent } from '../../shared/components/meal-image/meal-image.component';
import { MEAL_TYPE_LABELS } from '../../core/models/meal.model';

export const QUICK_MINUTES = 15;
const TYPES = (['BREAKFAST', 'LUNCH', 'DINNER'] as const).map((type) => ({ type, label: MEAL_TYPE_LABELS[type] }));

/**
 * Low-effort meals for today: 15 minutes or less, filtered on the server by her saved diet,
 * allergies and foods she doesn't eat. Explained by what the meal is, never as a remedy.
 */
@Component({
  selector: 'app-quick-meals',
  standalone: true,
  imports: [RouterLink, IonContent, MealImageComponent],
  templateUrl: './quick-meals.page.html',
  styleUrls: ['./quick-meals.page.scss'],
})
export class QuickMealsPage implements OnInit {
  private plans = inject(MealPlansService);
  private focus = inject(FocusPreferencesService);
  private food = inject(FoodRestrictionsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly minutes = QUICK_MINUTES;
  readonly sections = signal<{ label: string; meals: MealPlanItem[] }[] | null>(null);
  readonly error = signal(false);
  readonly hasAllergies = signal(false);

  async ngOnInit() {
    const [diet] = await Promise.all([this.focus.loadDiet(), this.food.load()]);
    const { allergies, dislikes } = this.food.restrictions();
    this.hasAllergies.set(allergies.length > 0 || dislikes.length > 0);
    const proteinPreference: ProteinPreference = diet ?? 'ANY';
    forkJoin(
      TYPES.map((t) =>
        this.plans
          .swapOptions({ mealType: t.type, currentMealId: null, proteinPreference, maxPrepMinutes: QUICK_MINUTES, allergies, dislikes })
          .pipe(catchError(() => of(null))),
      ),
    ).subscribe((results) => {
      if (results.every((r) => r === null)) {
        this.error.set(true);
        return;
      }
      this.sections.set(
        TYPES.map((t, i) => ({
          label: t.label,
          // Quickest first, a few per meal, so the choice stays small.
          meals: [...(results[i] ?? [])].sort((a, b) => (a.prepTimeMinutes ?? 99) - (b.prepTimeMinutes ?? 99)).slice(0, 3),
        })).filter((s) => s.meals.length),
      );
    });
  }

  /** "Ready in 10 min · Vegetarian, as you chose": attributes only. */
  why(m: MealPlanItem): string {
    return (m.reasons ?? []).map((r) => r.replace(/ \(your limit is \d+\)$/, '')).join(' · ');
  }

  back() {
    this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('from') === 'today' ? '/tabs/today' : '/tabs/tab2');
  }
}
