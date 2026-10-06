import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { MealProgressService } from './meal-progress.service';
import { ApiService, CustomChallengeResponse, ChallengeMemberResponse } from './api.service';
import { ChallengeProgress, computeChallengeProgress } from './challenge-progress.util';
import { localIsoDate } from '../../shared/calendar-date';
import { apiError } from '../errors/errors';

const STORAGE_KEY = 'joined_custom_challenges';

@Injectable({ providedIn: 'root' })
export class CustomChallengesService {
  private api = inject(ApiService);
  private mealProgress = inject(MealProgressService);

  private challenges = signal<CustomChallengeResponse[]>([]);
  private loading = signal(false);
  private error = signal<string | null>(null);

  // Map of challengeId -> the local date (YYYY-MM-DD) this device started
  // tracking progress on — same local-only progress model as the built-in
  // challenges. The server only ever needs to know who's a member, never
  // what anyone's actually cooked.
  private joinedAt = signal<Record<string, string>>({});
  private hydrated: Promise<void> | null = null;

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

  list(): CustomChallengeResponse[] {
    return this.challenges();
  }

  isLoading(): boolean {
    return this.loading();
  }

  errorMessage(): string | null {
    return this.error();
  }

  refresh(onComplete?: () => void): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getMyCustomChallenges().subscribe({
      next: (list) => {
        this.challenges.set(list);
        this.loading.set(false);
        this.reconcileLocalJoins(list);
        onComplete?.();
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load your challenges.');
        onComplete?.();
      },
    });
  }

  create(
    name: string,
    description: string | undefined,
    type: CustomChallengeResponse['type'],
    targetCount: number,
    durationDays: number,
    onSuccess: (challenge: CustomChallengeResponse) => void,
    onError: (message: string) => void,
  ): void {
    this.api.createCustomChallenge({ name, description, type, targetCount, durationDays }).subscribe({
      next: (challenge) => {
        this.recordLocalJoin(challenge.id);
        this.refresh();
        onSuccess(challenge);
      },
      error: () => onError('Could not create the challenge. Please try again.'),
    });
  }

  joinByCode(
    inviteCode: string,
    onSuccess: (challenge: CustomChallengeResponse) => void,
    onError: (message: string) => void,
  ): void {
    this.api.joinCustomChallengeByCode(inviteCode.trim().toUpperCase()).subscribe({
      next: (challenge) => {
        this.recordLocalJoin(challenge.id);
        this.refresh();
        onSuccess(challenge);
      },
      error: (err) => {
        const message =
          apiError(err)?.status === 404
            ? "That code doesn't match a challenge. Double-check it and try again."
            : 'Could not join that challenge. Please try again.';
        onError(message);
      },
    });
  }

  getMembers(challengeId: string) {
    return this.api.getCustomChallengeMembers(challengeId);
  }

  progress(challenge: CustomChallengeResponse): ChallengeProgress | null {
    const startIso = this.joinedAt()[challenge.id];
    if (!startIso) return null;
    return computeChallengeProgress(
      challenge.type,
      challenge.targetCount,
      challenge.durationDays,
      startIso,
      this.mealProgress.cookedEntries(),
    );
  }

  /** Clears local join-tracking state — used when a different account takes over this device. */
  clear(): void {
    this.joinedAt.set({});
    this.challenges.set([]);
    void Preferences.remove({ key: STORAGE_KEY });
  }

  private recordLocalJoin(challengeId: string): void {
    if (this.joinedAt()[challengeId]) return;
    const next = { ...this.joinedAt(), [challengeId]: localIsoDate() };
    this.joinedAt.set(next);
    void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(next) });
  }

  /**
   * A challenge fetched from the server (created or joined elsewhere, e.g. a
   * reinstall) might not have a local join date yet — backfill with today so
   * progress still renders instead of silently showing nothing.
   */
  private reconcileLocalJoins(list: CustomChallengeResponse[]): void {
    const current = this.joinedAt();
    let changed = false;
    const next = { ...current };
    for (const challenge of list) {
      if (!next[challenge.id]) {
        next[challenge.id] = localIsoDate();
        changed = true;
      }
    }
    if (changed) {
      this.joinedAt.set(next);
      void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(next) });
    }
  }
}

export type { ChallengeMemberResponse };
