import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth/auth.service';
import { FoodNeed, PRIORITIES, Priority, ProfileService, TrackedSymptom } from '../core/profile/profile.service';
import { HealthRepository } from '../my-health/health-repository';
import { OnboardingDraft } from './onboarding-draft';
import { FoodProfileService } from '../food/food-profile.service';
import { PHOTOS } from '../shared/photos';
import { isIsoDate, localIsoDate, parseLocalDate } from '../shared/calendar-date';

const STEPS = 5;
const SUMMARY_STEP = 6;
/**
 * ONB-01 to ONB-05: enough to organise the app, nothing more. Every step is
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
        return this.draft.preview() ? 'ONB-01D' : this.draft.name.trim() ? 'ONB-01' : 'ONB-01E';
      case 2:
        return this.draft.priorities().length ? 'ONB-02' : 'ONB-02E';
      case 3:
        return this.draft.count.trim() || this.draft.size.trim() ? 'ONB-03' : 'ONB-03E';
      case 4:
        return this.draft.trackSymptoms().length || this.draft.foodNeeds().length ? 'ONB-04' : 'ONB-04E';
      case 5:
        return this.draft.appointmentDate ? 'ONB-05' : 'ONB-05E';
      default:
        return 'ONB-06';
    }
  }
  get title(): string {
    return [
      '',
      '',
      this.draft.name.trim()
        ? `What would you like help with, ${this.draft.name.trim()}?`
        : 'What would you like help with?',
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
      'Choose the symptoms to show first in check-ins and practical needs for food planning. Nothing is logged from these choices.',
      'Add a date if you want Sanelle to help you prepare. No appointment is required.',
      'Check your answers and edit any section before opening Sanelle.',
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
      this.draft
        .priorities()
        .map((value) => labels[value])
        .join(' · ') || 'Not chosen'
    );
  }
  get appointmentLabel(): string {
    return this.draft.appointmentDate && isIsoDate(this.draft.appointmentDate)
      ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
          parseLocalDate(this.draft.appointmentDate),
        )
      : 'No date added';
  }
  get diagnosisSummary(): string {
    return this.draft.diagnosisSummary(this.health.record().findings);
  }
  get symptomSummary(): string {
    return (
      this.symptomChoices
        .filter((c) => this.draft.trackSymptoms().includes(c.value))
        .map((c) => c.label)
        .join(' · ') || 'No preferences chosen'
    );
  }
  get foodSummary(): string {
    return (
      this.foodChoices
        .filter((c) => this.draft.foodNeeds().includes(c.value))
        .map((c) => c.label)
        .join(' · ') || 'No preferences chosen'
    );
  }
  readonly ready = signal(false);
  async editStep(step: number) {
    if (this.saving()) return;
    this.draft.beginReviewEdit();
    this.error.set(null);
    await this.go(step);
  }
  async returnToSetup() {
    this.draft.endPreview();
    await this.ngOnInit();
    if (this.ready()) await this.go(1);
  }
  async skipName() {
    this.draft.name = '';
    await this.next();
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
  readonly today = localIsoDate();

  readonly draft = new OnboardingDraft();
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly progressLabel = computed(() =>
    this.step() <= STEPS ? `Step ${this.step()} of ${STEPS}` : 'Ready to start',
  );
  async ngOnInit() {
    this.ready.set(false);
    this.error.set(null);
    try {
      await Promise.all([this.profile.load(), this.health.load(), this.food.load()]);
      this.draft.load({
        profile: this.profile.profile(),
        findings: this.health.record().findings,
        practicalNeeds: this.food.reviewed() ? this.food.profile().practical : this.profile.profile().foodNeeds,
        displayName: this.auth.getDisplayName() || '',
        appointmentDate: this.health.record().appointment.date ?? '',
      });
      this.ready.set(true);
    } catch {
      this.error.set('Your setup couldn’t be loaded. Try again before making changes.');
    }
    this.changeDetector.markForCheck();
  }

  async loadThandi() {
    this.draft.startPreview();
    await this.next();
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
    this.draft.appointmentDate = '';
    await this.next();
  }

  async next() {
    if (this.saving() || !this.ready()) return;
    this.error.set(null);
    const step = this.step();
    const validationError = this.draft.validateStep(step, this.today);
    if (validationError) {
      this.error.set(validationError);
      return;
    }
    this.saving.set(true);
    try {
      if (step <= STEPS && this.draft.canPersist) await this.saveStep(step);
      if (step < SUMMARY_STEP) {
        await this.go(this.draft.editingReview() ? SUMMARY_STEP : step + 1);
        this.draft.completeReviewEdit();
      } else if (this.draft.preview()) await this.returnToSetup();
      else await this.finish();
    } catch {
      this.error.set('This step couldn’t be saved. Please try again.');
      return;
    } finally {
      this.saving.set(false);
    }
  }

  private async saveStep(step: number) {
    if (!this.draft.canPersist) return;
    switch (step) {
      case 1:
        return this.profile.save({ name: this.draft.name });
      case 2:
        return this.profile.save({ priorities: this.draft.priorities() });
      case 3:
        return this.saveKnownDetails();
      case 4:
        await this.profile.save({
          trackSymptoms: this.draft.trackSymptoms(),
          foodNeeds: this.draft.foodNeeds(),
        });
        return this.food.seedPractical(this.draft.foodNeeds());
      default:
        return this.health.setAppointment({ date: this.draft.appointmentDate || undefined });
    }
  }

  /** Only what she typed is saved, as her own note. A blank stays (or goes back to) not recorded. */
  private saveKnownDetails(): Promise<void> {
    const findings = this.draft.diagnosisChanges(this.health.record().findings);
    return (findings.length ? this.health.saveFindings(findings) : Promise.resolve()).then(() => {
      this.draft.acceptDiagnosisChanges();
    });
  }

  private async finish() {
    await this.profile.save({ onboardedAt: this.profile.profile().onboardedAt ?? new Date().toISOString() });
    await this.auth.setOnboardingCompleted(true);
    await this.router.navigateByUrl('/tabs/today', { replaceUrl: true });
  }

  back() {
    if (!this.saving()) {
      const destination = this.draft.editingReview() ? SUMMARY_STEP : this.step() - 1;
      this.draft.cancelReviewEdit();
      return this.go(destination);
    }
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
