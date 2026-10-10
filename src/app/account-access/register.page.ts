import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth/auth.service';
import { apiError } from '../core/errors/errors';
import { notBlank } from '../shared/forms/validators';
import { PendingSignIn } from './pending-sign-in.service';

export const MIN_PASSWORD_LENGTH = 8;

/** AUTH-02: the minimum to create an account. Health details come later, and only if she wants. */
@Component({
  selector: 'app-register',
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
              <p class="eyebrow">Create your account</p>
              <h1>Let’s make Sanelle yours.</h1>
              <p class="auth-description">
                Your account lets you return to your diagnosis notes, meal plans, symptom history, and appointment
                questions.
              </p>
            </header>
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <div class="auth-fields">
                <label class="auth-field">
                  <span>First name</span>
                  <input
                    formControlName="name"
                    name="name"
                    aria-label="Your first name"
                    autocomplete="given-name"
                    placeholder="How should we address you?"
                    [attr.aria-invalid]="shows('name')"
                  />
                  @if (shows('name')) {
                    <span class="sn-error">Add the name you’d like Sanelle to use.</span>
                  }
                </label>
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
                    [attr.aria-invalid]="shows('email') || !!emailTaken()"
                  />
                  @if (shows('email')) {
                    <span class="sn-error">Enter an email address like name&#64;example.com.</span>
                  }
                  @if (emailTaken()) {
                    <span class="sn-error" role="alert"
                      >This email already has an account. <a routerLink="/login">Log in instead</a>.</span
                    >
                  }
                </label>
                <label class="auth-field">
                  <span>Password</span>
                  <div class="password-field">
                    <input
                      formControlName="password"
                      name="password"
                      aria-label="Password"
                      [type]="showPassword() ? 'text' : 'password'"
                      autocomplete="new-password"
                      [attr.aria-invalid]="shows('password')"
                      placeholder="At least 8 characters"
                    />
                    <button type="button" (click)="showPassword.set(!showPassword())">
                      {{ showPassword() ? 'Hide' : 'Show' }}
                    </button>
                  </div>
                  @if (shows('password')) {
                    <span class="sn-error">Use at least {{ minLength }} characters.</span>
                  }
                </label>
              </div>
              <label class="terms-check">
                <input type="checkbox" formControlName="terms" name="terms" [attr.aria-invalid]="shows('terms')" />
                <span><a routerLink="/terms">I agree to the Terms and acknowledge the Privacy Policy.</a></span>
              </label>
              @if (shows('terms')) {
                <span class="sn-error">Tick the box to say you’ve read the terms.</span>
              }
              @if (error()) {
                <p class="form-error" role="alert">{{ error() }}</p>
              }
              <button class="auth-primary" type="submit" [disabled]="busy()">
                {{ busy() ? 'Creating your account…' : 'Create account'
                }}<svg
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
            <p class="auth-switch">Already registered? <a routerLink="/login">Log in</a></p>
          </section>
        </main>
      </div>
    </ion-content>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly pending = inject(PendingSignIn);

  readonly minLength = MIN_PASSWORD_LENGTH;
  readonly busy = signal(false);
  readonly submitted = signal(false);
  readonly showPassword = signal(false);
  readonly error = signal<string | null>(null);
  readonly emailTaken = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [notBlank(), Validators.maxLength(80)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH), Validators.maxLength(128)],
    }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  constructor() {
    this.form.controls.email.valueChanges.subscribe(() => this.emailTaken.set(false));
  }

  shows(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  submit() {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid || this.busy()) return;
    const { name, email, password } = this.form.getRawValue();
    this.busy.set(true);
    this.auth.register({ name: name.trim(), email: email.trim(), password, termsAccepted: true }).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.pending.remember(res.email, password);
        void this.router.navigate(['/check-email'], {
          queryParams: { for: 'verify', email: res.email },
          replaceUrl: true,
        });
      },
      error: (err) => {
        this.busy.set(false);
        const reply = apiError(err);
        if (reply?.code === 'EMAIL_TAKEN') this.emailTaken.set(true);
        else if (reply?.status === 400 && reply.message) this.error.set(reply.message);
        else this.error.set('Your account couldn’t be created. Check your connection and try again.');
      },
    });
  }
}
