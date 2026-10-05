import { Injectable, computed } from '@angular/core';
import { AccountRecordStore } from '../storage/account-record-store';

/** Must match the backend's Allergen enum; the server rejects unknown codes. */
export type AllergenCode =
  | 'MILK' | 'EGG' | 'PEANUT' | 'TREE_NUT' | 'SOY' | 'GLUTEN'
  | 'FISH' | 'SHELLFISH' | 'SESAME' | 'MUSTARD' | 'CELERY';

export const ALLERGENS: { code: AllergenCode; label: string }[] = [
  { code: 'MILK', label: 'Milk' },
  { code: 'EGG', label: 'Egg' },
  { code: 'PEANUT', label: 'Peanut' },
  { code: 'TREE_NUT', label: 'Tree nuts' },
  { code: 'SOY', label: 'Soy' },
  { code: 'GLUTEN', label: 'Gluten' },
  { code: 'FISH', label: 'Fish' },
  { code: 'SHELLFISH', label: 'Shellfish' },
  { code: 'SESAME', label: 'Sesame' },
  { code: 'MUSTARD', label: 'Mustard' },
  { code: 'CELERY', label: 'Celery' },
];

export interface FoodRestrictions {
  allergies: AllergenCode[];
  dislikes: string[];
}

const KEY_PREFIX = 'sanelle.food.v1.';

export function sameRestrictions(a: FoodRestrictions | null, b: FoodRestrictions): boolean {
  if (!a) return b.allergies.length === 0 && b.dislikes.length === 0;
  const norm = (r: FoodRestrictions) =>
    JSON.stringify({ a: [...r.allergies].sort(), d: [...r.dislikes].map((d) => d.toLowerCase()).sort() });
  return norm(a) === norm(b);
}

/**
 * Allergies and foods someone doesn't eat, kept encrypted on this device per account.
 * They're sent with each plan or swap request and enforced by the server.
 */
@Injectable({ providedIn: 'root' })
export class FoodRestrictionsService extends AccountRecordStore<FoodRestrictions> {
  protected readonly keyPrefix = KEY_PREFIX;

  readonly restrictions = this.state.asReadonly();
  readonly hasAny = computed(() => this.state().allergies.length > 0 || this.state().dislikes.length > 0);

  protected empty(): FoodRestrictions {
    return { allergies: [], dislikes: [] };
  }

  protected revive(stored: unknown): FoodRestrictions {
    const parsed = stored as Partial<FoodRestrictions> | null;
    return { allergies: parsed?.allergies ?? [], dislikes: parsed?.dislikes ?? [] };
  }

  toggleAllergy(code: AllergenCode): Promise<void> {
    return this.update((current) => ({ ...current, allergies: current.allergies.includes(code)
      ? current.allergies.filter((c) => c !== code) : [...current.allergies, code] }));
  }

  addDislike(food: string): Promise<void> {
    const f = food.trim();
    if (!f) return Promise.resolve();
    return this.update((current) => current.dislikes.some((d) => d.toLowerCase() === f.toLowerCase())
      ? current : { ...current, dislikes: [...current.dislikes, f] });
  }

  removeDislike(food: string): Promise<void> {
    return this.update((current) => ({ ...current, dislikes: current.dislikes.filter((d) => d !== food) }));
  }
}
