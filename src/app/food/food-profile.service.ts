import { Injectable, computed } from '@angular/core';
import { AccountRecordStore } from '../core/storage/account-record-store';
import { PROTEIN_PREFERENCES, ProteinPreference } from '../core/services/meal-plans.service';
import { FOOD_NEEDS, FoodNeed } from '../core/profile/profile.service';

/** Must match the backend's Allergen enum; the server rejects unknown codes. */
export type AllergenCode =
  'MILK' | 'EGG' | 'PEANUT' | 'TREE_NUT' | 'SOY' | 'GLUTEN' | 'FISH' | 'SHELLFISH' | 'SESAME' | 'MUSTARD' | 'CELERY';

export const ALLERGENS: { code: AllergenCode; label: string; word: string }[] = [
  { code: 'MILK', label: 'Milk', word: 'milk' },
  { code: 'EGG', label: 'Egg', word: 'egg' },
  { code: 'PEANUT', label: 'Peanut', word: 'peanut' },
  { code: 'TREE_NUT', label: 'Tree nuts', word: 'tree nut' },
  { code: 'SOY', label: 'Soy', word: 'soy' },
  { code: 'GLUTEN', label: 'Gluten', word: 'gluten' },
  { code: 'FISH', label: 'Fish', word: 'fish' },
  { code: 'SHELLFISH', label: 'Shellfish', word: 'shellfish' },
  { code: 'SESAME', label: 'Sesame', word: 'sesame' },
  { code: 'MUSTARD', label: 'Mustard', word: 'mustard' },
  { code: 'CELERY', label: 'Celery', word: 'celery' },
];

/** Religious or cultural requirements, applied as strict exclusions by ingredient name. */
export type CulturalRule = 'halal' | 'no-pork' | 'no-beef' | 'no-alcohol';
export const CULTURAL_RULES: { rule: CulturalRule; label: string; excludes: string[]; note?: string }[] = [
  {
    rule: 'halal',
    label: 'Halal',
    excludes: ['pork', 'bacon', 'ham', 'lard', 'gelatin', 'wine', 'beer', 'rum', 'mirin'],
    note: 'Sanelle leaves out recipes that list pork or alcohol. It can’t check that meat is halal-certified.',
  },
  { rule: 'no-pork', label: 'No pork', excludes: ['pork', 'bacon', 'ham', 'lard', 'gelatin'] },
  { rule: 'no-beef', label: 'No beef', excludes: ['beef', 'veal'] },
  { rule: 'no-alcohol', label: 'No alcohol in cooking', excludes: ['wine', 'beer', 'rum', 'mirin', 'sherry'] },
];

export const DIETARY_PATTERNS: { value: ProteinPreference; label: string }[] = [
  { value: 'ANY', label: 'No set pattern' },
  { value: 'PESCATARIAN', label: 'Pescatarian' },
  { value: 'VEGETARIAN', label: 'Vegetarian' },
  { value: 'VEGAN', label: 'Vegan' },
];

/**
 * Food requirements, kept as separate data:
 *  - strict (decide which meals are eligible): allergies, strict avoidances, dietary pattern,
 *    religious or cultural requirements, "don't suggest again";
 *  - preferences (decide which eligible meals come first): intolerances (flagged), dislikes,
 *    likes, practical needs, favourites, "more like this" and "fewer like this";
 *  - household: how many people a plan cooks for.
 * An allergy or strict avoidance always overrides a favourite.
 */
export interface FoodProfile {
  version: 2;
  allergies: AllergenCode[];
  strictAvoidances: string[];
  intolerances: string[];
  dietaryPattern: ProteinPreference;
  cultural: CulturalRule[];
  dislikes: string[];
  likes: string[];
  practical: FoodNeed[];
  household: number;
  favourites: string[];
  moreLike: string[];
  fewerLike: string[];
  neverSuggest: string[];
  /** "I like this meal, but not this ingredient." */
  ingredientDislikes: { mealId: string; ingredient: string }[];
  /** Meals in plans she saved before, newest first. */
  plannedBefore: string[];
  /** When she last confirmed these requirements. Until then, plans show "Needs your review". */
  reviewedAt?: string;
  /** Edits to the source design's shopping list for an individual recipe. */
  recipeShopping?: { mealId: string; edits: RecipeShoppingEdits }[];
}

export interface RecipeShoppingEdits {
  have: string[];
  removed: string[];
  added: { name: string; amount?: string }[];
}

function recipeEdits(value: unknown): RecipeShoppingEdits {
  const edits = value as Partial<RecipeShoppingEdits> | null;
  return {
    have: words(edits?.have),
    removed: words(edits?.removed),
    added: Array.isArray(edits?.added)
      ? edits.added
          .filter((item) => typeof item?.name === 'string' && item.name.trim())
          .map((item) => ({
            name: item.name.trim(),
            ...(typeof item.amount === 'string' ? { amount: item.amount } : {}),
          }))
      : [],
  };
}

const KEY_PREFIX = 'sanelle.food.v1.';

function words(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  return values
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v && !seen.has(v.toLowerCase()) && seen.add(v.toLowerCase()));
}

function ids(values: unknown): string[] {
  return Array.isArray(values) ? [...new Set(values.filter((v): v is string => typeof v === 'string'))] : [];
}

/** Food requirements and preferences, encrypted on this device per account. */
@Injectable({ providedIn: 'root' })
export class FoodProfileService extends AccountRecordStore<FoodProfile> {
  protected readonly keyPrefix = KEY_PREFIX;

  readonly profile = this.state.asReadonly();
  readonly reviewed = computed(() => !!this.state().reviewedAt);

  /** Every name the server must leave out: strict avoidances and cultural requirements. */
  readonly exclusions = computed(() => {
    const p = this.state();
    const cultural = CULTURAL_RULES.filter((r) => p.cultural.includes(r.rule)).flatMap((r) => r.excludes);
    return words([...p.strictAvoidances, ...cultural]);
  });

  protected empty(): FoodProfile {
    return {
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
    };
  }

  protected revive(stored: unknown): FoodProfile {
    const p = (stored ?? {}) as Partial<FoodProfile> & { dislikes?: unknown };
    const codes = ALLERGENS.map((a) => a.code);
    const allergies = Array.isArray(p.allergies) ? codes.filter((c) => p.allergies!.includes(c)) : [];
    // Version 1 held only allergies and "foods I don't eat", which were always left out of plans.
    if (p.version !== 2) return { ...this.empty(), allergies, strictAvoidances: words(p.dislikes) };
    return {
      ...this.empty(),
      allergies,
      strictAvoidances: words(p.strictAvoidances),
      intolerances: words(p.intolerances),
      dietaryPattern: PROTEIN_PREFERENCES.includes(p.dietaryPattern as ProteinPreference)
        ? (p.dietaryPattern as ProteinPreference)
        : 'ANY',
      cultural: CULTURAL_RULES.map((r) => r.rule).filter((r) => (p.cultural ?? []).includes(r)),
      dislikes: words(p.dislikes),
      likes: words(p.likes),
      practical: FOOD_NEEDS.filter((n) => (p.practical ?? []).includes(n)),
      household: Number.isInteger(p.household) && p.household! >= 1 && p.household! <= 12 ? p.household! : 1,
      favourites: ids(p.favourites),
      moreLike: ids(p.moreLike),
      fewerLike: ids(p.fewerLike),
      neverSuggest: ids(p.neverSuggest),
      ingredientDislikes: Array.isArray(p.ingredientDislikes)
        ? p.ingredientDislikes.filter((d) => typeof d?.mealId === 'string' && typeof d?.ingredient === 'string')
        : [],
      plannedBefore: ids(p.plannedBefore).slice(0, 200),
      reviewedAt: typeof p.reviewedAt === 'string' ? p.reviewedAt : undefined,
      recipeShopping: Array.isArray(p.recipeShopping)
        ? p.recipeShopping
            .filter((item) => typeof item?.mealId === 'string')
            .map((item) => ({ mealId: item.mealId, edits: recipeEdits(item.edits) }))
        : [],
    };
  }

  /** Saves the requirements screen and records that she reviewed them. */
  saveRequirements(
    changes: Pick<
      FoodProfile,
      | 'allergies'
      | 'strictAvoidances'
      | 'intolerances'
      | 'dietaryPattern'
      | 'cultural'
      | 'dislikes'
      | 'likes'
      | 'practical'
      | 'household'
    >,
  ): Promise<void> {
    return this.update((current) => ({
      ...current,
      ...changes,
      strictAvoidances: words(changes.strictAvoidances),
      intolerances: words(changes.intolerances),
      dislikes: words(changes.dislikes),
      likes: words(changes.likes),
      household: Math.min(12, Math.max(1, Math.round(changes.household))),
      reviewedAt: new Date().toISOString(),
    }));
  }

  /** Practical needs chosen during setup start the food profile, without marking it reviewed. */
  seedPractical(needs: FoodNeed[]): Promise<void> {
    return this.update((current) => (current.reviewedAt ? current : { ...current, practical: [...needs] }));
  }

  toggleFavourite(mealId: string): Promise<void> {
    return this.update((p) => ({ ...p, favourites: toggled(p.favourites, mealId) }));
  }

  moreLikeThis(mealId: string): Promise<void> {
    return this.update((p) => ({
      ...p,
      moreLike: toggled(p.moreLike, mealId),
      fewerLike: p.fewerLike.filter((id) => id !== mealId),
    }));
  }

  fewerLikeThis(mealId: string): Promise<void> {
    return this.update((p) => ({
      ...p,
      fewerLike: toggled(p.fewerLike, mealId),
      moreLike: p.moreLike.filter((id) => id !== mealId),
    }));
  }

  dontSuggest(mealId: string): Promise<void> {
    return this.update((p) => ({
      ...p,
      neverSuggest: [...new Set([...p.neverSuggest, mealId])],
      favourites: p.favourites.filter((id) => id !== mealId),
    }));
  }

  allowAgain(mealId: string): Promise<void> {
    return this.update((p) => ({ ...p, neverSuggest: p.neverSuggest.filter((id) => id !== mealId) }));
  }

  dislikeIngredientIn(mealId: string, ingredient: string): Promise<void> {
    const name = ingredient.trim();
    if (!name) return Promise.resolve();
    return this.update((p) =>
      p.ingredientDislikes.some((d) => d.mealId === mealId && d.ingredient.toLowerCase() === name.toLowerCase())
        ? p
        : { ...p, ingredientDislikes: [...p.ingredientDislikes, { mealId, ingredient: name }] },
    );
  }

  rememberPlanned(mealIds: string[]): Promise<void> {
    return this.update((p) => ({ ...p, plannedBefore: [...new Set([...mealIds, ...p.plannedBefore])].slice(0, 200) }));
  }

  recipeShoppingFor(mealId: string): RecipeShoppingEdits {
    return this.state().recipeShopping?.find((item) => item.mealId === mealId)?.edits ?? recipeEdits(null);
  }

  editRecipeShopping(mealId: string, change: (edits: RecipeShoppingEdits) => RecipeShoppingEdits): Promise<void> {
    return this.update((p) => ({
      ...p,
      recipeShopping: [
        ...(p.recipeShopping ?? []).filter((item) => item.mealId !== mealId),
        { mealId, edits: change(p.recipeShopping?.find((item) => item.mealId === mealId)?.edits ?? recipeEdits(null)) },
      ],
    }));
  }
}

function toggled(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}
