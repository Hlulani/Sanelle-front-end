import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

/** The welcome screen from the actual Figma Make prototype (project.zip). */
@Component({
  selector: 'app-welcome',
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
          <section class="auth-card welcome-auth">
            <p class="eyebrow">Welcome to Sanelle</p>
            <h1>Your health information,<br />finally in one place.</h1>
            <p>
              Understand what was recorded, make food decisions with less fear, notice symptom patterns, and prepare for
              appointments.
            </p>
            <a class="auth-primary" routerLink="/register"
              >Create my account
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
            </a>
            <a class="auth-secondary" routerLink="/login">I already have an account</a>
            <div class="auth-trust">
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
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 8h.01" />
              </svg>
              <span>Sanelle supports understanding and organisation. It does not replace medical advice.</span>
            </div>
          </section>
        </main>
      </div>
    </ion-content>
  `,
})
export class WelcomePage {}
