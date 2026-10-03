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
