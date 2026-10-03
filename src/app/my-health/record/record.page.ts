import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

type Answer = 'present' | 'absent' | 'unknown';

const SOURCE_CHOICES: Record<string, string> = {
  'entered-from-report': 'My report',
  'told-by-clinician': 'An appointment',
  'self-reported': 'My own note',
};

@Component({
  selector: 'app-record',
  standalone: true,
  imports: [FormsModule, IonContent],
  templateUrl: './record.page.html',
  styleUrls: ['./record.page.scss'],
})
export class RecordPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private repo = inject(HealthRepository);

  readonly sources = ENTERABLE_SOURCES;
  readonly sourceChoices = SOURCE_CHOICES;

  readonly key = signal<FindingKey>('count');
  readonly def = computed(() => FINDINGS[this.key()]);
  readonly step = computed(() => FINDING_KEYS.indexOf(this.key()) + 1);
  readonly total = FINDING_KEYS.length;

  /** Walking through every finding (from "Start with what you know") or editing one. */
  inFlow = false;

  readonly answer = signal<Answer | null>(null);
  value = '';
  source: FindingSource = 'entered-from-report';
  wording = '';
  reportDate = '';
  readonly addQuestion = signal(true);
  readonly showWhy = signal(false);
  readonly error = signal<string | null>(null);

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const k = params.get('key') as FindingKey;
      this.key.set(FINDING_KEYS.includes(k) ? k : 'count');
      this.inFlow = this.route.snapshot.queryParamMap.get('flow') === '1';
      await this.repo.load();
      this.prefill();
    });
  }

  private prefill() {
    const f = findingOrUnknown(this.repo.record(), this.key());
    const recorded = !!this.repo.record().findings[this.key()];
    this.answer.set(recorded ? f.completeness.state : null);
    this.value = f.completeness.state === 'present' ? f.completeness.value : '';
    this.source = f.source && f.source !== 'extracted-and-confirmed' ? f.source : 'entered-from-report';
    this.wording = f.originalWording ?? '';
    this.reportDate = f.reportDate ?? '';
    this.addQuestion.set(true);
    this.showWhy.set(false);
    this.error.set(null);
  }

  choose(a: Answer) {
    this.answer.set(a);
    this.error.set(null);
  }

  async save() {
    const a = this.answer();
    if (!a) {
      this.error.set('Choose an answer, or skip for now.');
      return;
    }
    if (a === 'present' && !this.value.trim()) {
      this.error.set('Add what your report or doctor said, or choose “I don’t know”.');
      return;
    }
    const key = this.key();
    if (a === 'unknown') {
      await this.repo.saveFinding({ key, completeness: { state: 'unknown' } });
      if (this.addQuestion()) await this.repo.addQuestion(this.def().questionIfUnknown, key);
    } else {
      await this.repo.saveFinding({
        key,
        completeness: a === 'present' ? { state: 'present', value: this.value.trim() } : { state: 'absent' },
        source: this.source,
        originalWording: this.source === 'entered-from-report' ? this.wording.trim() || undefined : undefined,
        reportDate: this.source === 'entered-from-report' ? this.reportDate || undefined : undefined,
      });
    }
    this.next();
  }

  /** Leaves the finding as it is (unrecorded findings stay "Not recorded"). */
  skip() {
    this.next();
  }

  close() {
    this.router.navigateByUrl('/tabs/health');
  }

  private next() {
    const i = FINDING_KEYS.indexOf(this.key());
    if (this.inFlow && i < FINDING_KEYS.length - 1) {
      this.router.navigate(['/health/record', FINDING_KEYS[i + 1]], { queryParams: { flow: 1 }, replaceUrl: true });
    } else {
      this.router.navigateByUrl('/tabs/health');
    }
  }
}
