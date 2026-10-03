import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'cooked_meals';

@Injectable({ providedIn: 'root' })
export class MealProgressService {
  private cookedKeys = signal<Set<string>>(new Set());
  private hydrated: Promise<void> | null = null;

  init(): Promise<void> {
    if (!this.hydrated) {
      this.hydrated = (async () => {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (!value) return;
        try {
          const keys: string[] = JSON.parse(value);
          this.cookedKeys.set(new Set(keys));
        } catch {
          this.cookedKeys.set(new Set());
        }
      })();
    }
    return this.hydrated;
  }

  isCooked(date: string, mealId: string): boolean {
    return this.cookedKeys().has(this.keyFor(date, mealId));
  }

  /** Distinct dates (YYYY-MM-DD) that have at least one meal marked cooked. */
  cookedDates(): string[] {
    const dates = new Set(this.cookedEntries().map((entry) => entry.date));
    return Array.from(dates).sort();
  }

  /** Every individual cooked meal, as (date, mealId) pairs — one entry per meal, not per day. */
  cookedEntries(): { date: string; mealId: string }[] {
    return Array.from(this.cookedKeys()).map((key) => {
      const [date, mealId] = key.split('::');
      return { date, mealId };
    });
  }

  toggleCooked(date: string, mealId: string): void {
    const key = this.keyFor(date, mealId);
    const next = new Set(this.cookedKeys());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.cookedKeys.set(next);
    void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(Array.from(next)) });
  }

  clear(): void {
    this.cookedKeys.set(new Set());
    void Preferences.remove({ key: STORAGE_KEY });
  }

  private keyFor(date: string, mealId: string): string {
    return `${date}::${mealId}`;
  }
}
