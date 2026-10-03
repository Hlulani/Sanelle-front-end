import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { GenerateMealPlanResponse } from './meal-plans.service';

const STORAGE_KEY = 'active_meal_plan';

@Injectable({ providedIn: 'root' })
export class PlanStoreService {
  private readonly planSubject = new BehaviorSubject<GenerateMealPlanResponse | null>(null);
  readonly plan$ = this.planSubject.asObservable();

  private hydrated: Promise<void> | null = null;

  init(): Promise<void> {
    if (!this.hydrated) {
      this.hydrated = (async () => {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (!value) return;
        try {
          this.planSubject.next(JSON.parse(value) as GenerateMealPlanResponse);
        } catch {
          this.planSubject.next(null);
        }
      })();
    }
    return this.hydrated;
  }

  setPlan(plan: GenerateMealPlanResponse | null) {
    this.planSubject.next(plan);
    if (plan) {
      void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(plan) });
    } else {
      void Preferences.remove({ key: STORAGE_KEY });
    }
  }

  getPlanSnapshot(): GenerateMealPlanResponse | null {
    return this.planSubject.getValue();
  }
}
