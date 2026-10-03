import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/auth/auth.service';
import { FocusPreferencesService } from '../../../core/services/focus-preferences.service';
import { ProteinPreference } from '../../../core/services/meal-plans.service';

export type HelpFirst = 'diagnosis' | 'food' | 'meals' | 'appointment';

interface Choice<T> {
  value: T;
  label: string;
  hint: string;
}

/** Where each "help me first with" choice lands after onboarding. */
export const LANDING: Record<HelpFirst, { url: string; queryParams?: Record<string, string> }> = {
  diagnosis: { url: '/health/record/count', queryParams: { flow: '1' } },
  food: { url: '/tabs/learn' },
  meals: { url: '/tabs/tab2' },
  appointment: { url: '/tabs/health' },
};

/**
 * Two short questions on full berry. Both can be skipped; nothing here is a
 * health claim and nothing is required to use the app.
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [IonContent],
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage {
  private router = inject(Router);
  private auth = inject(AuthService);
  private focusPreferences = inject(FocusPreferencesService);

  readonly email = this.auth.getUserEmail();
  readonly totalSteps = 2;
  readonly currentStep = signal(1);
  readonly helpFirst = signal<HelpFirst | null>(null);
  readonly diet = signal<ProteinPreference | null>(null);

  readonly helpChoices: Choice<HelpFirst>[] = [
    { value: 'diagnosis', label: 'Understand my diagnosis', hint: 'Record what your report says and what’s missing' },
    { value: 'food', label: 'A food question', hint: 'Check a claim you’ve read online' },
    { value: 'meals', label: 'Plan my meals', hint: 'Meals and a grocery list that fit how you eat' },
    { value: 'appointment', label: 'Prepare for an appointment', hint: 'Questions and a summary to take with you' },
  ];

  readonly dietChoices: Choice<ProteinPreference>[] = [
    { value: 'ANY', label: 'Anything', hint: 'No restrictions' },
    { value: 'PESCATARIAN', label: 'Pescatarian', hint: 'Fish, but no meat' },
    { value: 'VEGETARIAN', label: 'Vegetarian', hint: 'No meat or fish' },
    { value: 'VEGAN', label: 'Vegan', hint: 'No animal products' },
  ];

  chooseHelp(value: HelpFirst) {
    this.helpFirst.set(value);
    this.currentStep.set(2);
  }

  chooseDiet(value: ProteinPreference) {
    this.diet.set(value);
    void this.finish();
  }

  logOut() {
    this.auth.logout();
    this.router.navigateByUrl('/auth?mode=login', { replaceUrl: true });
  }

  back() {
    this.currentStep.set(1);
  }

  skip() {
    if (this.currentStep() === 1) this.currentStep.set(2);
    else void this.finish();
  }

  async finish() {
    const diet = this.diet();
    if (diet) await this.focusPreferences.saveDiet(diet);
    this.auth.setOnboardingCompleted(true);
    const help = this.helpFirst();
    const landing = help ? LANDING[help] : { url: '/tabs/today' };
    this.router.navigate([landing.url], { queryParams: landing.queryParams, replaceUrl: true });
  }
}
