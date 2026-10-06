import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { AppointmentQuestion, FINDINGS, FINDING_KEYS, findingOrUnknown, unansweredQuestions } from '../diagnosis.model';

export const STARTER_QUESTIONS = [
  'What do the words in my report mean?',
  'Which symptoms should I keep track of?',
  'What are my treatment options, including waiting and watching?',
  'Could my fibroids affect getting pregnant, now or later?',
];

@Component({
  selector: 'app-questions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, IonContent, RouterLink],
  templateUrl: './questions.page.html',
  styleUrls: ['./questions.page.scss'],
})
export class QuestionsPage implements OnInit {
  private repo = inject(HealthRepository);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  readonly questions = this.repo.questions;
  readonly pendingCount = computed(() => unansweredQuestions(this.repo.record()).length);
  readonly answeredCount = computed(() => this.questions().length - this.pendingCount());
  readonly error = signal<string | null>(null);
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

  readonly backLabel = computed(() => ({ today: 'Today', health: 'My health', history: 'Symptoms' })[this.from()]);
  private readonly from = signal<'today' | 'health' | 'history'>('health');

  ngOnInit() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => this.prepareDraft(params));
  }

  ionViewWillEnter() {
    void this.repo.load();
  }

  private prepareDraft(params: ParamMap) {
    const from = params.get('from');
    this.from.set(from === 'today' || from === 'history' ? from : 'health');
    // A question drafted from a check-in arrives here to be edited, not saved for her.
    const draft = params.get('draft');
    if (draft) {
      this.newQuestion = draft;
      this.fromCheckin.set(true);
    }
  }

  back() {
    this.router.navigateByUrl(
      { today: '/tabs/today', health: '/tabs/health', history: '/health/symptoms' }[this.from()],
    );
  }

  async addStarter(text: string) {
    if (await this.saveChange(() => this.repo.addQuestion(text))) this.added.set(text);
  }

  async addSuggestion(s: { key: (typeof FINDING_KEYS)[number]; text: string }) {
    if (await this.saveChange(() => this.repo.addQuestion(s.text, s.key))) this.added.set(s.text);
  }

  async addOwn() {
    const text = this.newQuestion.trim();
    if (!text) return;
    if (!(await this.saveChange(() => this.repo.addQuestion(text)))) return;
    this.newQuestion = '';
    this.added.set(text);
    this.fromCheckin.set(false);
  }

  move(q: AppointmentQuestion, delta: -1 | 1) {
    void this.saveChange(() => this.repo.moveQuestion(q.id, delta));
  }

  startEdit(q: AppointmentQuestion) {
    this.answering.set(null);
    this.editing.set(q.id);
    this.draft = q.text;
  }

  async saveEdit(q: AppointmentQuestion) {
    const text = this.draft.trim();
    if (!text || !(await this.saveChange(() => this.repo.updateQuestion(q.id, { text })))) return;
    this.editing.set(null);
  }

  startAnswer(q: AppointmentQuestion) {
    this.editing.set(null);
    this.answering.set(q.id);
    this.draft = q.answer ?? '';
  }

  async saveAnswer(q: AppointmentQuestion) {
    if (!(await this.saveChange(() => this.repo.updateQuestion(q.id, { answer: this.draft.trim() || undefined }))))
      return;
    this.answering.set(null);
  }

  async saveChange(change: () => Promise<void>): Promise<boolean> {
    this.error.set(null);
    try {
      await change();
      return true;
    } catch {
      this.error.set('Could not save your changes. Please try again.');
      return false;
    }
  }

  remove(q: AppointmentQuestion) {
    void this.saveChange(() => this.repo.removeQuestion(q.id));
  }
}
