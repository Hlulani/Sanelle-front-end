import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import {
  ENTERABLE_SOURCES,
  FINDINGS,
  FINDING_KEYS,
  FindingKey,
  FindingSource,
  findingOrUnknown,
} from '../diagnosis.model';
import { isBareMeasurement } from './record-input';

type Answer = 'present' | 'absent' | 'unknown';

const SOURCE_CHOICES: Record<string, string> = {
  'entered-from-report': 'My report',
  'told-by-clinician': 'An appointment',
  'self-reported': 'My own note',
};

@Component({
  selector: 'app-record',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, IonContent, RouterLink],
  templateUrl: './record.page.html',
  styleUrls: ['./record.page.scss'],
})
export class RecordPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private repo = inject(HealthRepository);
  private destroyRef = inject(DestroyRef);
  private generation = 0;

  readonly sources = ENTERABLE_SOURCES;
  readonly sourceChoices = SOURCE_CHOICES;

  readonly key = signal<FindingKey>('count');
  readonly def = computed(() => FINDINGS[this.key()]);
  readonly step = computed(() => FINDING_KEYS.indexOf(this.key()) + 1);
  readonly total = FINDING_KEYS.length;

  /** Walking through every finding (from "Start with what you know") or editing one. */
  inFlow = false;
  /** Where "Finish later" and the end of the flow return to. */
  private from: 'today' | 'health' | 'summary' = 'health';
  readonly fromSummary = signal(false);

  readonly answer = signal<Answer | null>(null);
  value = '';
  source: FindingSource = 'entered-from-report';
  wording = '';
  reportDate = '';
  unit: 'cm' | 'mm' | null = null;
  private flowSource: FindingSource = 'entered-from-report';
  private flowDate = '';
  readonly needsUnit = () => this.key() === 'largestSize' && isBareMeasurement(this.value);
  readonly ready = signal(false);
  readonly saving = signal(false);
  readonly addQuestion = signal(true);
  readonly showWhy = signal(false);
  readonly error = signal<string | null>(null);

  async ngOnInit() {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async ([params, query]) => {
      const generation = ++this.generation;
      this.ready.set(false);
      const k = params.get('key') as FindingKey;
      this.key.set(FINDING_KEYS.includes(k) ? k : 'count');
      this.inFlow = query.get('flow') === '1';
      const from = query.get('from');
      this.from = from === 'today' || from === 'summary' ? from : 'health';
      this.fromSummary.set(this.from === 'summary');
      const context = this.router.getCurrentNavigation()?.extras.state;
      if (this.inFlow && context) {
        if (ENTERABLE_SOURCES.includes(context['recordSource'])) this.flowSource = context['recordSource'];
        this.flowDate = typeof context['reportDate'] === 'string' ? context['reportDate'] : '';
      }
      await this.repo.load();
      if (generation !== this.generation) return;
      this.prefill();
      this.ready.set(true);
    });
  }

  private prefill() {
    const f = findingOrUnknown(this.repo.record(), this.key());
    const recorded = !!this.repo.record().findings[this.key()];
    this.answer.set(recorded ? f.completeness.state : null);
    this.value = f.completeness.state === 'present' ? f.completeness.value : '';
    this.source = f.source && f.source !== 'extracted-and-confirmed' ? f.source : this.inFlow ? this.flowSource : 'entered-from-report';
    this.wording = f.originalWording ?? '';
    const currentReport = this.repo.record().reports?.find((report) => report.id === this.repo.record().activeReportId);
    this.reportDate = f.reportDate ?? (this.source === 'entered-from-report' ? this.inFlow ? this.flowDate : currentReport?.reportDate ?? '' : '');
    this.unit = null;
    this.addQuestion.set(true);
    this.showWhy.set(false);
    this.error.set(null);
  }

  choose(a: Answer) {
    this.answer.set(a);
    this.error.set(null);
  }

  async save() {
    if (!this.ready() || this.saving()) return;
    const a = this.answer();
    if (!a) {
      this.error.set('Choose an answer, or skip for now.');
      return;
    }
    if (a === 'present' && !this.value.trim()) {
      this.error.set('Add what your report or doctor said, or choose “I don’t know”.');
      return;
    }
    if (a === 'present' && this.needsUnit() && !this.unit) {
      this.error.set('Choose cm or mm from your report, or include the unit in the size. If you don’t know the unit, choose “I don’t know”.');
      return;
    }
    if (!await this.saveAnswer(a)) return;
    this.next();
  }

  /** Keeps whatever is complete on this question, then returns to where the flow started. */
  async finishLater() {
    if (!this.ready() || this.saving()) return;
    const a = this.answer();
    if (a && !(a === 'present' && !this.value.trim())) {
      if (a === 'present' && this.needsUnit() && !this.unit) {
        this.error.set('Choose the size unit before saving, or choose “I don’t know”.');
        return;
      }
      if (!await this.saveAnswer(a)) return;
    }
    this.router.navigateByUrl(this.returnUrl(), { replaceUrl: true });
  }

  /** Editing one answer: leave without changing it. */
  cancel() {
    this.router.navigateByUrl(this.returnUrl());
  }

  private returnUrl(): string {
    return { today: '/tabs/today', health: '/tabs/health', summary: '/health/summary' }[this.from];
  }

  private async persist(a: Answer) {
    const key = this.key();
    if (a === 'unknown') {
      await this.repo.saveFinding({ key, completeness: { state: 'unknown' } });
      if (this.addQuestion()) await this.repo.addQuestion(this.def().questionIfUnknown, key);
    } else {
      await this.repo.saveFinding({
        key,
        completeness: a === 'present' ? { state: 'present', value: this.needsUnit() ? `${this.value.trim()} ${this.unit}` : this.value.trim() } : { state: 'absent' },
        source: this.source,
        originalWording: this.source === 'entered-from-report' ? this.wording.trim() || undefined : undefined,
        reportDate: this.source === 'entered-from-report' ? this.reportDate || undefined : undefined,
      });
      if (this.inFlow) {
        this.flowSource = this.source;
        this.flowDate = this.source === 'entered-from-report' ? this.reportDate : '';
      }
    }
  }

  private async saveAnswer(answer: Answer): Promise<boolean> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.persist(answer);
      return true;
    } catch {
      this.error.set('Could not save this detail. Please try again.');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  /** Leaves the finding as it is (unrecorded findings stay "Not recorded"). */
  skip() {
    this.next();
  }

  private next() {
    const i = FINDING_KEYS.indexOf(this.key());
    if (!this.inFlow) {
      this.router.navigateByUrl(this.returnUrl());
    } else if (i < FINDING_KEYS.length - 1) {
      this.router.navigate(['/health/record', FINDING_KEYS[i + 1]], {
        queryParams: { flow: 1, from: this.from },
        state: { recordSource: this.flowSource, reportDate: this.flowDate },
        replaceUrl: true,
      });
    } else {
      // The end of the flow shows what she has so far, instead of dropping her on a list.
      this.router.navigate(['/health/recorded'], { queryParams: { from: this.from }, replaceUrl: true });
    }
  }
}
