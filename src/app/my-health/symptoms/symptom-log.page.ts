import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import {
  BLEEDING_LABELS,
  BleedingLevel,
  IMPACT_LABELS,
  ImpactArea,
  LEVEL_LABELS,
  SymptomEntry,
  SymptomLevel,
} from '../diagnosis.model';
import { localIsoDate } from '../../shared/calendar-date';

/** One day's check-in. Every section is optional; tapping a selected choice clears it. */
@Component({
  selector: 'app-symptom-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, IonContent],
  templateUrl: './symptom-log.page.html',
  styleUrls: ['./symptom-log.page.scss'],
})
export class SymptomLogPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private repo = inject(HealthRepository);

  readonly bleedingOptions = Object.entries(BLEEDING_LABELS) as [BleedingLevel, string][];
  readonly levelOptions = Object.entries(LEVEL_LABELS) as [SymptomLevel, string][];
  readonly impactOptions = Object.entries(IMPACT_LABELS) as [ImpactArea, string][];
  readonly painScale = Array.from({ length: 11 }, (_, i) => i);

  readonly sections = [
    ['bleeding', 'Bleeding'],
    ['pain', 'Pain'],
    ['bloating', 'Pressure or bloating'],
    ['fatigue', 'Tiredness'],
    ['affected', 'Impact on my day'],
    ['more', 'A note or treatment change'],
  ] as const;
  readonly visible = signal<string[]>([]);
  readonly ready = signal(false);
  readonly date = signal(localIsoDate());
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly bleeding = signal<BleedingLevel | undefined>(undefined);
  readonly pain = signal<number | undefined>(undefined);
  readonly bloating = signal<SymptomLevel | undefined>(undefined);
  readonly fatigue = signal<SymptomLevel | undefined>(undefined);
  readonly affected = signal<ImpactArea[] | undefined>(undefined);
  notes = '';
  treatmentChange = '';
  readonly maxDate = localIsoDate();
  /** Where she came from: saving today's check-in returns to Today; editing from history returns there. */
  readonly from = signal<'today' | 'health' | 'history'>('today');
  readonly backLabel = computed(() => ({ today: 'Today', health: 'My health', history: 'Symptoms' })[this.from()]);

  readonly dateLabel = computed(() => {
    if (this.date() === localIsoDate()) return 'Today';
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(this.date() + 'T00:00:00'),
    );
  });

  async ngOnInit() {
    const d = this.route.snapshot.paramMap.get('date');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= localIsoDate()) this.date.set(d);
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'health' || from === 'history') this.from.set(from);
    await this.repo.load();
    this.fill(this.repo.symptomsOn(this.date()));
    this.ready.set(true);
  }

  private fill(e: SymptomEntry | undefined) {
    this.bleeding.set(e?.bleeding);
    this.pain.set(e?.pain);
    this.bloating.set(e?.bloating);
    this.fatigue.set(e?.fatigue);
    this.affected.set(e?.affected ? [...e.affected] : undefined);
    this.notes = e?.notes ?? '';
    this.treatmentChange = e?.treatmentChange ?? '';
    this.visible.set(
      this.sections
        .filter(([key]) => (key === 'more' ? !!(e?.notes || e?.treatmentChange) : e?.[key] !== undefined))
        .map(([key]) => key),
    );
  }

  toggleSection(key: string) {
    const selected = this.visible().includes(key);
    this.visible.update((values) => (selected ? values.filter((v) => v !== key) : [...values, key]));
    if (selected) {
      if (key === 'more') {
        this.notes = '';
        this.treatmentChange = '';
      } else if (key === 'affected') this.affected.set(undefined);
      else if (key === 'bleeding') this.bleeding.set(undefined);
      else if (key === 'pain') this.pain.set(undefined);
      else if (key === 'bloating') this.bloating.set(undefined);
      else if (key === 'fatigue') this.fatigue.set(undefined);
    }
  }

  changeDate(value: string) {
    if (!value || value > localIsoDate()) return;
    this.date.set(value);
    this.fill(this.repo.symptomsOn(value));
  }

  /** Tap to choose; tap the chosen one again to clear it back to "not recorded". */
  pick<T>(sig: { (): T | undefined; set(v: T | undefined): void }, value: T) {
    sig.set(sig() === value ? undefined : value);
  }

  toggleAffected(area: ImpactArea) {
    const cur = this.affected() ?? [];
    this.affected.set(cur.includes(area) ? cur.filter((a) => a !== area) : [...cur, area]);
  }

  noneAffected() {
    this.affected.set(this.affected()?.length === 0 ? undefined : []);
  }

  async save() {
    if (!this.ready() || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.repo.saveSymptoms({
        date: this.date(),
        bleeding: this.bleeding(),
        pain: this.pain(),
        bloating: this.bloating(),
        fatigue: this.fatigue(),
        affected: this.affected(),
        notes: this.notes.trim() || undefined,
        treatmentChange: this.treatmentChange.trim() || undefined,
      });
    } catch {
      this.error.set('Could not save your check-in. Please try again.');
      return;
    } finally {
      this.saving.set(false);
    }
    // Back to where she started, with a short confirmation on Today. Never into another questionnaire.
    if (this.from() === 'history') {
      this.router.navigateByUrl('/health/symptoms', { replaceUrl: true });
    } else {
      this.router.navigate(['/tabs/today'], { queryParams: { checkin: this.date() }, replaceUrl: true });
    }
  }

  close() {
    this.router.navigateByUrl(
      { today: '/tabs/today', health: '/tabs/health', history: '/health/symptoms' }[this.from()],
    );
  }
}
