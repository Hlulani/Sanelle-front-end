import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { FINDINGS, FINDING_KEYS, diagnosisProgress, findingOrUnknown } from '../diagnosis.model';
import { FindingStatusComponent } from '../finding-status.component';
import { checkinsInWindow, coverageLine, impactLine, isoDay, symptomParts } from '../checkins';
import { dayLabel } from '../symptoms/symptom-timeline.page';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [RouterLink, FormsModule, IonContent, FindingStatusComponent],
  templateUrl: './health.page.html',
  styleUrls: ['./health.page.scss'],
})
export class HealthPage {
  private repo = inject(HealthRepository);

  readonly defs = FINDINGS;
  readonly rows = computed(() => FINDING_KEYS.map((k) => findingOrUnknown(this.repo.record(), k)));
  readonly unknownCount = computed(() => this.rows().filter((f) => f.completeness.state === 'unknown').length);
  /** Part-way through the diagnosis questions: offer to pick up where she stopped. */
  readonly partial = computed(() => {
    const p = diagnosisProgress(this.repo.record());
    return p.answered > 0 && p.nextKey ? p : null;
  });
  readonly questions = this.repo.questions;
  readonly appointment = computed(() => this.repo.record().appointment);
  /** The latest check-in and coverage, instead of a strip of empty days. */
  readonly todayIso = isoDay(new Date());
  private readonly recent = computed(() => checkinsInWindow(this.repo.record().symptoms ?? [], 14));
  readonly coverage = computed(() => coverageLine(this.recent().length, 14));
  readonly latest = computed(() => this.recent()[0] ?? null);
  readonly loggedToday = computed(() => this.latest()?.date === this.todayIso);
  readonly latestLabel = computed(() => (this.latest() ? dayLabel(this.latest()!.date) : ''));
  readonly latestImpact = computed(() => (this.latest() ? impactLine(this.latest()!) : null));
  readonly latestParts = computed(() => (this.latest() ? symptomParts(this.latest()!) : []));

  ionViewWillEnter() {
    void this.repo.load();
  }

  setDate(value: string) {
    void this.repo.setAppointment({ ...this.appointment(), date: value || undefined });
  }

  setWith(value: string) {
    void this.repo.setAppointment({ ...this.appointment(), with: value.trim() || undefined });
  }
}
