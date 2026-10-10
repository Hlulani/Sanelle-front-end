import { localIsoDate } from '../../calendar-date';
import { Injectable, computed, inject } from '@angular/core';
import { ProfileService } from '../../../core/profile/profile.service';
import { HealthRepository } from '../../../my-health/health-repository';
import {
  BLEEDING_LABELS,
  FINDING_KEYS,
  FindingKey,
  SymptomEntry,
  findingOrUnknown,
  findingValue,
  reportStatus,
} from '../../../my-health/diagnosis.model';
import { impactLine } from '../../../my-health/checkins';
import { dayName } from '../../../today/today-state';

/** Presentation adapters only: the Figma layout reads actual encrypted records. */
@Injectable({ providedIn: 'root' })
export class PatientDesignState {
  readonly health = inject(HealthRepository);
  readonly profile = inject(ProfileService);
  readonly name = this.profile.name;
  // Extracted values may already include the noun; the source headline supplies it once.
  // Keep the actual finding and its original wording untouched.
  readonly count = computed(() => this.value('count').replace(/\s+fibroids?$/i, ''));
  readonly size = computed(() => this.value('largestSize'));
  readonly missing = computed(() =>
    FINDING_KEYS.filter((k) => findingOrUnknown(this.health.record(), k).completeness.state === 'unknown'),
  );
  readonly reports = computed(() => this.health.record().reports ?? []);
  readonly latest = computed(
    () =>
      [...this.health.record().symptoms]
        .filter((e) => e.date <= localIsoDate())
        .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null,
  );
  readonly latestView = computed(() => (this.latest() ? this.checkin(this.latest()!) : null));
  readonly savedReport = computed(() => {
    const r = this.reports().at(-1);
    return r ? { ...r, name: r.title, status: reportStatus(r) === 'checked' ? 'Checked' : 'Needs checking' } : null;
  });
  value(key: FindingKey): string {
    const f = findingOrUnknown(this.health.record(), key);
    return f.completeness.state === 'absent' ? 'Report says not affected' : findingValue(f);
  }
  checkin(e: SymptomEntry) {
    const symptoms = e.observedSymptoms
      ? [...e.observedSymptoms]
      : [
          ...(e.bleeding !== undefined ? ['Bleeding'] : []),
          ...(e.pain !== undefined ? ['Pain'] : []),
          ...(e.bloating && e.bloating !== 'none' ? ['Pelvic pressure'] : []),
          ...(e.fatigue && e.fatigue !== 'none' ? ['Low energy'] : []),
        ];
    return {
      date: e.date,
      symptoms,
      bleeding: e.bleeding !== undefined ? BLEEDING_LABELS[e.bleeding] : 'Not recorded',
      impact: e.dailyImpact ?? impactLine(e) ?? 'Not recorded',
      recordedAt: dayName(e.date),
    };
  }
  async load() {
    await Promise.all([this.health.load(), this.profile.load()]);
  }
}
