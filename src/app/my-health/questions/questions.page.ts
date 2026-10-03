import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { AppointmentQuestion, FINDINGS, FINDING_KEYS, findingOrUnknown } from '../diagnosis.model';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [FormsModule, IonContent],
  templateUrl: './questions.page.html',
  styleUrls: ['./questions.page.scss'],
})
export class QuestionsPage {
  private repo = inject(HealthRepository);
  private router = inject(Router);

  readonly questions = this.repo.questions;
  readonly editing = signal<string | null>(null);
  readonly answering = signal<string | null>(null);
  draft = '';
  newQuestion = '';

  /** Questions for details that aren't recorded and aren't already on the list. */
  readonly suggestions = computed(() => {
    const record = this.repo.record();
    const have = new Set(record.questions.map((q) => q.text.toLowerCase()));
    return FINDING_KEYS.filter((k) => findingOrUnknown(record, k).completeness.state === 'unknown')
      .map((k) => ({ key: k, text: FINDINGS[k].questionIfUnknown }))
      .filter((s) => !have.has(s.text.toLowerCase()));
  });

  ionViewWillEnter() {
    void this.repo.load();
  }

  back() {
    this.router.navigateByUrl('/tabs/health');
  }

  addSuggestion(s: { key: (typeof FINDING_KEYS)[number]; text: string }) {
    void this.repo.addQuestion(s.text, s.key);
  }

  addOwn() {
    const text = this.newQuestion.trim();
    if (!text) return;
    void this.repo.addQuestion(text);
    this.newQuestion = '';
  }

  move(q: AppointmentQuestion, delta: -1 | 1) {
    void this.repo.moveQuestion(q.id, delta);
  }

  startEdit(q: AppointmentQuestion) {
    this.answering.set(null);
    this.editing.set(q.id);
    this.draft = q.text;
  }

  saveEdit(q: AppointmentQuestion) {
    const text = this.draft.trim();
    if (text) void this.repo.updateQuestion(q.id, { text });
    this.editing.set(null);
  }

  startAnswer(q: AppointmentQuestion) {
    this.editing.set(null);
    this.answering.set(q.id);
    this.draft = q.answer ?? '';
  }

  saveAnswer(q: AppointmentQuestion) {
    void this.repo.updateQuestion(q.id, { answer: this.draft.trim() || undefined });
    this.answering.set(null);
  }

  remove(q: AppointmentQuestion) {
    void this.repo.removeQuestion(q.id);
  }
}
