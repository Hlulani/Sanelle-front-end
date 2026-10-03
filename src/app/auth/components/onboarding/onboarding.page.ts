import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/auth/auth.service';
import {
  FocusPreferencesService,
  HELP_FOCUSES,
  HELP_FOCUS_CHOICES,
  HelpFocus,
} from '../../../core/services/focus-preferences.service';

/**
 * One question on full berry: what someone wants help with. Any number of answers, or none.
 * The answer sets what Today shows first and can be changed in Account. Always lands on Today,
 * so the app and its tabs are seen before any task starts.
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
  readonly choices = HELP_FOCUSES.map((value) => ({ value, ...HELP_FOCUS_CHOICES[value] }));
  readonly selected = signal<HelpFocus[]>([]);
  private finishing = false;

  isSelected(value: HelpFocus): boolean {
    return this.selected().includes(value);
  }

  toggle(value: HelpFocus) {
    this.selected.update((s) => (s.includes(value) ? s.filter((v) => v !== value) : [...s, value]));
  }

  continue() {
    void this.finish(this.selected());
  }

  skip() {
    void this.finish([]);
  }

  async finish(focus: HelpFocus[]) {
    // A quick double tap shouldn't finish twice.
    if (this.finishing) return;
    this.finishing = true;
    await this.focusPreferences.saveFocus(focus);
    this.auth.setOnboardingCompleted(true);
    await this.router.navigate(['/tabs/today'], { replaceUrl: true });
  }

  logOut() {
    this.auth.logout();
    this.router.navigateByUrl('/auth?mode=login', { replaceUrl: true });
  }
}
