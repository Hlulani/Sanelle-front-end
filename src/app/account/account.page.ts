import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { PRIORITIES, PRIORITY_CHOICES, Priority, ProfileService } from '../core/profile/profile.service';
import { HealthRepository } from '../my-health/health-repository';
import { FoodProfileService } from '../food/food-profile.service';
import { MealPlanStore } from '../food/meal-plan.store';
import { messageFor } from '../core/errors/errors';

@Component({
  selector: 'app-account',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FigmaFrameComponent, IonContent, RouterLink, FormsModule],
  template: `<ion-content
    ><app-figma-frame active="today" title="My account" label="Account"
      ><div class="visit-paper source-extension">
        <div class="section-title"><a class="text-action" routerLink="/tabs/today">Today</a></div>
        <header class="section-title source-extension-heading">
          <h1>My account</h1>
          <p class="source-extension-intro">Your setup, records and session.</p>
        </header>
        <section class="paper-section">
          <strong>{{ profile.name() || auth.getUsername() }}</strong>
          <label
            >Preferred name (optional)<input
              name="preferredName"
              [(ngModel)]="preferredName"
              [disabled]="!nameReady() || busy()"
              (ngModelChange)="nameSaved.set(false)"
              placeholder="Name or nickname"
              autocomplete="given-name"
          /></label>
          <button class="record-answer" [disabled]="!nameReady() || busy()" (click)="saveName()">Save name</button>
          @if (nameSaved()) {
            <p role="status">Name saved</p>
          }
          <p>{{ auth.getUserEmail() }}</p>
        </section>
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }
        <section class="paper-section">
          <h2>What I’d like help with</h2>
          <div class="chip-choices" role="group" aria-label="My priorities">
            @for (c of choices; track c.value) {
              <button
                type="button"
                class="source-choice"
                [attr.aria-pressed]="profile.profile().priorities.includes(c.value)"
                [class.selected]="profile.profile().priorities.includes(c.value)"
                [disabled]="busy()"
                (click)="toggle(c.value)"
              >
                {{ c.label }}
              </button>
            }
          </div>
          <p class="fine-print">These order your shortcuts. They don’t change medical advice.</p>
        </section>
        <section class="paper-section">
          <a class="text-action" routerLink="/onboarding" [queryParams]="{ step: 6 }">Review or edit my setup</a>
          <h2>Your records</h2>
          <p>
            Health records, food preferences and meal plans are saved on this device. Your account does not
            automatically back them up.
          </p>
          <a class="primary secondary" routerLink="/health/backup">Back up or restore health records</a
          ><a class="text-action" routerLink="/food/requirements">Edit my food requirements</a>
        </section>
        @if (auth.isEvidenceEditor()) {
          <section class="paper-section">
            <h2>Internal workspace</h2>
            <a class="primary secondary" routerLink="/internal/evidence">Open evidence catalog</a>
          </section>
        }
        <section class="paper-section">
          <h2>Session</h2>
          <button type="button" class="primary secondary" (click)="logout()">Log out</button
          ><a routerLink="/terms">Terms and privacy notice</a>
        </section>
        <section class="paper-section">
          <h2>Delete account</h2>
          <p>This deletes your account and its local records. Keep a backup first if you want a copy.</p>
          @if (confirming()) {
            <div class="unknown-note">
              <p><strong>This cannot be undone.</strong></p>
              <label class="research-checkbox"
                ><input type="checkbox" [(ngModel)]="acknowledged" /><span
                  >I understand my account and local records will be deleted.</span
                ></label
              ><button type="button" class="primary" [disabled]="busy() || !acknowledged" (click)="remove()">
                {{ busy() ? 'Deleting…' : 'Permanently delete account' }}</button
              ><button type="button" class="primary secondary" [disabled]="busy()" (click)="confirming.set(false)">
                Cancel
              </button>
            </div>
          } @else {
            <button type="button" class="primary secondary" (click)="confirming.set(true)">Delete account</button>
          }
        </section>
      </div></app-figma-frame
    ></ion-content
  >`,
})
export class AccountPage {
  readonly auth = inject(AuthService);
  readonly profile = inject(ProfileService);
  private readonly health = inject(HealthRepository);
  private readonly food = inject(FoodProfileService);
  private readonly plans = inject(MealPlanStore);
  private readonly router = inject(Router);
  readonly choices = PRIORITIES.map((value) => ({ value, label: PRIORITY_CHOICES[value].label }));
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly confirming = signal(false);
  acknowledged = false;
  private deletingEmail: string | null = null;
  private serverDeleted = false;
  readonly nameReady = signal(false);
  readonly nameSaved = signal(false);
  async ionViewWillEnter() {
    this.nameReady.set(false);
    try {
      await this.profile.load();
      this.preferredName = this.profile.profile().name || this.auth.getDisplayName() || '';
      this.nameReady.set(true);
    } catch (e) {
      this.error.set(messageFor(e, 'Your setup couldn’t be loaded.'));
    }
  }
  preferredName = '';
  async saveName() {
    if (this.busy() || !this.nameReady()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.profile.save({ name: this.preferredName });
      this.nameSaved.set(true);
    } catch (e) {
      this.error.set(messageFor(e, 'Your name couldn’t be saved.'));
    } finally {
      this.busy.set(false);
    }
  }
  async toggle(value: Priority) {
    this.error.set(null);
    try {
      const values = this.profile.profile().priorities;
      await this.profile.save({
        priorities: values.includes(value) ? values.filter((v) => v !== value) : [...values, value],
      });
    } catch (e) {
      this.error.set(messageFor(e, 'Your priorities couldn’t be saved.'));
    }
  }
  logout() {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
  async remove() {
    if (!this.acknowledged || this.busy()) return;
    const email = this.deletingEmail ?? this.auth.getUserEmail();
    if (!email) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      if (!this.serverDeleted) {
        await firstValueFrom(this.auth.deleteAccount());
        this.serverDeleted = true;
        this.deletingEmail = email;
      }
      await Promise.all([
        this.health.clearFor(email),
        this.food.clearFor(email),
        this.plans.clearFor(email),
        this.profile.clearFor(email),
      ]);
      await this.router.navigateByUrl('/welcome');
    } catch (e) {
      this.error.set(
        this.serverDeleted
          ? 'Your account was deleted, but clearing this device’s records could not finish. Press the delete button again to retry local cleanup.'
          : messageFor(e, 'Account deletion couldn’t finish. Please try again.'),
      );
    } finally {
      this.busy.set(false);
    }
  }
}
