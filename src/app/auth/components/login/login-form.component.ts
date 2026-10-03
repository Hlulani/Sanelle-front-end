import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
    IonIcon,
  ],
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  mode = 'login';

  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    this.error.set(null);
    this.loading.set(true);

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/tabs/tab2');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Login failed. Please check your details.');
      },
    });
  }
}
