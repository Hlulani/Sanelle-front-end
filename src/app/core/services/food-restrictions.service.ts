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
  private loading: Promise<void> | null = null;
  private queue: Promise<void> = Promise.resolve();
  private pendingWrites = 0;
  private readonly savingState = signal(false);
  readonly saving = this.savingState.asReadonly();

  readonly restrictions = this.state.asReadonly();
  readonly hasAny = computed(() => this.state().allergies.length > 0 || this.state().dislikes.length > 0);

  async load(): Promise<void> {
    const email = this.auth.getUserEmail();
    if (!email) {
      this.state.set({ allergies: [], dislikes: [] });
      this.loadedFor = null;
      this.loading = null;
      return;
    }
    const key = KEY_PREFIX + email.toLowerCase();
    if (this.loadedFor === key && this.loading) return this.loading;
    this.loadedFor = key;
    this.loading = (async () => {
      const value = await this.store.get(key);
      let next: FoodRestrictions = { allergies: [], dislikes: [] };
      try {
        const parsed = value ? (JSON.parse(value) as FoodRestrictions) : null;
        next = { allergies: parsed?.allergies ?? [], dislikes: parsed?.dislikes ?? [] };
      } catch { /* Unreadable preferences start empty. */ }
      if (this.loadedFor === key) this.state.set(next);
    })();
    return this.loading;
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

  /** Removes one account's restrictions from this device (used when deleting the account). */
  async clearFor(email: string): Promise<void> {
    await this.queue;
    await this.store.remove(KEY_PREFIX + email.toLowerCase());
    if (this.loadedFor === KEY_PREFIX + email.toLowerCase()) {
      this.loadedFor = null;
      this.loading = null;
      this.state.set({ allergies: [], dislikes: [] });
    }
  }

  private update(change: (current: FoodRestrictions) => FoodRestrictions): Promise<void> {
    const email = this.auth.getUserEmail();
    this.pendingWrites++; this.savingState.set(true);
    const saved = this.queue.then(async () => {
      if (!email || email !== this.auth.getUserEmail()) throw new Error('Sign in again before changing your food choices.');
      await this.load();
      if (email !== this.auth.getUserEmail()) throw new Error('Your account changed. Sign in again before changing food choices.');
      const next = change(this.state());
      await this.store.set(KEY_PREFIX + email.toLowerCase(), JSON.stringify(next));
      if (email === this.auth.getUserEmail()) this.state.set(next);
    }).finally(() => { if (--this.pendingWrites === 0) this.savingState.set(false); });
    this.queue = saved.catch(() => undefined);
    return saved;
  }
}
