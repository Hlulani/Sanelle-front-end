import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { VisitReview } from '../diagnosis.model';
import { isIsoDate, localIsoDate } from '../../shared/calendar-date';

@Component({
  selector: 'app-visit',
  standalone: true,
  imports: [RouterLink, FormsModule, IonContent],
  templateUrl: './visit.page.html',
  styleUrls: ['./visit.page.scss'],
})
export class VisitPage implements OnInit {
  private repo = inject(HealthRepository);
  readonly record = this.repo.record;
  readonly today = localIsoDate();
  readonly saving = signal(false);
  readonly ready = signal(false);
  readonly status = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  date = this.today;
  discussion = '';
  nextSteps = '';
  followUp = '';

  async ngOnInit() {
    await this.repo.load();
    const appointmentDate = this.record().appointment.date;
    this.selectDate(appointmentDate && appointmentDate <= this.today ? appointmentDate : this.today);
    this.ready.set(true);
  }

  selectDate(date: string) {
    this.date = date;
    const visit = this.record().visits?.find((v) => v.date === date);
    this.discussion = visit?.discussion ?? '';
    this.nextSteps = visit?.nextSteps ?? '';
    this.followUp = visit?.followUp ?? '';
    this.status.set(null);
    this.error.set(null);
  }

  edit(visit: VisitReview) {
    this.selectDate(visit.date);
  }

  async save() {
    if (!this.ready() || this.saving()) return;
    this.error.set(null);
    this.status.set(null);
    if (!isIsoDate(this.date) || this.date > this.today) {
      this.error.set('Choose the date of a visit that has already happened.');
      return;
    }
    if (![this.discussion, this.nextSteps, this.followUp].some((v) => v.trim())) {
      this.error.set('Add something you want to remember from the visit.');
      return;
    }
    this.saving.set(true);
    try {
      await this.repo.saveVisit({ date: this.date, discussion: this.discussion.trim(), nextSteps: this.nextSteps.trim(), followUp: this.followUp.trim() });
      this.status.set('Visit notes saved in My health. Choose them in your summary when you want to bring them next time.');
    } catch {
      this.error.set('Could not save your visit notes. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }
}
