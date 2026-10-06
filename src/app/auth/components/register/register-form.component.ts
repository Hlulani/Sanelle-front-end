import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonItem, IonInput, IonButton, IonText, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, IonItem, IonInput, IonButton, IonText, IonIcon, IonSpinner],
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.scss'],
})
export class RegisterFormComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  private static readonly USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

  email = '';
  username = '';
  password = '';
  confirmPassword = '';
  mode = 'register';

  isLoading = signal(false);
  error = signal<string | null>(null);
  emailError = signal<string | null>(null);
  usernameError = signal<string | null>(null);
  isPasswordVisible = signal(false);

  submit() {
    this.error.set(null);
    this.emailError.set(null);
    this.usernameError.set(null);

    if (!this.email || !this.username || !this.password || !this.confirmPassword) {
      this.error.set('Please fill in all fields');
      return;
    }

    if (!RegisterFormComponent.USERNAME_PATTERN.test(this.username)) {
      this.usernameError.set('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);

    this.auth
      .register(this.email, this.username, this.password)
      .pipe(switchMap(() => this.auth.login(this.email, this.password)))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          // Replace the form in history, so going back can't land on it while signed in.
          this.router.navigateByUrl('/onboarding', { replaceUrl: true });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.applyServerError(err);
        },
      });
  }

  private applyServerError(err: { status?: number; error?: { message?: string } }): void {
    const message = err?.error?.message || 'Registration failed';

    if (err?.status === 409 && /email/i.test(message)) {
      this.emailError.set(message);
      return;
    }

    if (err?.status === 409 && /username/i.test(message)) {
      this.usernameError.set(message);
      return;
    }

    if (err?.status === 400 && /username/i.test(message)) {
      this.usernameError.set(message);
      return;
    }

    this.error.set(message);
  }

  togglePasswordVisibility() {
    this.isPasswordVisible.set(!this.isPasswordVisible());
  }

  passwordStrengthScore(): number {
    const p = this.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }

  passwordStrengthLabel(): string {
    const score = this.passwordStrengthScore();
    if (score <= 1) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score === 4) return 'Good';
    return 'Strong';
  }
}
