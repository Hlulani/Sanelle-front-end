import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [IonContent],
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage {
  private router = inject(Router);
  private auth = inject(AuthService);

  ionViewWillEnter() {
    if (this.auth.hasValidToken() && !environment.forceAuthOnStart) {
      this.router.navigateByUrl('/tabs/today', { replaceUrl: true });
    }
  }

  start() {
    this.router.navigate(['/auth'], { queryParams: { mode: 'register' } });
  }

  signIn() {
    this.router.navigate(['/auth'], { queryParams: { mode: 'login' } });
  }
}
