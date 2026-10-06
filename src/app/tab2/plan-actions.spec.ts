import { replaceMealSlot, startPlanOn } from './plan-actions';
import { GenerateMealPlanResponse, MealPlanItem } from '../core/services/meal-plans.service';

const meal: MealPlanItem = { mealType: 'LUNCH', mealId: 'old', name: 'Old meal', imageUrl: null, tags: [] };
const replacement: MealPlanItem = { ...meal, mealId: 'new', name: 'New meal' };
const plan = (): GenerateMealPlanResponse => ({
  days: 2,
  daysPlan: [
    { date: '2026-10-04', meals: [{ ...meal }, { ...meal, mealType: 'DINNER' }] },
    { date: '2026-10-05', meals: [{ ...meal }] },
  ],
});

describe('Meal plan changes', () => {
  it('swaps one dated meal slot without changing repetitions on other days or meal types', () => {
    const original = plan();
    const changed = replaceMealSlot(original, '2026-10-04', meal, replacement);
    expect(changed.daysPlan[0].meals[0].mealId).toBe('new');
    expect(changed.daysPlan[0].meals[1].mealId).toBe('old');
    expect(changed.daysPlan[1].meals[0].mealId).toBe('old');
    expect(original.daysPlan[0].meals[0].mealId).toBe('old');
  });
  it('applies a chosen start date across month boundaries without mutating the saved plan', () => {
    const original = plan();
    const shifted = startPlanOn(original, '2026-10-31');
    expect(shifted.daysPlan.map((d) => d.date)).toEqual(['2026-10-31', '2026-11-01']);
    expect(original.daysPlan[0].date).toBe('2026-10-04');
  });
  it('rejects invalid dates and empty plan responses', () => {
    expect(() => startPlanOn(plan(), '2026-02-31')).toThrow();
    expect(() => startPlanOn({ days: 0, daysPlan: [] }, '2026-10-04')).toThrow();
  });
});
