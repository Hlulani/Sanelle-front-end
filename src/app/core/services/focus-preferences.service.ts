import { inject, Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { PROTEIN_PREFERENCES, ProteinPreference } from './meal-plans.service';
import { AuthService } from '../auth/auth.service';

const FOCUSES_KEY = 'onboarding_selected_focuses';
/** Per account: the device-wide key used before leaked one account's diet into the next. */
const DIET_KEY_PREFIX = 'onboarding_selected_diet.';

export type OnboardingFocus = 'anti_inflammatory' | 'iron_support' | 'high_fiber';

@Injectable({ providedIn: 'root' })
export class FocusPreferencesService {
  private auth = inject(AuthService);

  private dietKey(): string | null {
    const email = this.auth.getUserEmail();
    return email ? DIET_KEY_PREFIX + email.toLowerCase() : null;
  }

  async save(focuses: string[]): Promise<void> {
    await Preferences.set({ key: FOCUSES_KEY, value: JSON.stringify(focuses) });
  }

  async load(): Promise<OnboardingFocus[] | null> {
    const { value } = await Preferences.get({ key: FOCUSES_KEY });
    if (!value) return null;
    return JSON.parse(value) as OnboardingFocus[];
  }

  async saveDiet(diet: ProteinPreference): Promise<void> {
    const key = this.dietKey();
    if (key) await Preferences.set({ key, value: diet });
  }

  async loadDiet(): Promise<ProteinPreference | null> {
    const key = this.dietKey();
    if (!key) return null;
    const { value } = await Preferences.get({ key });
    // Older installs may hold 'MEATY', which is no longer offered.
    return PROTEIN_PREFERENCES.includes(value as ProteinPreference) ? (value as ProteinPreference) : null;
  }
}
