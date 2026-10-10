import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ApiService } from '../core/services/api.service';
import { apiError } from '../core/errors/errors';
import { matching } from '../shared/forms/validators';
import { MIN_PASSWORD_LENGTH } from './register.page';

/**
 * AUTH-05. Without a token: ask for the email and send a link, never revealing whether an
 * account exists. With the emailed token: choose a new password.
 */
@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, RouterLink, ReactiveFormsModule],
  styleUrls: ['../shared/design/figma-entry.scss'],
  template: `
    <ion-content>
      <div class="auth-shell">
        <header class="auth-header">
          <div class="brand"><span class="brand-mark">s</span><span>sanelle</span></div>
          <span>Private, practical support</span>
        </header>
        <main class="auth-main">
          <section class="auth-card ">
            <a class="auth-back" routerLink="/login">← Back to login</a>
            @if (!token) {
              <header class="auth-introduction">
                <div class="auth-state-icon">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="4" y="3" width="16" height="18" rx="2" />
                    <path d="M8 2v3M16 2v3M8 10h8M8 14h5" />
                  </svg>
                </div>
                <p class="eyebrow">Reset your password</p>
                <h1>We’ll send you a secure link.</h1>
                <p class="auth-description">Enter the email address connected to your Sanelle account.</p>
              </header>
              <form class="auth-form" [formGroup]="request" (ngSubmit)="send()" novalidate>
                <div class="auth-fields">
                  <label class="auth-field">
                    <span>Email address</span>
                    <input
                      formControlName="email"
                      name="email"
                      aria-label="Email"
                      placeholder="you&#64;example.com"
                      type="email"
                      inputmode="email"
                      autocomplete="email"
                      autocapitalize="off"
                      [attr.aria-invalid]="submitted() && request.invalid"
                    />
                    @if (submitted() && request.invalid) {
                      <span class="sn-error">Enter an email address like name&#64;example.com.</span>
                    }
                  </label>
                </div>
                @if (error()) {
                  <p class="form-error" role="alert">{{ error() }}</p>
                }
                <button class="auth-primary" type="submit" [disabled]="busy()">
                  {{ busy() ? 'Sending…' : 'Send reset link' }}
                </button>
              </form>
            } @else if (done()) {
              <header class="auth-introduction">
                <h1>Password changed</h1>
                <p class="auth-description">Log in with your new password. You’ve been logged out everywhere else.</p>
              </header>
              <a class="auth-primary" routerLink="/login">Log in</a>
            } @else {
              <header class="auth-introduction">
                <h1>Choose a new password</h1>
                <p class="auth-description">At least {{ minLength }} characters.</p>
              </header>
              <form class="auth-form" [formGroup]="change" (ngSubmit)="save()" novalidate>
                <div class="auth-fields">
                  <label class="auth-field">
                    <span>New password</span>
                    <input formControlName="password" name="password" type="password" autocomplete="new-password" />
                    @if (submitted() && change.controls.password.invalid) {
                      <span class="sn-error">Use at least {{ minLength }} characters.</span>
                    }
                  </label>
                  <label class="auth-field">
                    <span>Type it again</span>
                    <input formControlName="repeat" name="repeat" type="password" autocomplete="new-password" />
                    @if (submitted() && change.hasError('matching')) {
                      <span class="sn-error">The two passwords don’t match.</span>
                    }
                  </label>
                </div>
                @if (error()) {
                  <p class="form-error" role="alert">{{ error() }}</p>
                }
                <button class="auth-primary" type="submit" [disabled]="busy()">
                  {{ busy() ? 'Saving…' : 'Save new password' }}
                </button>
              </form>
              @if (expired()) {
                <a class="auth-secondary" routerLink="/reset-password" style="margin-top: 12px">Send a new link</a>
              }
            }
          </section>
        </main>
      </div>
    </ion-content>
  `,
})
export class ResetPasswordPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');
  readonly minLength = MIN_PASSWORD_LENGTH;
  readonly busy = signal(false);
  readonly submitted = signal(false);
  readonly done = signal(false);
  readonly expired = signal(false);
  readonly error = signal<string | null>(null);

  readonly request = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });

  readonly change = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)],
      }),
      repeat: new FormControl('', { nonNullable: true }),
    },
    { validators: matching('password', 'repeat') },
  );

  send() {
    this.submitted.set(true);
    this.error.set(null);
    if (this.request.invalid || this.busy()) return;
    const email = this.request.controls.email.value.trim();
    this.busy.set(true);
    this.api.requestPasswordReset(email).subscribe({
      next: () => {
        this.busy.set(false);
        void this.router.navigate(['/check-email'], { queryParams: { for: 'reset', email }, replaceUrl: true });
      },
      error: () => {
        this.busy.set(false);
        this.error.set('The link couldn’t be sent. Check your connection and try again.');
      },
    });
  }

  save() {
    this.submitted.set(true);
    this.error.set(null);
    if (this.change.invalid || this.busy() || !this.token) return;
    this.busy.set(true);
    this.api.confirmPasswordReset(this.token, this.change.controls.password.value).subscribe({
      next: () => {
        this.busy.set(false);
        this.done.set(true);
      },
      error: (err) => {
        this.busy.set(false);
        const code = apiError(err)?.code;
        this.expired.set(code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID');
        this.error.set(
          code === 'TOKEN_EXPIRED'
            ? 'This link has expired. Ask for a new one.'
            : code === 'TOKEN_INVALID'
              ? 'This link has already been used or isn’t valid. Ask for a new one.'
              : (apiError(err)?.message ?? 'Your password couldn’t be changed. Try again.'),
        );
      },
    });
  }
}
