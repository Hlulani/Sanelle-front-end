import { ProfileService } from '../../core/profile/profile.service';
import { FormsModule } from '@angular/forms';
import { DialogFocusDirective } from '../../shared/design/figma/dialog-focus.directive';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HealthRepository } from '../health-repository';
import { BLEEDING_CHOICES, BLEEDING_LABELS, BleedingLevel, SymptomEntry, hasContent } from '../diagnosis.model';
import { isIsoDate, localIsoDate } from '../../shared/calendar-date';
import { FigmaIconComponent } from '../../shared/design/figma/figma-icon.component';
import { PatientDesignState } from '../../shared/design/figma/patient-design-state.service';
import { HealthPage } from '../health.page';
import { TodayPage } from '../../today/today.page';
@Component({
  selector: 'app-check-in',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DialogFocusDirective, FigmaIconComponent, HealthPage, TodayPage],
  templateUrl: './check-in.page.html',
})
export class CheckInPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repo = inject(HealthRepository);
  private readonly design = inject(PatientDesignState);
  readonly fromHealth = this.route.snapshot.queryParamMap.get('from') === 'health';
  readonly today = localIsoDate();
  readonly date = signal(this.today);
  readonly ready = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly selected = signal<NonNullable<SymptomEntry['observedSymptoms']>>([]);
  readonly bleed = signal<BleedingLevel | undefined>(undefined);
  readonly dailyImpact = signal<SymptomEntry['dailyImpact']>(undefined);
  private readonly profile = inject(ProfileService);
  readonly choices = computed(() => {
    const choices = [
      { key: 'bleeding', label: 'Bleeding' },
      { key: 'pressure', label: 'Pelvic pressure' },
      { key: 'pain', label: 'Pain' },
      { key: 'tiredness', label: 'Low energy' },
    ] as const;
    const preferences = this.profile.profile().trackSymptoms;
    return [
      ...choices.filter((c) => preferences.includes(c.key)),
      ...choices.filter((c) => !preferences.includes(c.key)),
    ].map((c) => c.label);
  });
  readonly bleedingLevels = BLEEDING_CHOICES.map((value) => ({ value, label: BLEEDING_LABELS[value] }));
  readonly bleedingLevelLabels = BLEEDING_CHOICES.map((value) => BLEEDING_LABELS[value]);
  readonly impacts: NonNullable<SymptomEntry['dailyImpact']>[] = [
    'No change',
    'Slowed me down',
    'Changed my plans',
    'Couldn’t do usual activities',
  ];
  readonly symptoms = this.selected;
  /** Her own words, kept exactly as written. */
  note = '';
  get impact() {
    return this.dailyImpact();
  }
  get bleeding() {
    return this.bleed() === undefined ? '' : BLEEDING_LABELS[this.bleed()!];
  }
  async ngOnInit() {
    const param = this.route.snapshot.paramMap.get('date');
    if (param && isIsoDate(param) && param <= this.today) this.date.set(param);
    await Promise.all([this.design.load(), this.profile.load()]);
    const e = this.repo.symptomsOn(this.date());
    this.selected.set(
      e?.observedSymptoms ??
        (e ? (this.design.checkin(e).symptoms as NonNullable<SymptomEntry['observedSymptoms']>) : []),
    );
    this.bleed.set(e?.bleeding);
    this.dailyImpact.set(e?.dailyImpact);
    this.note = e?.notes ?? '';
    this.ready.set(true);
  }
  toggle(choice: NonNullable<SymptomEntry['observedSymptoms']>[number]) {
    this.selected.update((current) =>
      current.includes(choice) ? current.filter((c) => c !== choice) : [...current, choice],
    );
    if (choice === 'Bleeding' && !this.selected().includes(choice)) this.bleed.set(undefined);
  }
  setImpact(value: NonNullable<SymptomEntry['dailyImpact']>) {
    this.dailyImpact.set(this.dailyImpact() === value ? undefined : value);
  }
  setBleeding(label: string) {
    const value = this.bleedingLevels.find((b) => b.label === label)?.value;
    if (value) this.bleed.set(this.bleed() === value ? undefined : value);
  }
  async save() {
    if (!this.ready() || this.saving()) return;
    if (!this.selected().length && !this.dailyImpact() && !this.note.trim()) {
      this.error.set('Choose at least one answer, or close without saving.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const prior = this.repo.symptomsOn(this.date());
      const observed = this.selected();
      const entry: SymptomEntry = {
        ...prior,
        date: this.date(),
        observedSymptoms: [...observed],
        bleeding: observed.includes('Bleeding') ? this.bleed() : undefined,
        dailyImpact: this.dailyImpact(),
        notes: this.note.trim() || undefined,
        pain: observed.includes('Pain') ? prior?.pain : undefined,
        bloating: observed.includes('Pelvic pressure') ? prior?.bloating : undefined,
        fatigue: observed.includes('Low energy') ? prior?.fatigue : undefined,
      };
      await this.repo.saveSymptoms(entry);
      void this.router.navigate(['/health/symptoms'], { queryParams: { saved: this.date() }, replaceUrl: true });
    } catch {
      this.error.set('Your check-in couldn’t be saved. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }
  close() {
    void this.router.navigateByUrl(this.fromHealth ? '/tabs/health' : '/tabs/today');
  }
}
