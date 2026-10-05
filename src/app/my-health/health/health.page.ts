import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { FINDINGS, FINDING_KEYS, diagnosisProgress, findingOrUnknown, unansweredQuestions } from '../diagnosis.model';
import { FindingStatusComponent } from '../finding-status.component';
import { checkinsInWindow, coverageLine, impactLine, symptomParts } from '../checkins';
import { dayLabel } from '../symptoms/symptom-timeline.page';
import { localIsoDate } from '../../shared/calendar-date';

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
  readonly activeReport = computed(() => this.repo.record().reports?.find((r) => r.id === this.repo.record().activeReportId));
  readonly openSteps = computed(() => (this.repo.record().tasks ?? []).filter((task) => !task.completedAt));
  readonly rows = computed(() => FINDING_KEYS.map((k) => findingOrUnknown(this.repo.record(), k)));
  readonly unknownCount = computed(() => this.rows().filter((f) => f.completeness.state === 'unknown').length);
  /** Part-way through the diagnosis questions: offer to pick up where she stopped. */
  readonly partial = computed(() => {
    const p = diagnosisProgress(this.repo.record());
    return p.answered > 0 && p.nextKey ? p : null;
  });
  readonly questions = this.repo.questions;
  readonly pendingQuestions = computed(() => unansweredQuestions(this.repo.record()));
  readonly answeredCount = computed(() => this.questions().length - this.pendingQuestions().length);
  readonly visitCount = computed(() => this.repo.record().visits?.length ?? 0);
  readonly lastVisit = computed(() => this.repo.record().visits?.[0] ?? null);
  readonly checkinCount = computed(() => checkinsInWindow(this.repo.record().symptoms ?? [], 30).length);
  readonly saveError = signal<string | null>(null);
  visitGoal = '';
  readonly appointment = computed(() => this.repo.record().appointment);
  /** The latest check-in and coverage, instead of a strip of empty days. */
  readonly todayIso = localIsoDate();
  private readonly recent = computed(() => checkinsInWindow(this.repo.record().symptoms ?? [], 14));
  readonly coverage = computed(() => coverageLine(this.recent().length, 14));
  readonly latest = computed(() => this.recent()[0] ?? null);
  readonly loggedToday = computed(() => this.latest()?.date === this.todayIso);
  readonly latestLabel = computed(() => (this.latest() ? dayLabel(this.latest()!.date) : ''));
  readonly latestImpact = computed(() => (this.latest() ? impactLine(this.latest()!) : null));
  readonly latestParts = computed(() => (this.latest() ? symptomParts(this.latest()!) : []));

  async ionViewWillEnter() {
    await this.repo.load();
    this.visitGoal = this.repo.record().visitGoal ?? '';
  }

  async saveGoal() {
    await this.saveChange(() => this.repo.setVisitGoal(this.visitGoal));
  }

  private async saveChange(change: () => Promise<void>) {
    this.saveError.set(null);
    try {
      await change();
    } catch {
      this.saveError.set('Could not save your visit preparation. Please try again.');
    }
  }

  setDate(value: string) {
    void this.saveChange(() => this.repo.setAppointment({ date: value || undefined }));
  }

  setWith(value: string) {
    void this.saveChange(() => this.repo.setAppointment({ with: value.trim() || undefined }));
  }
}
