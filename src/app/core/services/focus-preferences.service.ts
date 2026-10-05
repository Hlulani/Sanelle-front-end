import { inject, Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { PROTEIN_PREFERENCES, ProteinPreference } from './meal-plans.service';
import { AuthService } from '../auth/auth.service';

/** What someone wants help with, one per Sanelle pillar. Shapes what Today shows first. */
export type HelpFocus = 'diagnosis' | 'food' | 'appointment';
export const HELP_FOCUSES: readonly HelpFocus[] = ['diagnosis', 'food', 'appointment'];

export const HELP_FOCUS_CHOICES: Record<HelpFocus, { label: string; hint: string }> = {
  diagnosis: { label: 'Understanding my diagnosis', hint: 'Record what your report says and what’s missing' },
  food: { label: 'Food choices', hint: 'Check food claims and plan meals that fit how you eat' },
  appointment: { label: 'Preparing for an appointment', hint: 'Questions and a summary to take with you' },
};

// Both kept per account, so one person's choices never carry over to the next.
const FOCUS_KEY_PREFIX = 'help_focus.';
const DIET_KEY_PREFIX = 'onboarding_selected_diet.';

@Injectable({ providedIn: 'root' })
export class FocusPreferencesService {
  private auth = inject(AuthService);

  /** The signed-in account's choices, in pillar order. Empty means none chosen. */
  readonly focus = signal<HelpFocus[]>([]);

  async loadFocus(): Promise<HelpFocus[]> {
    const key = this.auth.currentAccountKey(FOCUS_KEY_PREFIX);
    let focus: HelpFocus[] = [];
    if (key) {
      const { value } = await Preferences.get({ key });
      try {
        const parsed: unknown = value ? JSON.parse(value) : [];
        focus = HELP_FOCUSES.filter((f) => Array.isArray(parsed) && parsed.includes(f));
      } catch {
        focus = [];
      }
    }
    this.focus.set(focus);
    return focus;
  }

  async saveFocus(focus: HelpFocus[]): Promise<void> {
    const ordered = HELP_FOCUSES.filter((f) => focus.includes(f));
    this.focus.set(ordered);
    const key = this.auth.currentAccountKey(FOCUS_KEY_PREFIX);
    if (key) await Preferences.set({ key, value: JSON.stringify(ordered) });
  }

  async saveDiet(diet: ProteinPreference): Promise<void> {
    const key = this.auth.currentAccountKey(DIET_KEY_PREFIX);
    if (key) await Preferences.set({ key, value: diet });
  }

  async loadDiet(): Promise<ProteinPreference | null> {
    const key = this.auth.currentAccountKey(DIET_KEY_PREFIX);
    if (!key) return null;
    const { value } = await Preferences.get({ key });
    // Older installs may hold 'MEATY', which is no longer offered.
    return PROTEIN_PREFERENCES.includes(value as ProteinPreference) ? (value as ProteinPreference) : null;
  }
}
