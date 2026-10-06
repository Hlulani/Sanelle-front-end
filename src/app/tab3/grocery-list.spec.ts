import { byAisle, byMeal, slotsInWindow, splitPreparation } from './grocery-list';
import { GenerateMealPlanResponse } from '../core/services/meal-plans.service';
import { MealResponse } from '../core/models/meal.model';

function plan(days: { date: string; ids: string[] }[]): GenerateMealPlanResponse {
  return {
    daysPlan: days.map((d) => ({
      date: d.date,
      meals: d.ids.map((id, i) => ({ mealType: (['BREAKFAST', 'LUNCH', 'DINNER'] as const)[i], mealId: id, name: id })),
    })),
  } as unknown as GenerateMealPlanResponse;
}

const meal = (id: string, ingredients: [string, string | null][]) =>
  ({ id, name: id, ingredients: ingredients.map(([name, amount]) => ({ name, amount })) }) as unknown as MealResponse;

const tenDays = plan(
  Array.from({ length: 10 }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, '0')}`, ids: ['oats', 'salad'] })),
);

describe('slotsInWindow', () => {
  it('starts today, never includes past days, and limits to the window', () => {
    const three = slotsInWindow(tenDays, 'three', '2026-10-03');
    expect(three.map((s) => s.date)).toEqual([
      '2026-10-03',
      '2026-10-03',
      '2026-10-04',
      '2026-10-04',
      '2026-10-05',
      '2026-10-05',
    ]);
    expect(slotsInWindow(tenDays, 'week', '2026-10-03').length).toBe(14);
    expect(slotsInWindow(tenDays, 'all', '2026-10-03').length).toBe(16);
  });

  it('starts at the plan’s first day when the plan hasn’t begun', () => {
    expect(slotsInWindow(tenDays, 'three', '2026-09-20')[0].date).toBe('2026-10-01');
  });
});

describe('byAisle', () => {
  const meals = new Map([
    [
      'oats',
      meal('oats', [
        ['Rolled oats', '1/2 cup'],
        ['Chia seeds', '1 tbsp'],
      ]),
    ],
    [
      'salad',
      meal('salad', [
        ['Chickpeas', '400 g tin'],
        ['Chia seeds', '1 tsp'],
      ]),
    ],
  ]);

  it('counts how many planned meals use an ingredient instead of adding free-text amounts', () => {
    const items = byAisle(slotsInWindow(tenDays, 'three', '2026-10-03'), meals);
    const chia = items.find((i) => i.name === 'Chia seeds')!;
    expect(chia.mealCount).toBe(6);
    expect(chia.amounts).toEqual(['1 tbsp', '1 tsp']);
    expect(items.find((i) => i.name === 'Chickpeas')!.mealCount).toBe(3);
  });

  it('groups by meal, one entry per planned meal', () => {
    const groups = byMeal(slotsInWindow(tenDays, 'three', '2026-10-03'), meals);
    expect(groups.length).toBe(6);
    expect(groups[1].ingredients.map((i) => i.name)).toEqual(['Chickpeas', 'Chia seeds']);
  });
});

describe('preparation notes', () => {
  it('lists one item to buy, keeping how each recipe prepares it', () => {
    expect(splitPreparation('Bell pepper, diced')).toEqual({ base: 'Bell pepper', note: 'diced' });
    const meals = new Map([
      ['a', meal('a', [['Bell pepper', '1/2']])],
      ['b', meal('b', [['Bell pepper, diced', '1/2 cup']])],
    ]);
    const slots = slotsInWindow(plan([{ date: '2026-10-03', ids: ['a', 'b'] }]), 'all', '2026-10-03');
    const items = byAisle(slots, meals);
    expect(items.length).toBe(1);
    expect(items[0]).toEqual(
      jasmine.objectContaining({ name: 'Bell pepper', amounts: ['1/2', '1/2 cup (diced)'], mealCount: 2 }),
    );
  });
});
