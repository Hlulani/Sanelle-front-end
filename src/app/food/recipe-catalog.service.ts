import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MealResponse } from '../core/models/meal.model';
import { MealService } from '../core/services/meal.service';
import { MealPlansService } from '../core/services/meal-plans.service';
import { FoodProfile } from './food-profile.service';
import { PlannedMeal, toPlannedMeal } from './meal-plan';

/** Main meals: one per day in a plan. */
export const MAIN_MEAL_TYPES = ['LUNCH', 'DINNER'] as const;

/**
 * Recipes and which of them are eligible. The server applies strict requirements (allergies,
 * strict avoidances, cultural requirements, dietary pattern and time limit); preferences are
 * applied on the device, so they never leave it.
 */
@Injectable({ providedIn: 'root' })
export class RecipeCatalog {
  private readonly meals = inject(MealService);
  private readonly plans = inject(MealPlansService);

  private readonly recipesState = signal<Map<string, MealResponse>>(new Map());
  readonly recipes = this.recipesState.asReadonly();
  private loading: Promise<Map<string, MealResponse>> | null = null;

  /** Every recipe with its ingredients, loaded once. */
  loadRecipes(): Promise<Map<string, MealResponse>> {
    if (!this.loading) {
      this.loading = firstValueFrom(this.meals.getMeals())
        .then((list) => {
          const map = new Map(list.map((m) => [m.id, m]));
          this.recipesState.set(map);
          return map;
        })
        .catch((error) => {
          this.loading = null;
          throw error;
        });
    }
    return this.loading;
  }

  recipe(id: string): Promise<MealResponse> {
    const known = this.recipesState().get(id);
    return known ? Promise.resolve(known) : firstValueFrom(this.meals.getMealById(id));
  }

  /** Main meals that meet every strict requirement, checked by the server. */
  async eligibleMainMeals(
    profile: FoodProfile,
    exclusions: string[],
    maxPrepMinutes: number | null = null,
  ): Promise<PlannedMeal[]> {
    const items = await firstValueFrom(
      this.plans.swapOptions({
        mealType: null,
        currentMealId: null,
        proteinPreference: profile.dietaryPattern,
        maxPrepMinutes,
        allergies: profile.allergies,
        dislikes: exclusions,
      }),
    );
    return items.filter((i) => (MAIN_MEAL_TYPES as readonly string[]).includes(i.mealType)).map(toPlannedMeal);
  }
}
