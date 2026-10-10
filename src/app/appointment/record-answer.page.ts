import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../my-health/health-repository';
import { isIsoDate, localIsoDate } from '../shared/calendar-date';
import { messageFor } from '../core/errors/errors';

/** APT-02: what the clinician said, in her own words, or "unresolved" when it wasn't answered. */
@Component({
  selector: 'app-record-answer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FigmaFrameComponent, IonContent, FormsModule, RouterLink],
  template: `
    <ion-content>
      <app-figma-frame active="visit" title="Record an answer" label="Appointment"
        ><div class="visit-paper source-extension">
          <div class="section-title"><a class="text-action" routerLink="/tabs/appointment">Cancel</a></div>
          @if (question(); as q) {
            <header class="section-title source-extension-heading">
              <p class="eyebrow">After your visit</p>
              <h2>{{ q.text }}</h2>
              <p class="source-extension-intro">
                Write what you were told, in your own words. Sanelle keeps it exactly as you write it.
              </p>
            </header>
            <div class="answer-form">
              <label class="source-field answer-form">
                <span>Visit date</span>
                <input type="date" name="visitDate" [max]="today" [(ngModel)]="visitDate" />
              </label>
              <label class="source-field answer-form">
                <span>The answer</span>
                <textarea name="answer" [(ngModel)]="answer" rows="5" placeholder="What did they say?"></textarea>
              </label>
              @if (error()) {
                <p class="form-error" role="alert">{{ error() }}</p>
              }
              <button type="button" class="primary" [disabled]="saving()" (click)="saveAnswer()">Save answer</button>
            </div>

            <section class="paper-section">
              <h2>Not answered?</h2>
              <p class="fine-print">Mark it unresolved. It’s kept apart from questions you haven’t asked yet.</p>
              <label class="source-field answer-form">
                <span>Note <em class="optional">(optional)</em></span>
                <input name="note" [(ngModel)]="note" placeholder="e.g. Ran out of time; asked to book a follow-up" />
              </label>
              <button type="button" class="primary secondary" [disabled]="saving()" (click)="markUnresolved()">
                Mark unresolved
              </button>
            </section>
          } @else {
            <header class="section-title source-extension-heading"><h1>Question not found</h1></header>
            <a class="primary" routerLink="/tabs/appointment">Back to Appointment</a>
          }
        </div></app-figma-frame
      >
    </ion-content>
  `,
})
export class RecordAnswerPage implements OnInit {
  private readonly repo = inject(HealthRepository);
  private readonly router = inject(Router);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  readonly today = localIsoDate();
  readonly question = computed(() => this.repo.record().questions.find((q) => q.id === this.id) ?? null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  answer = '';
  note = '';
  visitDate = this.today;

  async ngOnInit() {
    await this.repo.load();
    const date = this.repo.record().appointment.date;
    if (date && date <= this.today) this.visitDate = date;
    this.answer = this.question()?.answer ?? '';
  }

  saveAnswer() {
    void this.run(() => this.repo.answerQuestion(this.id, this.answer, this.date()), 'answered');
  }

  markUnresolved() {
    void this.run(() => this.repo.markUnresolved(this.id, this.note, this.date()), 'unresolved');
  }

  private date(): string | undefined {
    return isIsoDate(this.visitDate) && this.visitDate <= this.today ? this.visitDate : undefined;
  }

  private async run(change: () => Promise<void>, outcome: 'answered' | 'unresolved') {
    this.error.set(null);
    if (!isIsoDate(this.visitDate) || this.visitDate > this.today) {
      this.error.set('Choose today or an earlier visit date.');
      return;
    }
    this.saving.set(true);
    try {
      await change();
      void this.router.navigate(['/appointment/next-step'], {
        queryParams: { question: this.id, outcome, visit: this.date() ?? null },
        replaceUrl: true,
      });
    } catch (e) {
      this.error.set(messageFor(e, 'This couldn’t be saved. Please try again.'));
    } finally {
      this.saving.set(false);
    }
  }
}
