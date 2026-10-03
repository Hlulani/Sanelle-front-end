import { Injectable, computed, inject, signal } from '@angular/core';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { AuthService } from '../auth/auth.service';

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
export class FoodRestrictionsService {
  private auth = inject(AuthService);
  private store = inject(EncryptedStore);
  private readonly state = signal<FoodRestrictions>({ allergies: [], dislikes: [] });
  private loadedFor: string | null = null;

  readonly restrictions = this.state.asReadonly();
  readonly hasAny = computed(() => this.state().allergies.length > 0 || this.state().dislikes.length > 0);

  async load(): Promise<void> {
    const email = this.auth.getUserEmail();
    if (!email) {
      this.state.set({ allergies: [], dislikes: [] });
      return;
    }
    const key = KEY_PREFIX + email.toLowerCase();
    if (this.loadedFor === key) return;
    this.loadedFor = key;
    const value = await this.store.get(key);
    try {
      const parsed = value ? (JSON.parse(value) as FoodRestrictions) : null;
      this.state.set({ allergies: parsed?.allergies ?? [], dislikes: parsed?.dislikes ?? [] });
    } catch {
      this.state.set({ allergies: [], dislikes: [] });
    }
  }

  toggleAllergy(code: AllergenCode): Promise<void> {
    const cur = this.state().allergies;
    const allergies = cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code];
    return this.save({ ...this.state(), allergies });
  }

  addDislike(food: string): Promise<void> {
    const f = food.trim();
    if (!f || this.state().dislikes.some((d) => d.toLowerCase() === f.toLowerCase())) return Promise.resolve();
    return this.save({ ...this.state(), dislikes: [...this.state().dislikes, f] });
  }

  removeDislike(food: string): Promise<void> {
    return this.save({ ...this.state(), dislikes: this.state().dislikes.filter((d) => d !== food) });
  }

  /** Removes one account's restrictions from this device (used when deleting the account). */
  async clearFor(email: string): Promise<void> {
    await this.store.remove(KEY_PREFIX + email.toLowerCase());
    if (this.loadedFor === KEY_PREFIX + email.toLowerCase()) {
      this.loadedFor = null;
      this.state.set({ allergies: [], dislikes: [] });
    }
  }

  private async save(next: FoodRestrictions): Promise<void> {
    this.state.set(next);
    const email = this.auth.getUserEmail();
    if (email) await this.store.set(KEY_PREFIX + email.toLowerCase(), JSON.stringify(next));
  }
}
