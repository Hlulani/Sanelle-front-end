import { GenerateMealPlanResponse, MealPlanItem } from '../core/services/meal-plans.service';

export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The API generates consecutive days from today; the chosen start is applied before previewing. */
export function startPlanOn(plan: GenerateMealPlanResponse, start: string): GenerateMealPlanResponse {
  const first = new Date(start + 'T00:00:00');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || isNaN(first.getTime()) || localDay(first) !== start) throw new Error('Choose a valid start date.');
  if (!Array.isArray(plan.daysPlan) || !plan.daysPlan.length) throw new Error('No meals were returned. Try different prep-time choices.');
  return { ...plan, daysPlan: plan.daysPlan.map((day, i) => { const date = new Date(first); date.setDate(date.getDate() + i); return { ...day, date: localDay(date) }; }) };
}

/** A swap belongs to one dated meal slot, even if that recipe appears elsewhere. */
export function replaceMealSlot(plan: GenerateMealPlanResponse, date: string, current: MealPlanItem, replacement: MealPlanItem): GenerateMealPlanResponse {
  return { ...plan, daysPlan: plan.daysPlan.map((day) => day.date !== date ? day : { ...day,
    meals: day.meals.map((meal) => meal.mealId === current.mealId && meal.mealType === current.mealType ? { ...replacement, mealType: meal.mealType } : meal),
  }) };
}
