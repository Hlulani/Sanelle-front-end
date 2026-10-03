import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { AppointmentQuestion, FINDINGS, FINDING_KEYS, findingOrUnknown } from '../diagnosis.model';

export const STARTER_QUESTIONS = [
  'What do the words in my report mean?',
  'Which symptoms should I keep track of?',
  'What are my treatment options, including waiting and watching?',
  'Could my fibroids affect getting pregnant, now or later?',
];

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [FormsModule, IonContent, RouterLink],
  templateUrl: './questions.page.html',
  styleUrls: ['./questions.page.scss'],
})
export class QuestionsPage {
  private repo = inject(HealthRepository);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly questions = this.repo.questions;
  readonly editing = signal<string | null>(null);
  readonly answering = signal<string | null>(null);
  readonly fromCheckin = signal(false);
  readonly added = signal<string | null>(null);
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

  /**
   * Questions anyone can bring, whatever is or isn't recorded: the words in the report, symptoms,
   * treatment options and fertility. Questions only; Sanelle doesn't answer them.
   */
  readonly starters = computed(() => {
    const have = new Set(this.repo.record().questions.map((q) => q.text.toLowerCase()));
    return STARTER_QUESTIONS.filter((text) => !have.has(text.toLowerCase()));
  });

  readonly backLabel = computed(() => (this.from() === 'today' ? 'Today' : 'My health'));
  private readonly from = signal<'today' | 'health'>('health');

  ionViewWillEnter() {
    this.from.set(this.route.snapshot.queryParamMap.get('from') === 'today' ? 'today' : 'health');
    // A question drafted from a check-in arrives here to be edited, not saved for her.
    const draft = this.route.snapshot.queryParamMap.get('draft');
    if (draft) {
      this.newQuestion = draft;
      this.fromCheckin.set(true);
    }
    void this.repo.load();
  }

  back() {
    this.router.navigateByUrl(this.from() === 'today' ? '/tabs/today' : '/tabs/health');
  }

  addStarter(text: string) {
    void this.repo.addQuestion(text);
  }

  addSuggestion(s: { key: (typeof FINDING_KEYS)[number]; text: string }) {
    void this.repo.addQuestion(s.text, s.key);
  }

  addOwn() {
    const text = this.newQuestion.trim();
    if (!text) return;
    void this.repo.addQuestion(text);
    this.newQuestion = '';
    this.added.set(text);
    this.fromCheckin.set(false);
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
