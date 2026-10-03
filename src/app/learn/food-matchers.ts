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
];

const NOT_DAIRY = [
  'almond milk', 'oat milk', 'soy milk', 'soya milk', 'coconut milk', 'rice milk', 'cashew milk',
  'coconut cream', 'coconut yogurt', 'peanut butter', 'almond butter', 'nut butter', 'cashew butter',
  'sunflower butter', 'seed butter', 'cocoa butter', 'shea butter', 'cream of tartar', 'vegan',
  'dairy-free', 'plant-based',
];

export function isDairyIngredient(name: string): boolean {
  const n = name.toLowerCase();
  if (NOT_DAIRY.some((t) => n.includes(t))) return false;
  return DAIRY_TERMS.some((t) => new RegExp(`\\b${t}\\b`).test(n));
}

export function containsDairy(ingredients: Ingredient[] | undefined): boolean {
  return (ingredients ?? []).some((i) => isDairyIngredient(i.name ?? ''));
}
