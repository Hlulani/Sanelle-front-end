import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Duration = 'DAYS_7' | 'DAYS_14' | 'DAYS_30';
export type FastingStyle =
  | 'NO_FASTING_3_MEALS'
  | 'FASTING_16_8'
  | 'FASTING_18_6';

// "ANY" means no filtering — matches the backend's default/unrecognized-value behavior.
export type ProteinPreference = 'ANY' | 'MEATY' | 'VEGETARIAN' | 'VEGAN';

export interface GenerateMealPlanRequest {
  duration: Duration;
  fastingStyle: FastingStyle;
  firstMealHour: number;
  fibroidFocus: boolean;
  ironSupport: boolean;
  fiberFocus: boolean;
  proteinPreference: ProteinPreference;
}

export interface MealPlanItem {
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  mealId: string;
  name: string;
  imageUrl: string | null;
  tags: string[];
  antiInflammatoryScore: number;
  ironSupport: number;
  fiberScore: number;
}

export interface DayPlan {
  date: string;
  meals: MealPlanItem[];
}

export interface GenerateMealPlanResponse {
  days: number;
  daysPlan: DayPlan[];
}

@Injectable({ providedIn: 'root' })
export class MealPlansService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  generate(req: GenerateMealPlanRequest): Observable<GenerateMealPlanResponse> {
    return this.http.post<GenerateMealPlanResponse>(`${this.baseUrl}/meal-plans/generate`, req);
  }
}
