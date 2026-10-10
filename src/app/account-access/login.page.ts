import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth/auth.service';
import { ApiService } from '../core/services/api.service';
import { apiError } from '../core/errors/errors';

/** AUTH-04: wrong details and an unconfirmed email are told apart, each with its own way forward. */
@Component({
  selector: 'app-login',
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
          <section class="auth-card">
            <a class="auth-back" routerLink="/welcome">← Back</a>
            <header class="auth-introduction">
              <p class="eyebrow">Welcome back</p>
              <h1>Log in to Sanelle</h1>
              <p class="auth-description">Continue with your saved health notes and plans.</p>
            </header>
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
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
                    [attr.aria-invalid]="shows('email')"
                  />
                  @if (shows('email')) {
                    <span class="sn-error">Enter the email address you registered with.</span>
                  }
                </label>
                <label class="auth-field">
                  <span>Password <a routerLink="/reset-password">Forgot password?</a></span>
                  <div class="password-field">
                    <input
                      formControlName="password"
                      name="password"
                      aria-label="Password"
                      [type]="showPassword() ? 'text' : 'password'"
                      autocomplete="current-password"
                      placeholder="Your password"
                      [attr.aria-invalid]="shows('password')"
                    />
                    <button type="button" (click)="showPassword.set(!showPassword())">
                      {{ showPassword() ? 'Hide' : 'Show' }}
                    </button>
                  </div>
                  @if (shows('password')) {
                    <span class="sn-error">Enter your password.</span>
                  }
                </label>
              </div>
              @switch (problem()) {
                @case ('credentials') {
                  <p class="form-error" role="alert">
                    That email and password don’t match an account. Check them and try again.
                  </p>
                }
                @case ('unverified') {
                  <div class="form-error" role="alert">
                    <p><strong>Confirm your email address first.</strong></p>
                    <p>Open the link we emailed you when you registered. We can send a new one.</p>
                    <button class="auth-secondary" type="button" (click)="resend()">Send the email again</button>
                  </div>
                }
                @case ('offline') {
                  <p class="form-error" role="alert">
                    Sanelle couldn’t reach the server. Check your connection and try again.
                  </p>
                }
              }
              <button class="auth-primary" type="submit" [disabled]="busy()">
                {{ busy() ? 'Logging in…' : 'Log in' }}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M14 7l5 5-5 5" />
                </svg>
              </button>
            </form>
            <p class="auth-switch">New to Sanelle? <a routerLink="/register">Create an account</a></p>
          </section>
        </main>
      </div>
    </ion-content>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly busy = signal(false);
  readonly submitted = signal(false);
  readonly showPassword = signal(false);
  readonly problem = signal<'credentials' | 'unverified' | 'offline' | null>(null);

  readonly form = new FormGroup({
    email: new FormControl(inject(ActivatedRoute).snapshot.queryParamMap.get('email') ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  shows(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  submit() {
    this.submitted.set(true);
    this.problem.set(null);
    if (this.form.invalid || this.busy()) return;
    const { email, password } = this.form.getRawValue();
    this.busy.set(true);
    this.auth.login(email.trim(), password).subscribe({
      next: () => {
        this.busy.set(false);
        void this.router.navigateByUrl(this.auth.hasCompletedOnboarding() ? '/tabs/today' : '/onboarding', {
          replaceUrl: true,
        });
      },
      error: (err) => {
        this.busy.set(false);
        const code = apiError(err)?.code;
        this.problem.set(
          code === 'EMAIL_NOT_VERIFIED' ? 'unverified' : code === 'INVALID_CREDENTIALS' ? 'credentials' : 'offline',
        );
      },
    });
  }

  resend() {
    const email = this.form.controls.email.value.trim();
    this.api.resendVerification(email).subscribe({
      next: () =>
        void this.router.navigate(['/check-email'], { queryParams: { for: 'verify', email }, replaceUrl: true }),
      error: () => this.problem.set('offline'),
    });
  }
}
