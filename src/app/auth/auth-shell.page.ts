import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonButton
} from '@ionic/angular/standalone';

import { RegisterFormComponent } from './components/register/register-form.component';
import { LoginFormComponent } from './components/login/login-form.component';
import { Router } from '@angular/router';
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
    IonIcon,
    IonButton,
    RegisterFormComponent,
    LoginFormComponent,
  ],
  templateUrl: './auth-shell.page.html',
  styleUrls: ['./auth-shell.page.scss'],
})
export class AuthShellPage {
  private router = inject(Router);
  private auth = inject(AuthService);

  mode = signal<'register' | 'login'>('register');

  constructor() {
    effect(() => {
      if (this.auth.hasValidToken() && !environment.forceAuthOnStart) {
        this.router.navigateByUrl('/tabs/tab2');
      }
    });
  }

  setMode(value: string | null | undefined) {
    if (value === 'register' || value === 'login') this.mode.set(value);
  }
}
