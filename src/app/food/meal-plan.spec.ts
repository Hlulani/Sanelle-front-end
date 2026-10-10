import {
  applySwap,
  buildDays,
  groceryChanges,
  groceryWeeks,
  formatGroceryAmounts,
  MealPlan,
  PlannedMeal,
  rankOptions,
  scopeDates,
  weekRanges,
} from './meal-plan';
import { FoodProfile } from './food-profile.service';
import { MealResponse } from '../core/models/meal.model';

const profile = (): FoodProfile => ({
  version: 2,
  allergies: [],
  strictAvoidances: [],
  intolerances: [],
  dietaryPattern: 'ANY',
  cultural: [],
  dislikes: [],
  likes: [],
  practical: [],
  household: 1,
  favourites: [],
  moreLike: [],
  fewerLike: [],
  neverSuggest: [],
  ingredientDislikes: [],
  plannedBefore: [],
});
const meal = (id: string, tags: string[] = []): PlannedMeal => ({
  mealId: id,
  name: id,
  imageUrl: null,
  prepTimeMinutes: 15,
  tags,
  reasons: [],
});
const recipe = (id: string, names: string[]): MealResponse => ({
  id,
  name: id,
  mealType: 'DINNER',
  tags: [],
  ingredients: names.map((name) => ({ name, amount: '100 g' })),
  instructions: [],
});
function plan(days: MealPlan['days'], horizon: MealPlan['horizon'] = 7): MealPlan {
  return {
    id: 'p',
    horizon,
    startDate: days[0].date,
    servings: 2,
    days,
    groceries: [],
    createdAt: '2026-10-08T00:00:00Z',
    madeWith: { allergies: [], exclusions: [], dietaryPattern: 'ANY' },
  };
}

describe('Meal planning across days and grocery weeks', () => {
  it('groups repeated shopping quantities while preserving different units and preparation notes', () => {
    expect(formatGroceryAmounts(['1 tbsp', '1 tbsp', '200 g', '1 cup', '200 g (diced)'])).toBe(
      '2 × 1 tbsp + 200 g + 1 cup + 200 g (diced)',
    );
    expect(formatGroceryAmounts(['', '  '])).toBe('');
  });
  it('ranks favourites, previously planned, preference matches, then other eligible meals', () => {
    const p = profile();
    p.favourites = ['f'];
    p.plannedBefore = ['p'];
    p.likes = ['carrot'];
    const recipes = new Map([['m', recipe('m', ['Carrot'])]]);
    expect(
      rankOptions(
        ['o', 'm', 'p', 'f'].map((id) => meal(id)),
        recipes,
        p,
      ).map((o) => o.meal.mealId),
    ).toEqual(['f', 'p', 'm', 'o']);
  });
  it('does not restore a favourite excluded by strict requirements or never-suggest', () => {
    const p = profile();
    p.favourites = ['excluded', 'never'];
    p.neverSuggest = ['never'];
    expect(rankOptions([meal('never'), meal('allowed')], new Map(), p).map((o) => o.meal.mealId)).toEqual(['allowed']);
  });
  it('does not treat intolerance or missing ingredients as a safety guarantee', () => {
    const p = profile();
    p.intolerances = ['onion'];
    expect(rankOptions([meal('a')], new Map([['a', recipe('a', ['Onion'])]]), p)[0].conflict.state).toBe('conflict');
    expect(rankOptions([meal('unknown')], new Map(), p)[0].conflict.state).toBe('review');
  });
  for (const horizon of [3, 7, 14, 30] as const)
    it(`creates ${horizon} dated days and the right weekly lists`, () => {
      const options = rankOptions([meal('a'), meal('b')], new Map(), profile());
      const days = buildDays(
        { horizon, startDate: '2026-10-08', servings: 2, openWeekdays: [], batch: false },
        options,
      );
      expect(days.length).toBe(horizon);
      const weeks = weekRanges(plan(days, horizon));
      expect(weeks.length).toBe(Math.ceil(horizon / 7));
      expect(weeks.at(-1)!.days.length).toBe(horizon === 30 ? 2 : horizon === 3 ? 3 : 7);
    });
  it('leaves open weekdays out of the cooking and grocery commitments', () => {
    const options = rankOptions([meal('a')], new Map(), profile());
    const days = buildDays(
      { horizon: 7, startDate: '2026-10-08', servings: 1, openWeekdays: [5], batch: false },
      options,
    );
    expect(days[1].meal).toBeNull();
    expect(groceryWeeks(plan(days), new Map([['a', recipe('a', ['Rice'])]]))[0].mealCount).toBe(6);
  });
  it('counts repeated ingredient amounts for each cooking occurrence', () => {
    const p = plan([
      { date: '2026-10-08', meal: meal('a') },
      { date: '2026-10-09', meal: meal('a') },
    ]);
    const list = groceryWeeks(p, new Map([['a', recipe('a', ['Rice'])]]))[0];
    expect(list.items[0].amounts).toEqual(['200 g', '200 g']);
  });
  it('buys batch portions in the cooking week, including leftovers across a week boundary', () => {
    const days = Array.from({ length: 9 }, (_, i) => ({
      date: `2026-10-${String(i + 8).padStart(2, '0')}`,
      meal: i === 6 || i === 7 ? meal('a') : null,
      ...(i === 7 ? { leftovers: true } : {}),
    }));
    const weeks = groceryWeeks(plan(days, 14), new Map([['a', recipe('a', ['Rice'])]]));
    expect(weeks[0].items[0].amounts).toEqual(['400 g']);
    expect(weeks[1].items).toEqual([]);
  });
  it('separates one-day, same-week and entire-plan occurrences', () => {
    const days = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-10-${String(i + 8).padStart(2, '0')}`,
      meal: meal(i === 0 || i === 4 || i === 9 ? 'a' : 'b'),
    }));
    const p = plan(days, 14);
    expect(scopeDates(p, days[0].date)).toEqual({
      day: [days[0].date],
      week: [days[0].date, days[4].date],
      plan: [days[0].date, days[4].date, days[9].date],
    });
    expect(applySwap(p, [days[0].date], meal('c')).days[4].meal!.mealId).toBe('a');
  });
  it('shows additions, removals and shared ingredients with changed quantities before a swap', () => {
    const p = plan([
      { date: '2026-10-08', meal: meal('a') },
      { date: '2026-10-09', meal: meal('b') },
    ]);
    const recipes = new Map([
      ['a', recipe('a', ['Rice', 'Onion'])],
      ['b', recipe('b', ['Rice'])],
      ['c', recipe('c', ['Beans'])],
    ]);
    const changes = groceryChanges(p, applySwap(p, [p.days[0].date], meal('c')), recipes, 'a')[0];
    expect(changes.added).toEqual(['Beans']);
    expect(changes.removed).toEqual(['Onion']);
    expect(changes.retained).toEqual(['Rice']);
    expect(changes.updated[0]).toEqual({ name: 'Rice', before: '200 g, 200 g', after: '200 g' });
  });
  it('keeps already-have, removed and manually added grocery edits through recalculation', () => {
    const p = plan([{ date: '2026-10-08', meal: meal('a') }]);
    p.groceries = [{ have: ['rice'], removed: ['onion'], added: [{ name: 'Apples', amount: '2' }] }];
    const week = groceryWeeks(p, new Map([['a', recipe('a', ['Rice', 'Onion'])]]))[0];
    expect(week.have[0].name).toBe('Rice');
    expect(week.removed[0].name).toBe('Onion');
    expect(week.items[0].name).toBe('Apples');
  });
});
