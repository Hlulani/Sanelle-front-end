import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../my-health/health-repository';
import { AppointmentQuestion, CareTask, QuestionEvent, questionStatus } from '../my-health/diagnosis.model';
import { buildSummary, formatDate, summaryAsText } from '../my-health/summary';
import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { FigmaIconComponent } from '../shared/design/figma/figma-icon.component';
import { PatientDesignState } from '../shared/design/figma/patient-design-state.service';
import { PHOTOS } from '../shared/photos';
import { isIsoDate, localIsoDate } from '../shared/calendar-date';
import { messageFor } from '../core/errors/errors';
import { QuestionHistoryComponent } from './question-history.component';

/**
 * APT-01: an editable summary for the next visit, built only from what she entered or confirmed.
 * Questions can be answered, marked unresolved or carried forward, keeping their history.
 */
@Component({
  selector: 'app-appointment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, FormsModule, FigmaFrameComponent, FigmaIconComponent, QuestionHistoryComponent],
  templateUrl: './appointment.page.html',
})
export class AppointmentPage {
  readonly design = inject(PatientDesignState);
  readonly notesImage = 'assets/photos/figma-notes.jpg';
  answeringId: string | null = null;
  answer = '';
  nextStep = '';
  reviewDate = '';
  readonly questionsView = computed(() =>
    this.record().questions.map((q) => {
      const task = (this.record().tasks ?? []).filter((t) => t.questionId === q.id).at(-1);
      const status = questionStatus(q);
      return {
        ...q,
        answer: status === 'answered' ? q.answer : undefined,
        source: q.sourceLabel ?? 'Added by you',
        status: status.charAt(0).toUpperCase() + status.slice(1),
        nextStep: task?.title,
        reviewDate: task?.dueDate,
      };
    }),
  );
  get profileView() {
    return { name: this.design.name(), fibroidCount: this.design.count(), largestSize: this.design.size() };
  }
  get latestCheckIn() {
    return this.design.latestView();
  }
  get clinicalResult() {
    const r = this.record().results?.[0];
    return r ? { ...r, date: r.testDate } : null;
  }
  setAnsweringId(id: string) {
    const q = this.record().questions.find((q) => q.id === id);
    this.answer = q?.answer ?? '';
    this.nextStep = '';
    this.reviewDate = '';
    this.answeringId = id;
  }
  async saveOutcome(status: 'Answered' | 'Unresolved') {
    if (!this.answeringId) return;
    if (this.reviewDate && (!isIsoDate(this.reviewDate) || this.reviewDate < this.today)) {
      this.error.set('Choose today or a later review date, or leave it blank.');
      return;
    }
    if (this.reviewDate && !this.nextStep.trim()) {
      this.error.set('Add the next step that the review date is for.');
      return;
    }
    await this.run(async () => {
      const id = this.answeringId!;
      await this.repo.saveQuestionOutcome(
        id,
        status === 'Answered' ? 'answered' : 'unresolved',
        this.answer,
        this.today,
        this.nextStep.trim() ? { title: this.nextStep, dueDate: this.reviewDate || undefined } : undefined,
      );
      this.answeringId = null;
      this.answer = '';
      this.nextStep = '';
      this.reviewDate = '';
    });
  }
  carryQuestion(id: string) {
    const q = this.record().questions.find((q) => q.id === id);
    if (q) this.carryForward(q);
  }
  removeQuestion(index: number) {
    const q = this.record().questions[index];
    if (q) this.remove(q);
  }
  private readonly repo = inject(HealthRepository);

  readonly photo = PHOTOS.notebook;
  readonly today = localIsoDate();
  readonly added = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map((p) => p.get('added') === '1')), {
    initialValue: false,
  });
  readonly record = this.repo.record;
  readonly summary = computed(() => buildSummary(this.record(), this.today));
  readonly open = computed(() => this.record().questions.filter((q) => questionStatus(q) === 'open'));
  readonly unresolved = computed(() => this.record().questions.filter((q) => questionStatus(q) === 'unresolved'));
  readonly answered = computed(() => this.record().questions.filter((q) => questionStatus(q) === 'answered'));
  readonly steps = computed(() =>
    [...(this.record().tasks ?? [])].sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')),
  );
  readonly appointmentPast = computed(
    () => !!this.record().appointment.date && this.record().appointment.date! < this.today,
  );

  readonly editingVisit = signal(false);
  readonly editingQuestion = signal<string | null>(null);
  readonly copied = signal(false);
  readonly error = signal<string | null>(null);
  newQuestion = '';
  draftText = '';
  visitDate = '';
  visitWith = '';
  concern = '';

  ionViewWillEnter() {
    void this.design.load();
  }

  formatDate = formatDate;

  editVisit() {
    const r = this.record();
    this.visitDate = r.appointment.date ?? '';
    this.visitWith = r.appointment.with ?? '';
    this.concern = r.visitGoal ?? '';
    this.editingVisit.set(true);
  }

  async saveVisit() {
    if (this.visitDate && !isIsoDate(this.visitDate)) {
      this.error.set('Choose a valid calendar date, or leave it blank.');
      return;
    }
    await this.run(async () => {
      await this.repo.setAppointment({ date: this.visitDate || undefined, with: this.visitWith.trim() || undefined });
      await this.repo.setVisitGoal(this.concern);
      this.editingVisit.set(false);
    });
  }

  async addQuestion() {
    const text = this.newQuestion.trim();
    if (!text) return;
    await this.run(async () => {
      await this.repo.addQuestion(text);
      this.newQuestion = '';
    });
  }

  startEdit(q: AppointmentQuestion) {
    this.draftText = q.text;
    this.editingQuestion.set(q.id);
  }

  async saveEdit(q: AppointmentQuestion) {
    const text = this.draftText.trim();
    if (!text) return;
    await this.run(async () => {
      await this.repo.updateQuestion(q.id, { text });
      this.editingQuestion.set(null);
    });
  }

  move(q: AppointmentQuestion, delta: -1 | 1) {
    void this.run(() => this.repo.moveQuestion(q.id, delta));
  }

  remove(q: AppointmentQuestion) {
    void this.run(() => this.repo.removeQuestion(q.id));
  }

  carryForward(q: AppointmentQuestion) {
    void this.run(() => this.repo.carryForward(q.id));
  }

  toggleStep(task: CareTask) {
    void this.run(() => this.repo.completeTask(task.id, !task.completedAt));
  }

  removeStep(task: CareTask) {
    void this.run(() => this.repo.removeTask(task.id));
  }

  lastEvent(q: AppointmentQuestion): QuestionEvent | undefined {
    const h = q.history ?? [];
    return h[h.length - 1];
  }

  async copy() {
    try {
      await navigator.clipboard.writeText(summaryAsText(this.summary()));
      this.copied.set(true);
    } catch {
      this.error.set('The summary couldn’t be copied. You can select the text on this page instead.');
    }
  }
  includeCheckins(include: boolean) {
    void this.run(() => this.repo.setSummaryIncludesCheckins(include));
  }

  private async run(change: () => Promise<void>) {
    this.error.set(null);
    try {
      await change();
    } catch (e) {
      this.error.set(messageFor(e, 'Your change couldn’t be saved. Please try again.'));
    }
  }
}
