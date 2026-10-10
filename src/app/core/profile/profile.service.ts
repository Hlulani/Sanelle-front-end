import { Injectable, computed } from '@angular/core';
import { AccountRecordStore } from '../storage/account-record-store';

/** What someone wants help with first. Ordering and shortcuts only; never a medical recommendation. */
export type Priority = 'diagnosis' | 'food' | 'symptoms' | 'appointment';
export const PRIORITIES: readonly Priority[] = ['diagnosis', 'food', 'symptoms', 'appointment'];
export const PRIORITY_CHOICES: Record<Priority, { label: string; hint: string }> = {
  diagnosis: { label: 'Understand my diagnosis', hint: 'What my report says, and what it leaves out' },
  food: { label: 'Figure out food', hint: 'Meals that fit how I eat, and food claims I’ve heard' },
  symptoms: { label: 'Keep track of symptoms', hint: 'Short check-ins I can bring to a visit' },
  appointment: { label: 'Prepare for appointments', hint: 'My questions, answers and next steps' },
};

/** Check-in sections someone wants to see first. */
export type TrackedSymptom = 'bleeding' | 'pain' | 'pressure' | 'tiredness' | 'impact';
export const TRACKED_SYMPTOMS: readonly TrackedSymptom[] = ['bleeding', 'pain', 'pressure', 'tiredness', 'impact'];
export const TRACKED_SYMPTOM_LABELS: Record<TrackedSymptom, string> = {
  bleeding: 'Bleeding',
  pain: 'Pain',
  pressure: 'Pressure or bloating',
  tiredness: 'Tiredness',
  impact: 'Effect on my day',
};

/** Practical food needs and planning interests. They are never strict exclusions. */
export type FoodNeed = 'quick' | 'ingredient-swaps' | 'batch' | 'budget' | 'few-ingredients' | 'no-cook';
export const FOOD_NEEDS: readonly FoodNeed[] = [
  'quick',
  'ingredient-swaps',
  'batch',
  'budget',
  'few-ingredients',
  'no-cook',
];
export const FOOD_NEED_LABELS: Record<FoodNeed, string> = {
  quick: 'Quick meals',
  'ingredient-swaps': 'Ingredient swaps',
  batch: 'Cook once, eat twice',
  budget: 'Keep costs down',
  'few-ingredients': 'Few ingredients',
  'no-cook': 'Little or no cooking',
};

export interface Profile {
  version: 1;
  name: string;
  priorities: Priority[];
  trackSymptoms: TrackedSymptom[];
  foodNeeds: FoodNeed[];
  /** Setup preferences; these do not assert symptom absence or impose dietary exclusions. */
  onboardingContext?: { noSymptomsRightNow: boolean; cookingForOthers: boolean; foodClaimHelp: boolean };
  /** First-use Today is shown once, then replaced by the returning Today. */
  firstUseDone: boolean;
  onboardedAt?: string;
}

const KEY_PREFIX = 'sanelle.profile.v1.';

function only<T>(allowed: readonly T[], values: unknown): T[] {
  return Array.isArray(values) ? allowed.filter((a) => values.includes(a)) : [];
}

/** Personal setup choices, encrypted on this device per account. */
@Injectable({ providedIn: 'root' })
export class ProfileService extends AccountRecordStore<Profile> {
  protected readonly keyPrefix = KEY_PREFIX;

  readonly profile = this.state.asReadonly();
  /** The preferred name, falling back to the name given at registration. */
  readonly name = computed(() => this.state().name || this.auth.getDisplayName() || '');

  protected empty(): Profile {
    return { version: 1, name: '', priorities: [], trackSymptoms: [], foodNeeds: [], firstUseDone: false };
  }

  protected revive(stored: unknown): Profile {
    const p = stored as Partial<Profile> | null;
    if (p?.version !== 1) return this.empty();
    return {
      version: 1,
      name: typeof p.name === 'string' ? p.name : '',
      priorities: only(PRIORITIES, p.priorities),
      trackSymptoms: only(TRACKED_SYMPTOMS, p.trackSymptoms),
      foodNeeds: only(FOOD_NEEDS, p.foodNeeds),
      firstUseDone: p.firstUseDone === true,
      onboardedAt: p.onboardedAt,
      onboardingContext: {
        noSymptomsRightNow: p.onboardingContext?.noSymptomsRightNow === true,
        cookingForOthers: p.onboardingContext?.cookingForOthers === true,
        foodClaimHelp: p.onboardingContext?.foodClaimHelp === true,
      },
    };
  }

  save(changes: Partial<Omit<Profile, 'version'>>): Promise<void> {
    return this.update((current) => ({
      ...current,
      ...changes,
      name: (changes.name ?? current.name).trim(),
      // Keep every list in its fixed order, so nothing reads as a ranking she didn't make.
      priorities: changes.priorities ? only(PRIORITIES, changes.priorities) : current.priorities,
      trackSymptoms: changes.trackSymptoms ? only(TRACKED_SYMPTOMS, changes.trackSymptoms) : current.trackSymptoms,
      foodNeeds: changes.foodNeeds ? only(FOOD_NEEDS, changes.foodNeeds) : current.foodNeeds,
    }));
  }
}
