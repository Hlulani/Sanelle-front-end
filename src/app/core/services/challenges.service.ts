import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { MealProgressService } from './meal-progress.service';
import { ApiService } from './api.service';
import { ChallengeType, ChallengeProgress, computeChallengeProgress } from './challenge-progress.util';
import { localIsoDate } from '../../shared/calendar-date';

export type { ChallengeType, ChallengeProgress };

export interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  target: number;
  type: ChallengeType;
  icon: string;
}

const STORAGE_KEY = 'joined_challenges';

export const CHALLENGE_DEFINITIONS: ChallengeDefinition[] = [
  {
    id: 'weekly-5',
    title: '5 Meals This Week',
    description: 'Cook 5 meals from your plan in the next 7 days.',
    durationDays: 7,
    target: 5,
    type: 'meals-in-period',
    icon: 'restaurant-outline',
  },
  {
    id: 'streak-3',
    title: '3-Day Cooking Streak',
    description: 'Cook at least one meal, 3 days in a row.',
    durationDays: 4,
    target: 3,
    type: 'streak',
    icon: 'flame-outline',
  },
  {
    id: 'consistency-14',
    title: '14-Day Consistency',
    description: 'Cook on at least 10 of the next 14 days.',
    durationDays: 14,
    target: 10,
    type: 'days-in-period',
    icon: 'checkmark-circle-outline',
  },
  {
    id: 'monthly-20',
    title: '30-Day Cook-Along',
    description: "Cook 20 meals from your plan over the next 30 days — the big one everyone's doing together.",
    durationDays: 30,
    target: 20,
    type: 'meals-in-period',
    icon: 'calendar-outline',
  },
];

@Injectable({ providedIn: 'root' })
export class ChallengesService {
  private mealProgress = inject(MealProgressService);
  private api = inject(ApiService);

  // Map of challengeId -> the local date (YYYY-MM-DD) it was joined on.
  private joinedAt = signal<Record<string, string>>({});
  private hydrated: Promise<void> | null = null;

  // Shared participant counts fetched from the backend — undefined until
  // the first successful fetch, so the UI can hide the count rather than
  // show a wrong one while loading or if the fetch fails.
  private counts = signal<Record<string, number>>({});

  init(): Promise<void> {
    if (!this.hydrated) {
      this.hydrated = (async () => {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (!value) return;
        try {
          this.joinedAt.set(JSON.parse(value) as Record<string, string>);
        } catch {
          this.joinedAt.set({});
        }
      })();
    }
    return this.hydrated;
  }

  definitions(): ChallengeDefinition[] {
    return CHALLENGE_DEFINITIONS;
  }

  isJoined(id: string): boolean {
    return !!this.joinedAt()[id];
  }

  join(id: string): void {
    if (this.isJoined(id)) return;
    const next = { ...this.joinedAt(), [id]: localIsoDate() };
    this.joinedAt.set(next);
    void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(next) });

    this.bumpCount(id, 1);
    this.api.joinChallenge(id).subscribe({
      next: () => this.refreshCounts(),
      error: () => this.bumpCount(id, -1),
    });
  }

  leave(id: string): void {
    if (!this.isJoined(id)) return;
    const next = { ...this.joinedAt() };
    delete next[id];
    this.joinedAt.set(next);
    void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(next) });

    this.bumpCount(id, -1);
    this.api.leaveChallenge(id).subscribe({
      next: () => this.refreshCounts(),
      error: () => this.bumpCount(id, 1),
    });
  }

  /** Count of people currently participating, or null if not loaded yet. */
  count(id: string): number | null {
    const value = this.counts()[id];
    return value === undefined ? null : value;
  }

  /** Clears local join state — used when a different account takes over this device. */
  clear(): void {
    this.joinedAt.set({});
    this.counts.set({});
    void Preferences.remove({ key: STORAGE_KEY });
  }

  refreshCounts(): void {
    const ids = CHALLENGE_DEFINITIONS.map((def) => def.id);
    this.api.getChallengeCounts(ids).subscribe({
      next: (counts) => this.counts.set(counts),
      error: () => {
        // Shared counts are a nice-to-have, not required for challenges to
        // work — leave whatever was last loaded (or nothing) rather than
        // surface an error over the whole "Try a Challenge" section.
      },
    });
  }

  private bumpCount(id: string, delta: number): void {
    const current = this.counts()[id];
    if (current === undefined) return;
    this.counts.set({ ...this.counts(), [id]: Math.max(0, current + delta) });
  }

  progress(def: ChallengeDefinition): ChallengeProgress | null {
    const startIso = this.joinedAt()[def.id];
    if (!startIso) return null;
    return computeChallengeProgress(
      def.type,
      def.target,
      def.durationDays,
      startIso,
      this.mealProgress.cookedEntries(),
    );
  }
}
