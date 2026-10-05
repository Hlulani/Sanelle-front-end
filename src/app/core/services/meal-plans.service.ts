import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MealType } from '../models/meal.model';

export type Duration = 'DAYS_7' | 'DAYS_14' | 'DAYS_30';
export type FastingStyle =
  | 'NO_FASTING_3_MEALS'
  | 'FASTING_16_8'
  | 'FASTING_18_6';

// "ANY" means no filtering — matches the backend's default/unrecognized-value behavior.
export type ProteinPreference = 'ANY' | 'PESCATARIAN' | 'VEGETARIAN' | 'VEGAN';
export const PROTEIN_PREFERENCES: readonly ProteinPreference[] = ['ANY', 'PESCATARIAN', 'VEGETARIAN', 'VEGAN'];

/** Everything a plan is built from: the person's own choices, nothing else. */
export interface GenerateMealPlanRequest {
  duration: Duration;
  /** Meal schedule (3 or 2 meals a day). A preference, not a health recommendation. */
  fastingStyle: FastingStyle;
  proteinPreference: ProteinPreference;
  /** Optional upper limit on preparation time, in minutes. */
  maxPrepMinutes: number | null;
  /** Allergen codes; the server leaves out meals that contain or may contain them. */
  allergies: string[];
  /** Foods to leave out by name. */
  dislikes: string[];
}

export interface SwapOptionsRequest {
  mealType: MealPlanItem['mealType'];
  /** Null when not swapping out a meal, e.g. when just finding quick meals. */
  currentMealId: string | null;
  proteinPreference: ProteinPreference;
  maxPrepMinutes: number | null;
  allergies: string[];
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

export interface DayPlan {
  date: string;
  meals: MealPlanItem[];
}

export interface GenerateMealPlanResponse {
  days: number;
  daysPlan: DayPlan[];
  /** Restrictions the plan was made with (added on the device, not by the server). */
  madeWith?: { allergies: string[]; dislikes: string[] };
  /** Meal types no recipe could fill without breaking a preference, e.g. "BREAKFAST". */
  unfilled?: string[];
  preferences?: GenerateMealPlanRequest & { startDate: string };
}

@Injectable({ providedIn: 'root' })
export class MealPlansService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  generate(req: GenerateMealPlanRequest): Observable<GenerateMealPlanResponse> {
    return this.http.post<GenerateMealPlanResponse>(`${this.baseUrl}/meal-plans/generate`, req);
  }

  /** Alternatives for one slot, filtered on the server by the same rules as the plan. */
  swapOptions(req: SwapOptionsRequest): Observable<MealPlanItem[]> {
    return this.http.post<MealPlanItem[]>(`${this.baseUrl}/meal-plans/swap-options`, req);
  }
}
