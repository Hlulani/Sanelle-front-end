import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonSpinner,
  IonToggle,
  AlertController,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { NotificationService } from '../core/services/notification.service';

import { HealthRepository } from '../my-health/health-repository';
import { FoodRestrictionsService } from '../core/services/food-restrictions.service';
import {
  FocusPreferencesService,
  HELP_FOCUSES,
  HELP_FOCUS_CHOICES,
  HelpFocus,
} from '../core/services/focus-preferences.service';

@Component({
  selector: 'app-account',
  standalone: true,
  templateUrl: 'account.page.html',
  styleUrls: ['account.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonSpinner,
    IonToggle,
  ],
})
export class AccountPage implements OnInit {
  private health = inject(HealthRepository);
  private food = inject(FoodRestrictionsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private notifications = inject(NotificationService);
  private focusPreferences = inject(FocusPreferencesService);

  readonly helpChoices = HELP_FOCUSES.map((value) => ({ value, label: HELP_FOCUS_CHOICES[value].label }));
  readonly focus = this.focusPreferences.focus;

  isDeleting = signal(false);
  error = signal<string | null>(null);
  notificationsEnabled = signal(false);
  notificationError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    void this.focusPreferences.loadFocus();
    this.notificationsEnabled.set(await this.notifications.isEnabled());
  }

  /** Changes what Today shows first. */
  toggleFocus(value: HelpFocus): void {
    const current = this.focus();
    void this.focusPreferences.saveFocus(current.includes(value) ? current.filter((f) => f !== value) : [...current, value]);
  }

  async toggleNotifications(enabled: boolean): Promise<void> {
    this.notificationError.set(null);

    if (enabled) {
      const granted = await this.notifications.enable();
      this.notificationsEnabled.set(granted);
      if (!granted) {
        this.notificationError.set('Notifications are blocked in your device settings. Enable them there to turn this on.');
      }
      return;
    }

    await this.notifications.disable();
    this.notificationsEnabled.set(false);
  }

  username(): string {
    return this.auth.getUsername() ?? 'there';
  }

  email(): string | null {
    return this.auth.getUserEmail();
  }

  initial(): string {
    return this.username().charAt(0).toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/auth?mode=login');
  }

  async confirmDeleteAccount(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete account?',
      message: 'This permanently deletes your account. This can\'t be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.deleteAccount(),
        },
      ],
    });
    await alert.present();
  }

  private deleteAccount(): void {
    this.isDeleting.set(true);
    this.error.set(null);
    // Captured first: deleting the account signs out, which forgets the email.
    const email = this.auth.getUserEmail();

    this.auth.deleteAccount().subscribe({
      next: () => {
        if (email) {
          void this.health.clearFor(email);
          void this.food.clearFor(email);
        }
        this.isDeleting.set(false);
        this.router.navigateByUrl('/auth');
      },
      error: () => {
        this.isDeleting.set(false);
        this.error.set('Could not delete your account. Please try again.');
      },
    });
  }
}
