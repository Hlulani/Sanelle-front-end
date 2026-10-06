import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-welcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent],
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage {
  private router = inject(Router);
  private auth = inject(AuthService);

  /** Someone already signed in skips Welcome; the guard sends them on to onboarding if it isn't done. */
  async ionViewWillEnter() {
    if (await this.auth.restoreSession()) this.router.navigateByUrl('/tabs/today', { replaceUrl: true });
  }

  start() {
    this.router.navigate(['/auth'], { queryParams: { mode: 'register' } });
  }

  signIn() {
    this.router.navigate(['/auth'], { queryParams: { mode: 'login' } });
  }
}
