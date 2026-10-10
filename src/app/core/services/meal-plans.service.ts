import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MealType } from '../models/meal.model';

// "ANY" means no filtering — matches the backend's default/unrecognized-value behavior.
export type ProteinPreference = 'ANY' | 'PESCATARIAN' | 'VEGETARIAN' | 'VEGAN';
export const PROTEIN_PREFERENCES: readonly ProteinPreference[] = ['ANY', 'PESCATARIAN', 'VEGETARIAN', 'VEGAN'];

/** The strict requirements a meal must meet. The server applies every one of them. */
export interface EligibleMealsRequest {
  /** Null for every meal type. */
  mealType: MealType | null;
  /** A meal to leave out, e.g. the one being swapped. */
  currentMealId: string | null;
  proteinPreference: ProteinPreference;
  maxPrepMinutes: number | null;
  /** Allergen codes; the server leaves out meals that contain or may contain them. */
  allergies: string[];
  /** Food names to leave out (strict avoidances and cultural requirements). */
  dislikes: string[];
}

export interface MealPlanItem {
  mealType: MealType;
  mealId: string;
  name: string;
  imageUrl: string | null;
  tags: string[];
  prepTimeMinutes?: number | null;
  /** The person's own criteria this meal meets ("why this meal"). */
  reasons?: string[];
}

@Injectable({ providedIn: 'root' })
export class MealPlansService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Meals that meet every strict requirement, filtered on the server. */
  swapOptions(req: EligibleMealsRequest): Observable<MealPlanItem[]> {
    return this.http.post<MealPlanItem[]>(`${this.baseUrl}/meal-plans/swap-options`, req);
  }
}
