import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../my-health/health-repository';
import { CareReminders } from '../my-health/care-reminders.service';
import { isIsoDate, localIsoDate } from '../shared/calendar-date';
import { messageFor } from '../core/errors/errors';

/**
 * APT-03: the next step and review date she agreed, and what happens to an unresolved question.
 * These are her notes of an agreement, never a Sanelle instruction or interpretation.
 */
@Component({
  selector: 'app-next-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FigmaFrameComponent, IonContent, FormsModule, RouterLink],
  template: `
    <ion-content>
      <app-figma-frame active="visit" title="Was a next step agreed?" label="Appointment"
        ><div class="visit-paper source-extension">
          <div class="section-title"><a class="text-action" routerLink="/tabs/appointment">Appointment</a></div>
          <header class="section-title source-extension-heading">
            <p class="eyebrow">
              {{
                outcome === 'answered'
                  ? 'Answer saved'
                  : outcome === 'unresolved'
                    ? 'Marked unresolved'
                    : 'After your visit'
              }}
            </p>
            <h1>Was a next step agreed?</h1>
            <p class="source-extension-intro">Note it in your words, with a date to review it if one was given.</p>
          </header>

          @if (question(); as q) {
            @if (outcome === 'unresolved') {
              <section class="unknown-note" aria-labelledby="carry-title">
                <h2 id="carry-title">“{{ q.text }}”</h2>
                <label class="research-checkbox">
                  <input type="checkbox" name="carry" [(ngModel)]="carry" />
                  <span>Carry it forward to my next visit</span>
                </label>
                <p class="fine-print">Its history stays with it, so you can see it was asked before.</p>
              </section>
            }
          }

          <div class="answer-form" style="margin-top: 20px">
            <label class="source-field answer-form">
              <span>Next step <em class="optional">(optional)</em></span>
              <textarea
                name="step"
                [(ngModel)]="step"
                rows="3"
                placeholder="e.g. Blood test in 6 weeks, then a follow-up scan"
              ></textarea>
            </label>
            <label class="source-field answer-form">
              <span>Review date <em class="optional">(optional)</em></span>
              <input type="date" name="reviewDate" [min]="today" [(ngModel)]="reviewDate" />
            </label>
            @if (reminders.available) {
              <label class="research-checkbox">
                <input type="checkbox" name="remind" [(ngModel)]="remind" />
                <span>Remind me on the review date</span>
              </label>
            }
            @if (error()) {
              <p class="form-error" role="alert">{{ error() }}</p>
            }
            <button type="button" class="primary" [disabled]="saving()" (click)="save()">Save</button>
            <button type="button" class="primary secondary" [disabled]="saving()" (click)="nothingAgreed()">
              Nothing was agreed
            </button>
          </div>
          <p class="fine-print" style="margin-top: 16px">Your agreements, not Sanelle instructions.</p>
        </div></app-figma-frame
      >
    </ion-content>
  `,
})
export class NextStepPage implements OnInit {
  private readonly repo = inject(HealthRepository);
  private readonly router = inject(Router);
  readonly reminders = inject(CareReminders);
  private readonly params = inject(ActivatedRoute).snapshot.queryParamMap;

  readonly today = localIsoDate();
  readonly outcome = this.params.get('outcome');
  private readonly questionId = this.params.get('question');
  private readonly visit = this.params.get('visit');
  readonly question = computed(() => this.repo.record().questions.find((q) => q.id === this.questionId) ?? null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  step = '';
  reviewDate = '';
  remind = false;
  carry = true;

  ngOnInit() {
    void this.repo.load();
  }

  /** Still applies the carry-forward choice for an unresolved question. */
  nothingAgreed() {
    this.step = '';
    this.reviewDate = '';
    void this.save();
  }

  async save() {
    this.error.set(null);
    if (this.reviewDate && (!isIsoDate(this.reviewDate) || this.reviewDate < this.today)) {
      this.error.set('Choose today or a later review date, or leave it blank.');
      return;
    }
    if (this.reviewDate && !this.step.trim()) {
      this.error.set('Add the next step that the review date is for.');
      return;
    }
    this.saving.set(true);
    try {
      if (this.outcome === 'unresolved' && this.carry && this.questionId) await this.repo.carryForward(this.questionId);
      if (this.step.trim()) {
        if (this.remind && this.reviewDate) await this.reminders.enable();
        await this.repo.saveTask({
          title: this.step,
          dueDate: this.reviewDate || undefined,
          visitDate: this.visit ?? undefined,
          reminderAt: this.remind && this.reviewDate ? `${this.reviewDate}T09:00:00` : undefined,
        });
      }
      void this.router.navigateByUrl('/tabs/today', { replaceUrl: true });
    } catch (e) {
      this.error.set(messageFor(e, 'This couldn’t be saved. Please try again.'));
    } finally {
      this.saving.set(false);
    }
  }
}
