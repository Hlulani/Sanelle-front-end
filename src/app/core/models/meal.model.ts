export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

export interface Ingredient {
  name: string;
  amount: string;
}

export interface MealResponse {
  id: string;
  name: string;
  mealType: MealType;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  imageUrl?: string;
  whyItHelps?: string | null;
  vegetableSubstitutes?: string | null;
  freshOrFrozen?: string | null;
  colorPalette?: string | null;
  prepTimeMinutes?: number | null;
  dietaryTags?: string[];
}
