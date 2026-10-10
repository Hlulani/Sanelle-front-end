import { MealResponse } from '../core/models/meal.model';
import { MealPlanItem } from '../core/services/meal-plans.service';
import { scaleIngredientAmount } from '../core/services/ingredient-scaling.util';
import { addDays, parseLocalDate } from '../shared/calendar-date';
import { ALLERGENS, FoodProfile } from './food-profile.service';
import { FOOD_NEED_LABELS } from '../core/profile/profile.service';

/**
 * Practical meal planning. A plan has one editable main meal per day, or an open day with no
 * meal or grocery commitment. Planning, preparing and shopping stay separate, and a prepared
 * tick never means a meal was eaten.
 */
export type Horizon = 3 | 7 | 14 | 30;
export const HORIZONS: { days: Horizon; label: string }[] = [
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '1 month' },
];

export function horizonLabel(days: number): string {
  return HORIZONS.find((h) => h.days === days)?.label ?? `${days} days`;
}

export interface PlannedMeal {
  mealId: string;
  name: string;
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  tags: string[];
  /** The server's reasons: the person's own strict criteria, never health claims. */
  reasons: string[];
}

export interface PlanDay {
  date: string;
  /** Null is an open day: no meal and nothing to buy. */
  meal: PlannedMeal | null;
  /** Eats leftovers of the same meal cooked the day before. */
  leftovers?: boolean;
  preparedAt?: string;
}

export interface GroceryEdits {
  /** Ingredient keys she already has. */
  have: string[];
  /** Ingredient keys she removed from the list. */
  removed: string[];
  added: { name: string; amount?: string }[];
}

export interface MealPlan {
  id: string;
  horizon: Horizon;
  startDate: string;
  /** People each meal is cooked for. Recipes are written for one. */
  servings: number;
  days: PlanDay[];
  /** One entry per grocery week. */
  groceries: GroceryEdits[];
  createdAt: string;
  savedAt?: string;
  madeWith: { allergies: string[]; exclusions: string[]; dietaryPattern: string };
}

export function toPlannedMeal(item: MealPlanItem): PlannedMeal {
  return {
    mealId: item.mealId,
    name: item.name,
    imageUrl: item.imageUrl ?? null,
    prepTimeMinutes: item.prepTimeMinutes ?? null,
    tags: item.tags ?? [],
    reasons: item.reasons ?? [],
  };
}

// ---------- Ranking (FOOD-03A) ----------

export type Tier = 'favourite' | 'planned-before' | 'preference' | 'other';
export const TIER_LABELS: Record<Tier, string> = {
  favourite: 'Your favourites',
  'planned-before': 'Planned before',
  preference: 'Matches your preferences',
  other: 'Other meals that fit',
};
const TIER_ORDER: Tier[] = ['favourite', 'planned-before', 'preference', 'other'];

export type ConflictState = 'clear' | 'review' | 'conflict';
export interface ConflictStatus {
  state: ConflictState;
  lines: string[];
}

export interface RankedOption {
  meal: PlannedMeal;
  tier: Tier;
  /** Why it matches, from her own choices. */
  why: string[];
  conflict: ConflictStatus;
  batchFriendly: boolean;
  score: number;
}

/** Ingredients whose contents depend on the product, so labels need checking. */
const COMPOSITE =
  /\b(stock|broth|sauce|paste|seasoning|spice mix|curry powder|granola|cereal|bread|crackers?|tortillas?|wraps?|noodles|pesto|dressing|miso|chocolate)\b/i;

function wordIn(text: string, word: string): boolean {
  const w = word.trim().toLowerCase();
  if (!w) return false;
  const stem = w.endsWith('es') ? w.slice(0, -2) : w.endsWith('s') ? w.slice(0, -1) : w;
  return new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s|es)?\\b`, 'i').test(text);
}

function joinWords(items: string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : (items[0] ?? '');
}

/**
 * What she should know about a recipe's ingredients. It never promises safety: with an allergy,
 * it says only what the recipe lists, and anything it can't check is marked "Needs your review".
 */
export function conflictStatus(
  meal: PlannedMeal,
  recipe: MealResponse | undefined,
  profile: FoodProfile,
): ConflictStatus {
  const lines: string[] = [];
  let state: ConflictState = 'clear';
  const ingredients = (recipe?.ingredients ?? []).map((i) => i.name ?? '').filter(Boolean);
  if (!recipe || !ingredients.length) {
    return { state: 'review', lines: ['Needs your review: the ingredient list isn’t available here.'] };
  }
  if (profile.allergies.length) {
    const named = ALLERGENS.filter((a) => profile.allergies.includes(a.code)).map((a) => a.word);
    lines.push(`No ${joinWords(named)} ingredient is listed in this recipe.`);
    const composite = [...new Set(ingredients.filter((i) => COMPOSITE.test(i)).map((i) => i.split(',')[0].trim()))];
    if (composite.length) {
      state = 'review';
      lines.push(`Needs your review: check the labels of ${joinWords(composite.map((c) => c.toLowerCase()))}.`);
    }
  }
  for (const word of profile.intolerances) {
    const found = ingredients.find((i) => wordIn(i, word));
    if (found) {
      state = 'conflict';
      lines.push(`Contains ${found.toLowerCase()}, and you noted an intolerance to ${word.toLowerCase()}.`);
    }
  }
  for (const word of profile.dislikes) {
    const found = ingredients.find((i) => wordIn(i, word));
    if (found) {
      if (state === 'clear') state = 'review';
      lines.push(`Includes ${found.toLowerCase()}, which you’d rather not eat.`);
    }
  }
  for (const d of profile.ingredientDislikes.filter((d) => d.mealId === meal.mealId)) {
    if (state === 'clear') state = 'review';
    lines.push(`You like this meal but not the ${d.ingredient.toLowerCase()}. Leave it out or swap it.`);
  }
  return { state, lines };
}

export function isBatchFriendly(meal: PlannedMeal): boolean {
  return meal.tags.includes('meal-prep');
}

/** Ranks eligible meals: favourites, then meals planned before, then preference matches, then the rest. */
export function rankOptions(
  eligible: PlannedMeal[],
  recipes: Map<string, MealResponse>,
  profile: FoodProfile,
): RankedOption[] {
  const similarTags = new Set(
    eligible
      .filter((m) => profile.moreLike.includes(m.mealId))
      .flatMap((m) => m.tags.filter((t) => !MEAL_TYPE_TAGS.has(t))),
  );
  return eligible
    .filter((m) => !profile.neverSuggest.includes(m.mealId))
    .map((meal) => {
      const recipe = recipes.get(meal.mealId);
      const ingredients = (recipe?.ingredients ?? []).map((i) => i.name ?? '');
      const why: string[] = [];
      let score = 0;
      const favourite = profile.favourites.includes(meal.mealId);
      const plannedBefore = profile.plannedBefore.includes(meal.mealId);
      if (favourite) why.push('One of your favourites');
      else if (plannedBefore) why.push('You planned it before');
      if (profile.practical.includes('quick') && meal.prepTimeMinutes !== null && meal.prepTimeMinutes <= 20) {
        why.push(`Ready in ${meal.prepTimeMinutes} min, and you chose quick meals`);
        score += 2;
      }
      if (profile.practical.includes('batch') && isBatchFriendly(meal)) {
        why.push('Good for cooking once and eating twice');
        score += 2;
      }
      if (profile.practical.includes('no-cook') && meal.tags.includes('no-cook')) {
        why.push('Little or no cooking');
        score += 2;
      }
      if (profile.practical.includes('few-ingredients') && ingredients.length && ingredients.length <= 6) {
        why.push(`Only ${ingredients.length} ingredients`);
        score += 1;
      }
      const liked = profile.likes.filter((word) => ingredients.some((i) => wordIn(i, word)));
      if (liked.length) {
        why.push(`Uses foods you like: ${joinWords(liked.map((l) => l.toLowerCase()))}`);
        score += 2 * liked.length;
      }
      if (profile.moreLike.includes(meal.mealId)) {
        why.push('You asked for more meals like this');
        score += 2;
      } else if (meal.tags.some((t) => similarTags.has(t))) {
        why.push('Like a meal you asked for more of');
        score += 1;
      }
      const conflict = conflictStatus(meal, recipe, profile);
      if (profile.fewerLike.includes(meal.mealId)) score -= 5;
      if (conflict.state === 'conflict') score -= 4;
      else if (conflict.lines.some((l) => l.startsWith('Includes') || l.startsWith('You like'))) score -= 2;
      const tier: Tier = favourite
        ? 'favourite'
        : plannedBefore
          ? 'planned-before'
          : score > 0
            ? 'preference'
            : 'other';
      for (const reason of meal.reasons) if (!why.includes(reason)) why.push(reason);
      return { meal, tier, why, conflict, batchFriendly: isBatchFriendly(meal), score };
    })
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) ||
        b.score - a.score ||
        a.meal.name.localeCompare(b.meal.name),
    );
}

const MEAL_TYPE_TAGS = new Set(['breakfast', 'lunch', 'dinner', 'snack']);

/** One sentence for a recipe: actual criteria only, never health claims. */
export function suggestedBecause(option: Pick<RankedOption, 'why'>, profile: FoodProfile): string {
  if (option.why.length) return `Suggested because: ${option.why.slice(0, 2).join('; ').replace(/\.$/, '')}.`;
  const needs = profile.practical.map((n) => FOOD_NEED_LABELS[n].toLowerCase());
  return needs.length
    ? `It fits your requirements. You also asked for ${joinWords(needs)}.`
    : 'It fits the requirements you set.';
}

// ---------- Building a plan ----------

export interface PlanSetup {
  horizon: Horizon;
  startDate: string;
  servings: number;
  /** Weekdays (0 = Sunday) to leave open. */
  openWeekdays: number[];
  /** Cook a batch-friendly meal once and eat it again the next day. */
  batch: boolean;
}

/** Fills each day from the ranked list, without repeating a meal within a week unless it runs out. */
export function buildDays(setup: PlanSetup, ranked: RankedOption[]): PlanDay[] {
  const days: PlanDay[] = [];
  const usable = ranked.filter((o) => o.conflict.state !== 'conflict');
  const pool = usable.length ? usable : ranked;
  let cursor = 0;
  for (let i = 0; i < setup.horizon; i++) {
    const date = addDays(setup.startDate, i);
    if (setup.openWeekdays.includes(parseLocalDate(date).getDay())) {
      days.push({ date, meal: null });
      continue;
    }
    const previous = days[i - 1];
    if (setup.batch && previous?.meal && !previous.leftovers && isBatchFriendly(previous.meal)) {
      days.push({ date, meal: previous.meal, leftovers: true });
      continue;
    }
    if (!pool.length) {
      days.push({ date, meal: null });
      continue;
    }
    const recent = new Set(days.slice(-6).map((d) => d.meal?.mealId));
    let pick = pool[cursor % pool.length];
    for (let tries = 0; tries < pool.length && recent.has(pick.meal.mealId); tries++) {
      cursor++;
      pick = pool[cursor % pool.length];
    }
    cursor++;
    days.push({ date, meal: pick.meal });
  }
  return days;
}

// ---------- Groceries ----------

export interface GroceryItem {
  key: string;
  name: string;
  /** Amounts as written, scaled for the people and days they cook for. Listed, never added up. */
  amounts: string[];
  /** Meals that use it this week. */
  meals: string[];
  group: string;
  added?: boolean;
}

export interface GroceryWeek {
  index: number;
  label: string;
  from: string;
  to: string;
  /** Still to buy. */
  items: GroceryItem[];
  have: GroceryItem[];
  removed: GroceryItem[];
  /** Planned meals whose recipe couldn't be loaded, so they're not in the list yet. */
  missingRecipes: string[];
  mealCount: number;
}

/** 3 days: one list. Longer plans: one list per week (a month ends with a short week). */
export function weekRanges(
  plan: Pick<MealPlan, 'days' | 'horizon'>,
): { index: number; label: string; days: PlanDay[] }[] {
  if (plan.horizon === 3) return [{ index: 0, label: '3-day list', days: plan.days }];
  const weeks: { index: number; label: string; days: PlanDay[] }[] = [];
  for (let i = 0; i < plan.days.length; i += 7) {
    weeks.push({ index: i / 7, label: `Week ${i / 7 + 1}`, days: plan.days.slice(i, i + 7) });
  }
  return weeks;
}

export function weekOf(plan: Pick<MealPlan, 'days' | 'horizon'>, date: string): number {
  const i = plan.days.findIndex((d) => d.date === date);
  return plan.horizon === 3 || i < 0 ? 0 : Math.floor(i / 7);
}

export function ingredientKey(name: string): string {
  return splitPreparation(name).base.trim().toLowerCase();
}

/** Keep every cooking quantity, grouping identical wording without guessing unit conversions. */
export function formatGroceryAmounts(amounts: string[]): string {
  const counts = new Map<string, number>();
  for (const amount of amounts) {
    const label = amount.trim();
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].map(([label, count]) => (count > 1 ? `${count} × ${label}` : label)).join(' + ');
}

/** "Bell pepper, diced" → you buy the pepper; the recipe dices it. */
export function splitPreparation(name: string): { base: string; note: string | null } {
  const i = name.indexOf(',');
  if (i <= 0) return { base: name.trim(), note: null };
  return { base: name.slice(0, i).trim(), note: name.slice(i + 1).trim() || null };
}

export function groceryWeeks(plan: MealPlan, recipes: Map<string, MealResponse>): GroceryWeek[] {
  return weekRanges(plan).map((week) => {
    const map = new Map<string, GroceryItem>();
    const missing = new Set<string>();
    let mealCount = 0;
    week.days.forEach((day, i) => {
      if (!day.meal || day.leftovers) return;
      mealCount++;
      // A batch is cooked once for this day and the leftover days that follow it.
      let portions = 1;
      const absolute = plan.days.indexOf(day);
      for (
        let j = absolute + 1;
        j < plan.days.length && plan.days[j].leftovers && plan.days[j].meal?.mealId === day.meal.mealId;
        j++
      )
        portions++;
      const recipe = recipes.get(day.meal.mealId);
      if (!recipe) {
        missing.add(day.meal.name);
        return;
      }
      for (const ing of recipe.ingredients ?? []) {
        const full = (ing.name ?? '').trim();
        if (!full) continue;
        const { base, note } = splitPreparation(full);
        const key = base.toLowerCase();
        const item = map.get(key) ?? { key, name: base, amounts: [], meals: [], group: groupForIngredient(base) };
        const amount = ing.amount ? scaleIngredientAmount(ing.amount, plan.servings * portions) : '';
        const line = [amount, note ? `(${note})` : ''].filter(Boolean).join(' ');
        // Each cooking occurrence contributes its amount, even when two recipes use the same quantity.
        if (line) item.amounts.push(line);
        if (!item.meals.includes(day.meal.name)) item.meals.push(day.meal.name);
        map.set(key, item);
      }
      void i;
    });
    const edits = plan.groceries[week.index] ?? { have: [], removed: [], added: [] };
    for (const extra of edits.added) {
      const key = extra.name.trim().toLowerCase();
      if (!map.has(key))
        map.set(key, {
          key,
          name: extra.name.trim(),
          amounts: extra.amount ? [extra.amount] : [],
          meals: [],
          group: 'Added by me',
          added: true,
        });
    }
    const all = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    return {
      index: week.index,
      label: week.label,
      from: week.days[0]?.date ?? plan.startDate,
      to: week.days[week.days.length - 1]?.date ?? plan.startDate,
      items: all.filter((i) => !edits.have.includes(i.key) && !edits.removed.includes(i.key)),
      have: all.filter((i) => edits.have.includes(i.key) && !edits.removed.includes(i.key)),
      removed: all.filter((i) => edits.removed.includes(i.key)),
      missingRecipes: [...missing],
      mealCount,
    };
  });
}

export function groupForIngredient(name: string): string {
  const n = name.toLowerCase();
  const has = (words: string[]) => words.some((w) => n.includes(w));
  if (has(['milk', 'yogurt', 'yoghurt', 'cheese', 'butter', 'cream', 'ghee', 'feta'])) return 'Dairy and eggs';
  if (has(['egg'])) return 'Dairy and eggs';
  if (has(['chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage'])) return 'Meat';
  if (has(['salmon', 'tuna', 'shrimp', 'prawn', 'fish', 'cod', 'tilapia', 'sardine', 'mackerel'])) return 'Fish';
  if (has(['salt', 'cumin', 'paprika', 'turmeric', 'cinnamon', 'spice', 'herb', 'oregano', 'thyme', 'chilli flakes']))
    return 'Spices and herbs';
  if (
    has([
      'apple',
      'banana',
      'berr',
      'orange',
      'lemon',
      'lime',
      'grape',
      'pear',
      'mango',
      'pineapple',
      'avocado',
      'spinach',
      'kale',
      'lettuce',
      'cabbage',
      'broccoli',
      'carrot',
      'tomato',
      'pepper',
      'onion',
      'garlic',
      'zucchini',
      'courgette',
      'mushroom',
      'cucumber',
      'potato',
      'ginger',
      'coriander',
      'parsley',
      'basil',
      'chard',
    ])
  )
    return 'Fruit and vegetables';
  if (has(['rice', 'pasta', 'bread', 'oats', 'quinoa', 'flour', 'tortilla', 'noodle', 'couscous'])) return 'Grains';
  if (has(['bean', 'lentil', 'chickpea', 'peas', 'tofu', 'tempeh'])) return 'Beans, lentils and tofu';
  if (has(['almond', 'cashew', 'walnut', 'peanut', 'pecan', 'nut', 'seed', 'chia', 'flax', 'tahini']))
    return 'Nuts and seeds';
  if (has(['oil', 'vinegar', 'soy sauce', 'tamari', 'mustard', 'ketchup', 'mayo', 'honey', 'maple', 'sugar', 'stock']))
    return 'Cupboard';
  return 'Other';
}

// ---------- Swapping (FOOD-03B and FOOD-03C) ----------

export type SwapScope = 'day' | 'week' | 'plan';
export const SCOPE_LABELS: Record<SwapScope, string> = {
  day: 'This day only',
  week: 'Every occurrence this week',
  plan: 'Every occurrence in this plan',
};

/** The dates a swap would change for each scope. Leftover days follow the day they were cooked. */
export function scopeDates(plan: MealPlan, date: string): Record<SwapScope, string[]> {
  const target = plan.days.find((d) => d.date === date);
  const mealId = target?.meal?.mealId;
  if (!target || !mealId) return { day: [], week: [], plan: [] };
  const same = plan.days.filter((d) => d.meal?.mealId === mealId).map((d) => d.date);
  const week = weekOf(plan, date);
  return {
    day: withLeftovers(plan, [date]),
    week: same.filter((d) => weekOf(plan, d) === week),
    plan: same,
  };
}

function withLeftovers(plan: MealPlan, dates: string[]): string[] {
  const out = new Set(dates);
  for (const date of dates) {
    const i = plan.days.findIndex((d) => d.date === date);
    const mealId = plan.days[i]?.meal?.mealId;
    for (let j = i + 1; j < plan.days.length && plan.days[j].leftovers && plan.days[j].meal?.mealId === mealId; j++)
      out.add(plan.days[j].date);
  }
  return [...out];
}

/** True when the meal appears on more than one day, so the scope question applies. */
export function repeats(plan: MealPlan, date: string): boolean {
  const scopes = scopeDates(plan, date);
  return scopes.plan.length > scopes.day.length;
}

export function applySwap(plan: MealPlan, dates: string[], replacement: PlannedMeal): MealPlan {
  const changing = new Set(dates);
  return {
    ...plan,
    days: plan.days.map((day, i) => {
      if (!changing.has(day.date)) return day;
      const previous = plan.days[i - 1];
      // A leftover day stays leftovers only if the day it was cooked changes too.
      const leftovers = !!day.leftovers && !!previous && changing.has(previous.date);
      return { date: day.date, meal: replacement, ...(leftovers ? { leftovers: true } : {}) };
    }),
  };
}

export interface GroceryChange {
  week: number;
  label: string;
  added: string[];
  removed: string[];
  /** Kept because another meal that week still needs them. */
  retained: string[];
  updated: { name: string; before: string; after: string }[];
}

/** What a swap does to each affected week's list, shown before it is confirmed. */
export function groceryChanges(
  before: MealPlan,
  after: MealPlan,
  recipes: Map<string, MealResponse>,
  removedMealId: string,
): GroceryChange[] {
  const b = groceryWeeks(before, recipes);
  const a = groceryWeeks(after, recipes);
  const oldIngredients = new Set(
    (recipes.get(removedMealId)?.ingredients ?? []).map((i) => ingredientKey(i.name ?? '')).filter(Boolean),
  );
  const changes: GroceryChange[] = [];
  a.forEach((week, w) => {
    const prev = b[w];
    const beforeItems = new Map([...prev.items, ...prev.have].map((i) => [i.key, i]));
    const afterItems = new Map([...week.items, ...week.have].map((i) => [i.key, i]));
    const changedDays = after.days.some(
      (d, i) => weekOf(after, d.date) === w && d.meal?.mealId !== before.days[i]?.meal?.mealId,
    );
    if (!changedDays) return;
    const added = [...afterItems.keys()].filter((k) => !beforeItems.has(k)).map((k) => afterItems.get(k)!.name);
    const removed = [...beforeItems.keys()].filter((k) => !afterItems.has(k)).map((k) => beforeItems.get(k)!.name);
    const retained = [...afterItems.keys()]
      .filter((k) => beforeItems.has(k) && oldIngredients.has(k))
      .map((k) => afterItems.get(k)!.name);
    const updated = [...afterItems.keys()]
      .filter((k) => beforeItems.has(k))
      .map((k) => ({
        name: afterItems.get(k)!.name,
        before: beforeItems.get(k)!.amounts.join(', '),
        after: afterItems.get(k)!.amounts.join(', '),
      }))
      .filter((u) => u.before !== u.after);
    changes.push({ week: w, label: week.label, added, removed, retained, updated });
  });
  return changes;
}

/** "Meal swapped. Week 2’s shopping list has been updated." */
export function swapConfirmation(plan: MealPlan, changes: GroceryChange[]): string {
  if (plan.horizon === 3 || !changes.length) return 'Meal swapped. Your shopping list has been updated.';
  const labels = changes.map((c) => c.label);
  return labels.length === 1
    ? `Meal swapped. ${labels[0]}’s shopping list has been updated.`
    : `Meal swapped. Shopping lists for ${joinWords(labels)} have been updated.`;
}
