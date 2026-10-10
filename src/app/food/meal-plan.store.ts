import { Injectable, computed } from '@angular/core';
import { AccountRecordStore } from '../core/storage/account-record-store';
import { UserFacingError } from '../core/errors/errors';
import { localIsoDate } from '../shared/calendar-date';
import { GroceryEdits, MealPlan, PlanDay, PlannedMeal } from './meal-plan';

interface PlanRecord {
  version: 1;
  /** The saved plan. A plan being set up stays on its screen until she saves it. */
  current: MealPlan | null;
}

const KEY_PREFIX = 'sanelle.mealplan.v1.';

function emptyEdits(): GroceryEdits {
  return { have: [], removed: [], added: [] };
}

/** The saved meal plan and its shopping lists, encrypted on this device per account. */
@Injectable({ providedIn: 'root' })
export class MealPlanStore extends AccountRecordStore<PlanRecord> {
  protected readonly keyPrefix = KEY_PREFIX;

  readonly plan = computed(() => this.state().current);
  /** Today's day in the saved plan, if the plan covers today. */
  readonly today = computed(() => this.plan()?.days.find((d) => d.date === localIsoDate()) ?? null);
  readonly ended = computed(() => {
    const days = this.plan()?.days;
    return !!days?.length && days[days.length - 1].date < localIsoDate();
  });

  protected empty(): PlanRecord {
    return { version: 1, current: null };
  }

  protected revive(stored: unknown): PlanRecord {
    const r = stored as Partial<PlanRecord> | null;
    const plan = r?.current;
    if (r?.version !== 1 || !plan || !Array.isArray(plan.days)) return this.empty();
    return { version: 1, current: { ...plan, groceries: plan.groceries ?? [] } };
  }

  save(plan: MealPlan): Promise<void> {
    return this.update((r) => ({ ...r, current: { ...plan, savedAt: new Date().toISOString() } }));
  }

  clear(): Promise<void> {
    return this.update((r) => ({ ...r, current: null }));
  }

  /** Replaces the saved plan's days, e.g. after a confirmed swap. */
  replaceDays(days: PlanDay[]): Promise<void> {
    return this.change((plan) => ({ ...plan, days }));
  }

  setMeal(date: string, meal: PlannedMeal | null): Promise<void> {
    return this.change((plan) => ({
      ...plan,
      days: plan.days.map((d, i) => {
        if (d.date === date) return { date, meal };
        // Leftovers of a meal that changed become an ordinary day of their own.
        const previous = plan.days[i - 1];
        return d.leftovers && previous?.date === date ? { date: d.date, meal: d.meal } : d;
      }),
    }));
  }

  /** Preparing is not eating: the tick records only that the meal was made. */
  togglePrepared(date: string): Promise<void> {
    return this.change((plan) => ({
      ...plan,
      days: plan.days.map((d) =>
        d.date !== date
          ? d
          : d.preparedAt
            ? { ...d, preparedAt: undefined }
            : { ...d, preparedAt: new Date().toISOString() },
      ),
    }));
  }

  editGroceries(week: number, edit: (edits: GroceryEdits) => GroceryEdits): Promise<void> {
    return this.change((plan) => {
      const groceries = [...plan.groceries];
      while (groceries.length <= week) groceries.push(emptyEdits());
      groceries[week] = edit(groceries[week] ?? emptyEdits());
      return { ...plan, groceries };
    });
  }

  private change(edit: (plan: MealPlan) => MealPlan): Promise<void> {
    return this.update((r) => {
      if (!r.current) throw new UserFacingError('There’s no saved plan to change. Make a plan first.');
      return { ...r, current: edit(r.current) };
    });
  }
}
