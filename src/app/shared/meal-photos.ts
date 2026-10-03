/**
 * Licensed photos matched to specific recipes, keyed by recipe name.
 * Only add a photo when it shows the recipe itself (same main ingredients,
 * nothing prominent that the recipe doesn't contain). Everything else uses the
 * designed fallback. Sources and licences: docs/design/image-credits.md.
 */
export interface MealPhoto {
  src: string;
  alt: string;
  credit: string;
}

export const MEAL_PHOTOS: Record<string, MealPhoto> = {
  'Roasted Vegetable and Chickpea Curry': {
    src: 'assets/meals/roasted-vegetable-chickpea-curry.jpg',
    alt: 'Chickpea and vegetable curry in a coconut sauce with rice',
    credit: 'Álvaro Bernal / Unsplash',
  },
  'Tomato Mozzarella Snack Plate': {
    src: 'assets/meals/tomato-mozzarella-plate.jpg',
    alt: 'Tomato and mozzarella with olive oil on a white plate',
    credit: 'Brina Blum / Unsplash',
  },
};

export function photoFor(name: string | undefined | null): MealPhoto | null {
  return (name && MEAL_PHOTOS[name]) || null;
}
