import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth/auth.service';
import { ApiService } from '../core/services/api.service';
import { apiError } from '../core/errors/errors';
import { PendingSignIn } from './pending-sign-in.service';

/**
 * AUTH-03: after registering, or after asking for a reset link. The two emails are worded
 * differently, and the reset version never says whether an account exists.
 */
@Component({
  selector: 'app-check-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, RouterLink],
  styleUrls: ['../shared/design/figma-entry.scss'],
  template: `
    <ion-content>
      <div class="auth-shell">
        <header class="auth-header">
          <div class="brand"><span class="brand-mark">s</span><span>sanelle</span></div>
          <span>Private, practical support</span>
        </header>
        <main class="auth-main">
          <section class="auth-card auth-confirmation">
            <div class="auth-state-icon">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            </div>
            <header class="auth-introduction">
              <p class="eyebrow">Check your email</p>
              <h1>Your link is on its way.</h1>
              @if (isReset()) {
                <p class="auth-description">
                  If there’s an account for <strong>{{ email() }}</strong
                  >, we’ve sent a link to choose a new password. It works for one hour.
                </p>
              } @else {
                <p class="auth-description">
                  We sent a link to <strong>{{ email() }}</strong
                  >. Open it to confirm your email address, then continue.
                </p>
              }
            </header>

            @if (!isReset()) {
              @if (notYet()) {
                <p class="form-error" role="status">
                  Your email address isn’t confirmed yet. Open the link in the email, then try again.
                </p>
              }
              @if (error()) {
                <p class="form-error" role="alert">{{ error() }}</p>
              }
              <div class="auth-actions">
                <button class="auth-primary" type="button" [disabled]="busy()" (click)="continue()">
                  {{ busy() ? 'Checking…' : 'Continue to Sanelle' }}
                </button>
                <button class="auth-secondary" type="button" [disabled]="busy()" (click)="resend()">
                  Send the email again
                </button>
              </div>
              @if (resent()) {
                <p class="auth-description" role="status" style="margin-top: 12px">
                  We’ve sent a new link. Older links no longer work.
                </p>
              }
            }
            <p class="sn-hint" style="margin-top: 20px">
              Nothing arrived? Check your spam folder. The email comes from Sanelle.
            </p>
            <a class="auth-secondary" routerLink="/login" style="margin-top: 8px">Back to login</a>
          </section>
        </main>
      </div>
    </ion-content>
  `,
})
export class CheckEmailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly pending = inject(PendingSignIn);

  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly isReset = computed(() => this.params().get('for') === 'reset');
  readonly email = computed(() => this.params().get('email') ?? 'your email address');

  readonly busy = signal(false);
  readonly notYet = signal(false);
  readonly resent = signal(false);
  readonly error = signal<string | null>(null);

  /** Signs in with the details just registered; still unverified means "not yet". */
  continue() {
    const details = this.pending.get();
    if (!details) {
      void this.router.navigate(['/login'], { queryParams: { email: this.params().get('email') } });
      return;
    }
    this.busy.set(true);
    this.notYet.set(false);
    this.error.set(null);
    this.auth.login(details.email, details.password).subscribe({
      next: () => {
        this.busy.set(false);
        this.pending.clear();
        void this.router.navigateByUrl(this.auth.hasCompletedOnboarding() ? '/tabs/today' : '/onboarding', {
          replaceUrl: true,
        });
      },
      error: (err) => {
        this.busy.set(false);
        if (apiError(err)?.code === 'EMAIL_NOT_VERIFIED') this.notYet.set(true);
        else this.error.set('Sanelle couldn’t check right now. Check your connection and try again.');
      },
    });
  }

  resend() {
    const email = this.params().get('email');
    if (!email) return;
    this.busy.set(true);
    this.api.resendVerification(email).subscribe({
      next: () => {
        this.busy.set(false);
        this.resent.set(true);
      },
      error: () => {
        this.busy.set(false);
        this.error.set('The email couldn’t be sent. Check your connection and try again.');
      },
    });
  }
}
