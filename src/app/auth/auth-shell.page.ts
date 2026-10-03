import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/angular/standalone';

import { RegisterFormComponent } from './components/register/register-form.component';
import { LoginFormComponent } from './components/login/login-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    RegisterFormComponent,
    LoginFormComponent,
  ],
  templateUrl: './auth-shell.page.html',
  styleUrls: ['./auth-shell.page.scss'],
})
export class AuthShellPage {
  private router = inject(Router);
  private auth = inject(AuthService);

  private route = inject(ActivatedRoute);

  mode = signal<'register' | 'login'>(
    this.route.snapshot.queryParamMap.get('mode') === 'login' ? 'login' : 'register'
  );

  constructor() {
    effect(() => {
      if (this.auth.hasValidToken() && !environment.forceAuthOnStart) {
        this.router.navigateByUrl('/tabs/today');
      }
    });
  }

  setMode(value: string | null | undefined) {
    if (value === 'register' || value === 'login') this.mode.set(value);
  }
}
