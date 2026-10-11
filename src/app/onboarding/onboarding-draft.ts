import { signal } from '@angular/core';
import type { FoodNeed, Priority, Profile, TrackedSymptom } from '../core/profile/profile.service';
import type { Finding, HealthRecord } from '../my-health/diagnosis.model';
import { isIsoDate } from '../shared/calendar-date';

type SizeUnit = 'cm' | 'mm';
interface DraftValues {
  name: string;
  count: string;
  size: string;
  sizeUnit: SizeUnit;
  appointmentDate: string;
  priorities: Priority[];
  trackSymptoms: TrackedSymptom[];
  foodNeeds: FoodNeed[];
}
export interface OnboardingDraftSource {
  profile: Profile;
  findings: HealthRecord['findings'];
  practicalNeeds: readonly FoodNeed[];
  displayName: string;
  appointmentDate: string;
}

/** Editable setup state and its rules. This class has no storage, authentication or routing dependencies. */
export class OnboardingDraft {
  name = '';
  count = '';
  size = '';
  sizeUnit: SizeUnit = 'cm';
  appointmentDate = '';
  readonly priorities = signal<Priority[]>([]);
  readonly trackSymptoms = signal<TrackedSymptom[]>([]);
  readonly foodNeeds = signal<FoodNeed[]>([]);
  private readonly previewState = signal(false);
  readonly preview = this.previewState.asReadonly();
  private readonly reviewEditState = signal(false);
  readonly editingReview = this.reviewEditState.asReadonly();
  private reviewSnapshot: DraftValues | null = null;
  private originalDiagnosis = { count: '', size: '', sizeUnit: 'cm' as SizeUnit };

  get canPersist(): boolean {
    return !this.preview();
  }

  load(source: OnboardingDraftSource): void {
    const { count, largestSize } = source.findings;
    let size = '';
    let sizeUnit: SizeUnit = 'cm';
    if (largestSize?.completeness.state === 'present') {
      const recorded = [largestSize.completeness.value, largestSize.unit].filter(Boolean).join(' ');
      const scalar = recorded.match(/^([0-9]+(?:\.[0-9]+)?)\s*(cm|mm)$/i);
      if (scalar) {
        size = scalar[1];
        sizeUnit = scalar[2].toLowerCase() as SizeUnit;
      }
      // Unspecified units and multidimensional report measurements stay in the record.
    }
    this.apply({
      name: source.profile.name || source.displayName,
      count: count?.completeness.state === 'present' ? count.completeness.value : '',
      size,
      sizeUnit,
      appointmentDate: source.appointmentDate,
      priorities: source.profile.priorities,
      trackSymptoms: source.profile.trackSymptoms,
      foodNeeds: [...source.practicalNeeds],
    });
    this.endPreview();
    this.acceptDiagnosisChanges();
  }

  startPreview(): void {
    this.apply({
      name: 'Thandi',
      priorities: ['diagnosis', 'food', 'appointment'],
      count: '2',
      size: '4.1',
      sizeUnit: 'cm',
      trackSymptoms: ['bleeding'],
      foodNeeds: ['quick', 'ingredient-swaps'],
      appointmentDate: '',
    });
    this.completeReviewEdit();
    this.previewState.set(true);
  }

  endPreview(): void {
    this.previewState.set(false);
    this.completeReviewEdit();
  }

  beginReviewEdit(): void {
    this.reviewSnapshot = this.snapshot();
    this.reviewEditState.set(true);
  }

  cancelReviewEdit(): void {
    if (this.reviewSnapshot) this.apply(this.reviewSnapshot);
    this.completeReviewEdit();
  }

  completeReviewEdit(): void {
    this.reviewSnapshot = null;
    this.reviewEditState.set(false);
  }

  /** Normalise only valid values; ambiguous input remains available for correction. */
  validateStep(step: number, today: string): string | null {
    if (step === 3) {
      const count = this.count.trim();
      if (count && (!/^\d+$/.test(count) || !Number.isSafeInteger(Number(count))))
        return 'Enter one whole number of fibroids, or leave it blank if you’re unsure.';
      const size = this.size.trim().replace(',', '.');
      if (size && (!/^\d+(?:\.\d+)?$/.test(size) || !Number.isFinite(Number(size)) || Number(size) <= 0))
        return 'Enter a positive size, such as 4.1 or 4,1, and choose cm or mm. Leave it blank if you’re unsure.';
      this.count = count;
      this.size = size;
    }
    if (step === 5 && this.appointmentDate && (!isIsoDate(this.appointmentDate) || this.appointmentDate < today))
      return 'Choose today or a later date, or leave it blank.';
    return null;
  }

  /** Describe changes without touching storage. Blank edits never erase checked report findings. */
  diagnosisChanges(saved: HealthRecord['findings']): Finding[] {
    if (!this.canPersist) return [];
    const original = this.originalDiagnosis;
    const changes: Finding[] = [];
    if (this.count !== original.count && this.count.trim())
      changes.push({
        key: 'count',
        completeness: { state: 'present', value: this.count.trim() },
        source: 'self-reported',
      });
    else if (this.count !== original.count && saved.count?.source === 'self-reported')
      changes.push({ key: 'count', completeness: { state: 'unknown' } });
    if ((this.size !== original.size || this.sizeUnit !== original.sizeUnit) && this.size.trim())
      changes.push({
        key: 'largestSize',
        completeness: { state: 'present', value: this.size.trim() },
        unit: this.sizeUnit,
        source: 'self-reported',
      });
    else if (this.size !== original.size && saved.largestSize?.source === 'self-reported')
      changes.push({ key: 'largestSize', completeness: { state: 'unknown' } });
    return changes;
  }

  /** Called only after persistence succeeds, so a failed write can be retried. */
  acceptDiagnosisChanges(): void {
    this.originalDiagnosis = { count: this.count, size: this.size, sizeUnit: this.sizeUnit };
  }

  diagnosisSummary(saved: HealthRecord['findings']): string {
    const savedSize = saved.largestSize;
    const size = this.size.trim()
      ? `${this.size.trim()} ${this.sizeUnit}`
      : this.canPersist && savedSize?.completeness.state === 'present'
        ? [savedSize.completeness.value, savedSize.unit].filter(Boolean).join(' ')
        : '';
    const count =
      this.count.trim() ||
      (this.canPersist && saved.count?.completeness.state === 'present' ? saved.count.completeness.value : '');
    return [
      count ? count + (count === '1' ? ' fibroid' : ' fibroids') : 'Number not recorded',
      size ? `Largest recorded size: ${size}` : 'Size not recorded',
    ].join(' · ');
  }

  toggle<T>(list: { (): T[]; set(value: T[]): void }, value: T): void {
    list.set(list().includes(value) ? list().filter((item) => item !== value) : [...list(), value]);
  }

  private snapshot(): DraftValues {
    return {
      name: this.name,
      count: this.count,
      size: this.size,
      sizeUnit: this.sizeUnit,
      appointmentDate: this.appointmentDate,
      priorities: [...this.priorities()],
      trackSymptoms: [...this.trackSymptoms()],
      foodNeeds: [...this.foodNeeds()],
    };
  }

  private apply(values: DraftValues): void {
    this.name = values.name;
    this.count = values.count;
    this.size = values.size;
    this.sizeUnit = values.sizeUnit;
    this.appointmentDate = values.appointmentDate;
    this.priorities.set([...values.priorities]);
    this.trackSymptoms.set([...values.trackSymptoms]);
    this.foodNeeds.set([...values.foodNeeds]);
  }
}
