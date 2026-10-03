import { GenerateMealPlanResponse, MealPlanItem } from '../core/services/meal-plans.service';
import { MealResponse } from '../core/models/meal.model';

/** How far ahead to shop. Past days are never included. */
export type ShoppingWindow = 'three' | 'week' | 'all';
export const WINDOW_LABELS: Record<ShoppingWindow, string> = { three: 'Next 3 days', week: 'This week', all: 'Whole plan' };
export const WINDOW_SUBTITLES: Record<ShoppingWindow, string> = {
  three: 'For the next 3 days',
  week: 'For the next 7 days',
  all: 'For the rest of your plan',
};

export interface PlannedMealSlot {
  /** Unique per day and meal slot. */
  key: string;
  date: string;
  mealType: MealPlanItem['mealType'];
  mealId: string;
  name: string;
}

export interface AisleItem {
  name: string;
  /** Amounts as written in the recipes. They're free text, so they're listed, never added up. */
  amounts: string[];
  group: string;
  /** How many planned meals in the window use it, so a repeated meal still says "buy more". */
  mealCount: number;
}

export interface MealIngredients {
  slot: PlannedMealSlot;
  ingredients: { name: string; amount: string | null }[];
}

/** The planned meals from today (or the plan's first day, if later) within the window. */
export function slotsInWindow(plan: GenerateMealPlanResponse, window: ShoppingWindow, todayIso: string): PlannedMealSlot[] {
  const upcoming = plan.daysPlan.filter((d) => d.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date));
  const days = window === 'all' ? upcoming : upcoming.slice(0, window === 'three' ? 3 : 7);
  const slots: PlannedMealSlot[] = [];
  for (const d of days) {
    for (const m of d.meals) {
      if (m.mealId) slots.push({ key: `${d.date}|${m.mealType}|${m.mealId}`, date: d.date, mealType: m.mealType, mealId: m.mealId, name: m.name });
    }
  }
  return slots;
}

export function ingredientKey(name: string): string {
  return name.trim().toLowerCase();
}

/** The key for "do I have this?", shared by both views: "Bell pepper, diced" counts as bell pepper. */
export function haveKey(name: string): string {
  return ingredientKey(splitPreparation(name).base);
}

/** "Bell pepper, diced" → { base: "Bell pepper", note: "diced" }: you buy the pepper, the recipe dices it. */
export function splitPreparation(name: string): { base: string; note: string | null } {
  const i = name.indexOf(',');
  if (i <= 0) return { base: name.trim(), note: null };
  return { base: name.slice(0, i).trim(), note: name.slice(i + 1).trim() || null };
}

export function byAisle(slots: PlannedMealSlot[], meals: Map<string, MealResponse>): AisleItem[] {
  const map = new Map<string, { name: string; amounts: Set<string>; mealCount: number }>();
  for (const slot of slots) {
    const meal = meals.get(slot.mealId);
    const seenInThisMeal = new Set<string>();
    for (const ing of meal?.ingredients ?? []) {
      const full = (ing.name || '').trim();
      if (!full) continue;
      const { base: name, note } = splitPreparation(full);
      const key = ingredientKey(name);
      if (!map.has(key)) map.set(key, { name, amounts: new Set(), mealCount: 0 });
      const entry = map.get(key)!;
      const amount = [ing.amount, note ? `(${note})` : null].filter(Boolean).join(' ');
      if (amount) entry.amounts.add(amount);
      if (!seenInThisMeal.has(key)) {
        entry.mealCount++;
        seenInThisMeal.add(key);
      }
    }
  }
  return [...map.values()]
    .map((e) => ({ name: e.name, amounts: [...e.amounts], group: groupForIngredient(e.name), mealCount: e.mealCount }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function byMeal(slots: PlannedMealSlot[], meals: Map<string, MealResponse>): MealIngredients[] {
  return slots.map((slot) => ({
    slot,
    ingredients: (meals.get(slot.mealId)?.ingredients ?? [])
      .filter((i) => (i.name || '').trim())
      .map((i) => ({ name: i.name.trim(), amount: i.amount ?? null })),
  }));
}

export function groupForIngredient(name: string): string {
  const n = name.toLowerCase();
  const has = (words: string[]) => words.some((w) => n.includes(w));

  if (has(['milk', 'yogurt', 'cheese', 'butter', 'cream', 'ghee'])) return 'Dairy';
  if (has(['chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage'])) return 'Meat';
  if (has(['salmon', 'tuna', 'shrimp', 'prawn', 'fish', 'cod', 'tilapia'])) return 'Seafood';
  if (has(['egg'])) return 'Eggs';
  if (has(['apple', 'banana', 'berry', 'berries', 'orange', 'lemon', 'lime', 'grape', 'pear', 'mango', 'pineapple', 'avocado'])) return 'Produce';
  if (has(['spinach', 'kale', 'lettuce', 'cabbage', 'broccoli', 'carrot', 'tomato', 'pepper', 'onion', 'garlic', 'zucchini', 'mushroom', 'cucumber', 'potato', 'sweet potato'])) return 'Produce';
  if (has(['rice', 'pasta', 'bread', 'oats', 'quinoa', 'flour', 'tortilla'])) return 'Grains';
  if (has(['bean', 'lentil', 'chickpea', 'peas'])) return 'Legumes';
  if (has(['almond', 'cashew', 'walnut', 'peanut', 'pecan', 'nut', 'seed', 'chia', 'flax', 'pumpkin seed', 'sunflower'])) return 'Nuts & Seeds';
  if (has(['oil', 'olive', 'coconut oil', 'vinegar', 'soy sauce', 'tamari', 'mustard', 'ketchup', 'mayo'])) return 'Condiments';
  if (has(['salt', 'pepper', 'cumin', 'paprika', 'turmeric', 'ginger', 'cinnamon', 'spice', 'herb'])) return 'Spices & Herbs';
  if (has(['sugar', 'honey', 'maple'])) return 'Sweeteners';
  return 'Other';
}
