import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth/auth.service';
import { apiError } from '../core/errors/errors';
import { PendingSignIn } from './pending-sign-in.service';

/** Where the verification email's link lands: confirms the address and signs in. */
@Component({
  selector: 'app-verify-email',
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
            @if (problem(); as p) {
              <header class="auth-introduction">
                <h1>This link didn’t work</h1>
                <p class="auth-description">{{ p }}</p>
              </header>
              <a class="auth-primary" routerLink="/login">Go to log in</a>
              <p class="auth-description" style="margin-top: 12px">
                Log in with your email and password, and Sanelle will offer to send a new link.
              </p>
            } @else {
              <header class="auth-introduction">
                <h1>Confirming your email…</h1>
                <p class="auth-description" role="status">This only takes a moment.</p>
              </header>
            }
          </section>
        </main>
      </div>
    </ion-content>
  `,
})
export class VerifyEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly pending = inject(PendingSignIn);

  readonly problem = signal<string | null>(null);

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.problem.set('The link is incomplete. Open it straight from the email.');
      return;
    }
    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.pending.clear();
        void this.router.navigateByUrl(this.auth.hasCompletedOnboarding() ? '/tabs/today' : '/onboarding', {
          replaceUrl: true,
        });
      },
      error: (err) => {
        const code = apiError(err)?.code;
        this.problem.set(
          code === 'TOKEN_EXPIRED'
            ? 'It has expired. Links work for 24 hours.'
            : code === 'TOKEN_INVALID'
              ? 'It has already been used, or a newer link replaced it.'
              : 'Sanelle couldn’t reach the server. Check your connection and open the link again.',
        );
      },
    });
  }
}
