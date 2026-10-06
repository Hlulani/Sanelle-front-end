import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { VisitReview } from '../diagnosis.model';
import { localIsoDate } from '../../shared/calendar-date';
import { anyFilled, calendarDate, notAfter } from '../../shared/forms/validators';

@Component({
  selector: 'app-visit',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, IonContent],
  templateUrl: './visit.page.html',
  styleUrls: ['./visit.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitPage implements OnInit {
  private repo = inject(HealthRepository);
  private destroyRef = inject(DestroyRef);
  readonly record = this.repo.record;
  readonly today = localIsoDate();
  readonly saving = signal(false);
  readonly ready = signal(false);
  readonly status = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup(
    {
      date: new FormControl(this.today, {
        nonNullable: true,
        validators: [Validators.required, calendarDate(), notAfter(() => this.today)],
      }),
      discussion: new FormControl('', { nonNullable: true }),
      nextSteps: new FormControl('', { nonNullable: true }),
      followUp: new FormControl('', { nonNullable: true }),
    },
    { validators: anyFilled('discussion', 'nextSteps', 'followUp') },
  );

  constructor() {
    // Choosing a date opens that visit's saved notes, or a blank page for a new one.
    this.form.controls.date.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((date) => this.showVisitOn(date));
  }

  async ngOnInit() {
    await this.repo.load();
    const appointmentDate = this.record().appointment.date;
    this.selectDate(appointmentDate && appointmentDate <= this.today ? appointmentDate : this.today);
    this.ready.set(true);
  }

  selectDate(date: string) {
    this.form.controls.date.setValue(date, { emitEvent: false });
    this.showVisitOn(date);
  }

  edit(visit: VisitReview) {
    this.selectDate(visit.date);
  }

  async save() {
    if (!this.ready() || this.saving()) return;
    this.error.set(null);
    this.status.set(null);
    if (this.form.controls.date.invalid) {
      this.error.set('Choose the date of a visit that has already happened.');
      return;
    }
    if (this.form.hasError('anyFilled')) {
      this.error.set('Add something you want to remember from the visit.');
      return;
    }
    const { date, discussion, nextSteps, followUp } = this.form.getRawValue();
    this.saving.set(true);
    try {
      await this.repo.saveVisit({
        date,
        discussion: discussion.trim(),
        nextSteps: nextSteps.trim(),
        followUp: followUp.trim(),
      });
      this.status.set(
        'Visit notes saved in My health. Choose them in your summary when you want to bring them next time.',
      );
    } catch {
      this.error.set('Could not save your visit notes. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private showVisitOn(date: string) {
    const visit = this.record().visits?.find((v) => v.date === date);
    this.form.patchValue(
      { discussion: visit?.discussion ?? '', nextSteps: visit?.nextSteps ?? '', followUp: visit?.followUp ?? '' },
      { emitEvent: false },
    );
    this.status.set(null);
    this.error.set(null);
  }
}
