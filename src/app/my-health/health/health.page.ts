import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { FINDINGS, FINDING_KEYS, diagnosisProgress, findingOrUnknown } from '../diagnosis.model';
import { FindingStatusComponent } from '../finding-status.component';
import { buildTimeline } from '../symptoms/symptom-timeline.page';

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
  /** Last 7 days, oldest first, for the small strip. */
  readonly week = computed(() => buildTimeline(this.repo.record().symptoms ?? [], 7).reverse());
  readonly today = computed(() => this.week()[this.week().length - 1]);

  shortDay(d: { date: string; label: string }): string {
    if (d.label === 'Today') return 'Today';
    return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(new Date(d.date + 'T00:00:00'));
  }

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
