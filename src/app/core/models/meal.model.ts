export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface Ingredient {
  name: string;
  amount: string;
}

export interface MealResponse {
  id: string;
  name: string;
  mealType: MealType;
  antiInflammatoryScore: number;
  ironSupport: number;
  fiberScore: number;
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
