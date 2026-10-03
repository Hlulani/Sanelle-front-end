import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { PROTEIN_PREFERENCES, ProteinPreference } from './meal-plans.service';

const FOCUSES_KEY = 'onboarding_selected_focuses';
const DIET_KEY = 'onboarding_selected_diet';

export type OnboardingFocus = 'anti_inflammatory' | 'iron_support' | 'high_fiber';

@Injectable({ providedIn: 'root' })
export class FocusPreferencesService {
  async save(focuses: string[]): Promise<void> {
    await Preferences.set({ key: FOCUSES_KEY, value: JSON.stringify(focuses) });
  }

  async load(): Promise<OnboardingFocus[] | null> {
    const { value } = await Preferences.get({ key: FOCUSES_KEY });
    if (!value) return null;
    return JSON.parse(value) as OnboardingFocus[];
  }

  async saveDiet(diet: ProteinPreference): Promise<void> {
    await Preferences.set({ key: DIET_KEY, value: diet });
  }

  async loadDiet(): Promise<ProteinPreference | null> {
    const { value } = await Preferences.get({ key: DIET_KEY });
    // Older installs may hold 'MEATY', which is no longer offered.
    return PROTEIN_PREFERENCES.includes(value as ProteinPreference) ? (value as ProteinPreference) : null;
  }
}
