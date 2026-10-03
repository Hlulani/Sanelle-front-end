import { Component, OnInit, computed, inject, signal } from '@angular/core';
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

export function isoToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** One day's check-in. Every section is optional; tapping a selected choice clears it. */
@Component({
  selector: 'app-symptom-log',
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

  readonly date = signal(isoToday());
  readonly bleeding = signal<BleedingLevel | undefined>(undefined);
  readonly pain = signal<number | undefined>(undefined);
  readonly bloating = signal<SymptomLevel | undefined>(undefined);
  readonly fatigue = signal<SymptomLevel | undefined>(undefined);
  readonly affected = signal<ImpactArea[] | undefined>(undefined);
  notes = '';
  treatmentChange = '';
  readonly maxDate = isoToday();
  /** Where she came from: saving today's check-in returns to Today; editing from history returns there. */
  readonly from = signal<'today' | 'health' | 'history'>('today');
  readonly backLabel = computed(() => ({ today: 'Today', health: 'My health', history: 'Symptoms' })[this.from()]);

  readonly dateLabel = computed(() => {
    if (this.date() === isoToday()) return 'Today';
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(this.date() + 'T00:00:00'),
    );
  });

  async ngOnInit() {
    const d = this.route.snapshot.paramMap.get('date');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= isoToday()) this.date.set(d);
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'health' || from === 'history') this.from.set(from);
    await this.repo.load();
    this.fill(this.repo.symptomsOn(this.date()));
  }

  private fill(e: SymptomEntry | undefined) {
    this.bleeding.set(e?.bleeding);
    this.pain.set(e?.pain);
    this.bloating.set(e?.bloating);
    this.fatigue.set(e?.fatigue);
    this.affected.set(e?.affected ? [...e.affected] : undefined);
    this.notes = e?.notes ?? '';
    this.treatmentChange = e?.treatmentChange ?? '';
  }

  changeDate(value: string) {
    if (!value || value > isoToday()) return;
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
    // Back to where she started, with a short confirmation on Today. Never into another questionnaire.
    if (this.from() === 'history') {
      this.router.navigateByUrl('/health/symptoms', { replaceUrl: true });
    } else {
      this.router.navigate(['/tabs/today'], { queryParams: { checkin: this.date() }, replaceUrl: true });
    }
  }

  close() {
    this.router.navigateByUrl({ today: '/tabs/today', health: '/tabs/health', history: '/health/symptoms' }[this.from()]);
  }
}
