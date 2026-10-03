import { Ingredient } from '../core/models/meal.model';

/**
 * Matches dairy ingredients by name, including common aliases, while ignoring
 * plant-based look-alikes ("almond milk", "peanut butter").
 * Used to show related meals only. Allergy exclusions will use a stricter,
 * server-side matcher that treats unclear ingredients as possible matches.
 */
const DAIRY_TERMS = [
  'milk', 'yogurt', 'yoghurt', 'kefir', 'cheese', 'feta', 'parmesan', 'mozzarella', 'ricotta',
  'halloumi', 'paneer', 'cream', 'butter', 'ghee', 'buttermilk', 'whey', 'labneh', 'skyr', 'quark',
  'brie', 'burrata', 'cheddar', 'mascarpone', 'gouda', 'camembert', 'crème fraîche', 'creme fraiche', 'casein',
];

const NOT_DAIRY = [
  'almond milk', 'oat milk', 'soy milk', 'soya milk', 'coconut milk', 'rice milk', 'cashew milk',
  'coconut cream', 'coconut yogurt', 'peanut butter', 'almond butter', 'nut butter', 'cashew butter',
  'sunflower butter', 'seed butter', 'cocoa butter', 'shea butter', 'cream of tartar', 'vegan',
  'dairy-free', 'plant-based',
];

function matchesDairy(text: string): boolean {
  if (NOT_DAIRY.some((t) => text.includes(t))) return false;
  return DAIRY_TERMS.some((t) => new RegExp(`\\b${t}\\b`).test(text));
}

/**
 * Judges the main ingredient; a bracketed alternative such as "Milk (or oat milk)"
 * is optional, so it can't make a dairy ingredient count as dairy-free.
 */
export function isDairyIngredient(name: string): boolean {
  const n = name.toLowerCase();
  const main = n.replace(/\(.*?\)/g, ' ').trim();
  return matchesDairy(main || n);
}

export function containsDairy(ingredients: Ingredient[] | undefined): boolean {
  return (ingredients ?? []).some((i) => isDairyIngredient(i.name ?? ''));
}

function anyWord(name: string, words: string[], notThese: string[] = []): boolean {
  let n = name.toLowerCase();
  for (const x of notThese) n = n.split(x).join(' ');
  return words.some((w) => new RegExp(`\\b${w}\\b`).test(n));
}

export type RelatedFood = 'dairy' | 'soy' | 'red-meat' | 'green-tea';

/** How each topic finds related meals, and which allergy hides them. */
export const RELATED_FOODS: Record<
  RelatedFood,
  { heading: string; allergen?: string; matches: (ingredientName: string) => boolean }
> = {
  dairy: { heading: 'Meals with dairy', allergen: 'MILK', matches: isDairyIngredient },
  soy: {
    heading: 'Meals with soy foods',
    allergen: 'SOY',
    // The studies are about soy foods; a splash of soy sauce isn't what they measured.
    matches: (n) => anyWord(n, ['soy', 'soya', 'tofu', 'tempeh', 'edamame', 'miso'], ['soy sauce', 'soya sauce']),
  },
  'red-meat': {
    heading: 'Meals with red meat',
    matches: (n) => anyWord(n, ['beef', 'lamb', 'pork', 'ham', 'bacon', 'veal', 'mutton', 'goat'], ['goat cheese']),
  },
  'green-tea': {
    heading: 'Meals and snacks with green tea',
    matches: (n) => anyWord(n, ['green tea', 'matcha']),
  },
};

export function containsFood(food: RelatedFood, ingredients: Ingredient[] | undefined): boolean {
  return (ingredients ?? []).some((i) => RELATED_FOODS[food].matches(i.name ?? ''));
}
