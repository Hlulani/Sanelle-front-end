import { GenerateMealPlanResponse, MealPlanItem } from '../core/services/meal-plans.service';
import { addDays, isIsoDate } from '../shared/calendar-date';

/** The API generates consecutive days from today; the chosen start is applied before previewing. */
export function startPlanOn(plan: GenerateMealPlanResponse, start: string): GenerateMealPlanResponse {
  if (!isIsoDate(start)) throw new Error('Choose a valid start date.');
  if (!Array.isArray(plan.daysPlan) || !plan.daysPlan.length)
    throw new Error('No meals were returned. Try different prep-time choices.');
  return { ...plan, daysPlan: plan.daysPlan.map((day, i) => ({ ...day, date: addDays(start, i) })) };
}

/** A swap belongs to one dated meal slot, even if that recipe appears elsewhere. */
export function replaceMealSlot(
  plan: GenerateMealPlanResponse,
  date: string,
  current: MealPlanItem,
  replacement: MealPlanItem,
): GenerateMealPlanResponse {
  return {
    ...plan,
    daysPlan: plan.daysPlan.map((day) =>
      day.date !== date
        ? day
        : {
            ...day,
            meals: day.meals.map((meal) =>
              meal.mealId === current.mealId && meal.mealType === current.mealType
                ? { ...replacement, mealType: meal.mealType }
                : meal,
            ),
          },
    ),
  };
}
