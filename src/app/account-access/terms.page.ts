import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Location } from '@angular/common';
import { inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

/** The terms and privacy notice, in plain words. */
@Component({
  selector: 'app-terms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent],
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
            <div class="auth-back"><button class="auth-back" type="button" (click)="back()">Back</button></div>
            <header>
              <h1>Terms and privacy</h1>
              <p>The short version of how Sanelle works.</p>
            </header>
            <div class="auth-trust">
              <h2>Not medical advice</h2>
              <p>
                Sanelle helps you keep your own records and prepare questions. It doesn’t diagnose, interpret results or
                recommend treatment. Talk to a clinician about decisions for your health.
              </p>
            </div>
            <section class="auth-trust">
              <h2>Your health records stay on this phone</h2>
              <p>
                Reports, check-ins, questions and results are encrypted and kept on this device, separately for each
                account. They aren’t sent to Sanelle’s server. A backup is a file you choose to make and keep.
              </p>
            </section>
            <section class="auth-trust">
              <h2>What the server keeps</h2>
              <p>
                Your name, email address, a hashed password and when you accepted these terms. Meal requests send the
                allergies and foods you exclude, so the server can leave out meals that don’t fit. They aren’t stored.
              </p>
            </section>
            <section class="auth-trust">
              <h2>Research is separate</h2>
              <p>Using Sanelle doesn’t enrol you in research. Any study would ask for its own consent first.</p>
            </section>
            <section class="auth-trust">
              <h2>Deleting your account</h2>
              <p>You can delete your account in Account. It removes the account and this phone’s records for it.</p>
            </section>
          </section>
        </main>
      </div>
    </ion-content>
  `,
})
export class TermsPage {
  private readonly location = inject(Location);

  back() {
    this.location.back();
  }
}
