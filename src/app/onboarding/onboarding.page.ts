import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth/auth.service';
import { FoodNeed, PRIORITIES, Priority, ProfileService, TrackedSymptom } from '../core/profile/profile.service';
import { HealthRepository } from '../my-health/health-repository';
import { Finding } from '../my-health/diagnosis.model';
import { FoodProfileService } from '../food/food-profile.service';
import { PHOTOS } from '../shared/photos';
import { isIsoDate, localIsoDate, parseLocalDate } from '../shared/calendar-date';

const STEPS = 5;
const SUMMARY_STEP = 6;
/** Demo values from the actual prototype. Diagnosis values are saved only when that step is continued. */
export const THANDI = {
  name: 'Thandi',
  priorities: ['diagnosis', 'food', 'appointment'] as Priority[],
  count: '2',
  size: '4.1',
  trackSymptoms: ['bleeding'] as TrackedSymptom[],
  foodNeeds: ['quick', 'ingredient-swaps'] as FoodNeed[],
};

/**
 * ONB-01 to ONB-05: enough to organise the app, nothing more. Every step after the name is
 * optional, nothing is inferred, and fertility goals are never assumed or asked.
 */
@Component({
  selector: 'app-onboarding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, FormsModule],
  templateUrl: './onboarding.page.html',
  styleUrls: ['../shared/design/figma-entry.scss'],
})
export class OnboardingPage implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileService);
  private readonly health = inject(HealthRepository);
  private readonly food = inject(FoodProfileService);

  get photo() {
    return { ...PHOTOS.reading, src: 'assets/photos/figma-onboarding-reading.jpg' };
  }
  get screenId(): string {
    switch (this.step()) {
      case 1:
        return this.demoLoaded() ? 'ONB-01D' : this.name.trim() ? 'ONB-01' : 'ONB-01E';
      case 2:
        return this.priorities().length ? 'ONB-02' : 'ONB-02E';
      case 3:
        return this.count.trim() || this.size.trim() ? 'ONB-03' : 'ONB-03E';
      case 4:
        return this.trackSymptoms().length || this.foodNeeds().length ? 'ONB-04' : 'ONB-04E';
      case 5:
        return this.appointmentDate ? 'ONB-05' : 'ONB-05E';
      default:
        return 'ONB-06';
    }
  }
  get title(): string {
    return [
      '',
      '',
      `What would you like help with, ${this.name}?`,
      'Add only what you know',
      'What would you like Sanelle to keep in mind?',
      'Do you have an appointment coming up?',
      'Ready to start',
    ][this.step()];
  }
  get eyebrow(): string {
    return [
      '',
      '',
      'Make Sanelle useful from day one',
      'Your diagnosis record',
      'Your everyday context',
      'One last optional detail',
      'Your setup',
    ][this.step()];
  }
  get lead(): string {
    return [
      '',
      '',
      'Choose any that matter now. This only organises what you see first—it does not create medical recommendations.',
      'Scan reports can be hard to read. Leave anything blank if it was not recorded or you are unsure—Sanelle will never fill the gaps for you.',
      'These answers make check-ins and meal ideas more relevant. They are optional and can change.',
      'Add a date if you want Sanelle to help you prepare. No appointment is required.',
      'Review what Sanelle will organise first. You can go back to update anything.',
    ][this.step()];
  }
  get prioritySummary(): string {
    const labels: Record<Priority, string> = {
      diagnosis: 'Diagnosis',
      food: 'Food',
      symptoms: 'Symptoms',
      appointment: 'Appointment preparation',
    };
    return (
      this.priorities()
        .map((value) => labels[value])
        .join(' · ') || 'Not chosen'
    );
  }
  get appointmentLabel(): string {
    return this.appointmentDate && isIsoDate(this.appointmentDate)
      ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
          parseLocalDate(this.appointmentDate),
        )
      : 'No date added';
  }
  get diagnosisSummary(): string {
    const savedSize = this.health.record().findings.largestSize;
    const size = this.size.trim()
      ? `${this.size.trim()} cm`
      : savedSize?.completeness.state === 'present'
        ? [savedSize.completeness.value, savedSize.unit].filter(Boolean).join(' ')
        : '';
    return [
      this.count.trim()
        ? this.count.trim() + (this.count.trim() === '1' ? ' fibroid' : ' fibroids')
        : 'Number not recorded',
      size ? `Largest recorded size: ${size}` : 'Size not recorded',
    ].join(' · ');
  }
  readonly total = STEPS;
  readonly step = toSignal(
    this.route.queryParamMap.pipe(
      map((p) => Math.min(SUMMARY_STEP, Math.max(1, Math.floor(Number(p.get('step')) || 1)))),
    ),
    { initialValue: 1 },
  );
  readonly priorityChoices = PRIORITIES.map((value) => ({
    value,
    label: {
      diagnosis: 'Understand my diagnosis',
      food: 'Make food feel simpler',
      symptoms: 'Track symptoms',
      appointment: 'Prepare for appointments',
    }[value],
  }));
  readonly symptomChoices: { value: TrackedSymptom; label: string }[] = [
    { value: 'bleeding', label: 'Heavy bleeding' },
    { value: 'pain', label: 'Pain or cramping' },
    { value: 'pressure', label: 'Pelvic pressure' },
    { value: 'tiredness', label: 'Low energy' },
  ];
  readonly foodChoices: { value: FoodNeed; label: string }[] = [
    { value: 'quick', label: 'Quick meals' },
    { value: 'budget', label: 'Budget-friendly ideas' },
    { value: 'ingredient-swaps', label: 'Ingredient substitutions' },
  ];
  readonly noSymptoms = signal(false);
  readonly cookingForOthers = signal(false);
  readonly foodClaimHelp = signal(false);
  readonly today = localIsoDate();

  name = '';
  count = '';
  size = '';
  appointmentDate = '';
  private originalCount = '';
  private originalSize = '';
  readonly priorities = signal<Priority[]>([]);
  readonly trackSymptoms = signal<TrackedSymptom[]>([]);
  readonly foodNeeds = signal<FoodNeed[]>([]);
  readonly demoLoaded = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly progressLabel = computed(() =>
    this.step() <= STEPS ? `Step ${this.step()} of ${STEPS}` : 'Ready to start',
  );
  async ngOnInit() {
    await Promise.all([this.profile.load(), this.health.load()]);
    const p = this.profile.profile();
    this.name = p.name || this.auth.getDisplayName() || '';
    this.priorities.set(p.priorities);
    this.trackSymptoms.set(p.trackSymptoms);
    this.foodNeeds.set(p.foodNeeds);
    this.noSymptoms.set(p.onboardingContext?.noSymptomsRightNow ?? false);
    this.cookingForOthers.set(p.onboardingContext?.cookingForOthers ?? false);
    this.foodClaimHelp.set(p.onboardingContext?.foodClaimHelp ?? false);
    this.appointmentDate = this.health.record().appointment.date ?? '';
    const { count, largestSize } = this.health.record().findings;
    if (count?.completeness.state === 'present') this.count = count.completeness.value;
    if (largestSize?.completeness.state === 'present') {
      const recorded = [largestSize.completeness.value, largestSize.unit].filter(Boolean).join(' ');
      const scalar = recorded.match(/^([0-9]+(?:\.[0-9]+)?)\s*(cm|mm)$/i);
      if (scalar) this.size = String(Number(scalar[1]) / (scalar[2].toLowerCase() === 'mm' ? 10 : 1));
      // Unspecified units and multidimensional measurements stay in the health record; no unit is guessed.
    }
    this.originalCount = this.count;
    this.originalSize = this.size;
    this.changeDetector.markForCheck();
  }

  toggle<T>(list: { (): T[]; set(v: T[]): void }, value: T) {
    list.set(list().includes(value) ? list().filter((v) => v !== value) : [...list(), value]);
  }

  async loadThandi() {
    this.name = THANDI.name;
    this.priorities.set(THANDI.priorities);
    this.count = THANDI.count;
    this.size = THANDI.size;
    this.trackSymptoms.set(THANDI.trackSymptoms);
    this.foodNeeds.set(THANDI.foodNeeds);
    this.appointmentDate = '';
    this.noSymptoms.set(false);
    this.cookingForOthers.set(false);
    this.foodClaimHelp.set(true);
    this.demoLoaded.set(true);
    await this.next();
  }

  setCount(value: string) {
    this.count = value.replace(/\D/g, '');
  }
  setSize(value: string) {
    this.size = value.replace(/[^0-9.]/g, '');
  }

  openDatePicker(event: Event) {
    const input = event.target as HTMLInputElement;
    try {
      input.showPicker?.();
    } catch {
      // Browsers without showPicker support retain the native date input interaction.
    }
  }

  async withoutDate() {
    if (this.saving()) return;
    this.appointmentDate = '';
    await this.next();
  }

  async next() {
    if (this.saving()) return;
    this.error.set(null);
    const step = this.step();
    if (step === 1 && !this.name.trim()) {
      this.error.set('Add the name you’d like Sanelle to use.');
      return;
    }
    if (step === 3 && this.size && !/^\d+(?:\.\d+)?$/.test(this.size)) {
      this.error.set('Enter a size in centimetres, or leave it blank if it is not recorded.');
      return;
    }
    if (step === 5 && this.appointmentDate && (!isIsoDate(this.appointmentDate) || this.appointmentDate < this.today)) {
      this.error.set('Choose today or a later date, or leave it blank.');
      return;
    }
    this.saving.set(true);
    try {
      if (step <= STEPS) await this.saveStep(step);
      if (step < SUMMARY_STEP) await this.go(step + 1);
      else await this.finish();
    } catch {
      this.error.set('This step couldn’t be saved. Please try again.');
      return;
    } finally {
      this.saving.set(false);
    }
  }

  private async saveStep(step: number) {
    switch (step) {
      case 1:
        return this.profile.save({ name: this.name });
      case 2:
        return this.profile.save({ priorities: this.priorities() });
      case 3:
        return this.saveKnownDetails();
      case 4:
        await this.profile.save({
          trackSymptoms: this.trackSymptoms(),
          foodNeeds: this.foodNeeds(),
          onboardingContext: {
            noSymptomsRightNow: this.noSymptoms(),
            cookingForOthers: this.cookingForOthers(),
            foodClaimHelp: this.foodClaimHelp(),
          },
        });
        return this.food.seedPractical(this.foodNeeds());
      default:
        return this.health.setAppointment({ date: this.appointmentDate || undefined });
    }
  }

  /** Only what she typed is saved, as her own note. A blank stays (or goes back to) not recorded. */
  private saveKnownDetails(): Promise<void> {
    const saved = this.health.record().findings;
    const findings: Finding[] = [];
    if (this.count !== this.originalCount && this.count.trim())
      findings.push({
        key: 'count',
        completeness: { state: 'present', value: this.count.trim() },
        source: 'self-reported',
      });
    else if (this.count !== this.originalCount && saved.count?.source === 'self-reported')
      findings.push({ key: 'count', completeness: { state: 'unknown' } });
    if (this.size !== this.originalSize && this.size.trim())
      findings.push({
        key: 'largestSize',
        completeness: { state: 'present', value: this.size.trim() },
        unit: 'cm',
        source: 'self-reported',
      });
    else if (this.size !== this.originalSize && saved.largestSize?.source === 'self-reported')
      findings.push({ key: 'largestSize', completeness: { state: 'unknown' } });
    return (findings.length ? this.health.saveFindings(findings) : Promise.resolve()).then(() => {
      this.originalCount = this.count;
      this.originalSize = this.size;
    });
  }

  private async finish() {
    await this.profile.save({ onboardedAt: new Date().toISOString(), firstUseDone: false });
    this.auth.setOnboardingCompleted(true);
    await this.router.navigateByUrl('/tabs/today', { replaceUrl: true });
  }

  back() {
    if (!this.saving()) return this.go(this.step() - 1);
    return Promise.resolve(false);
  }

  private go(step: number) {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { step: Math.max(1, step) },
      replaceUrl: step < this.step(),
    });
  }
}
