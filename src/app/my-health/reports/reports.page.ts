import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { FINDINGS, FINDING_KEYS, HealthReport } from '../diagnosis.model';

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, IonContent],
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
})
export class ReportsPage {
  private repo = inject(HealthRepository);
  readonly record = this.repo.record;
  readonly reports = computed(() =>
    [...(this.record().reports ?? [])].sort((a, b) =>
      (b.reportDate || b.savedAt).localeCompare(a.reportDate || a.savedAt),
    ),
  );
  readonly keys = FINDING_KEYS;
  readonly defs = FINDINGS;
  readonly busy = signal(false);
  readonly error = signal('');
  readonly status = signal('');
  ionViewWillEnter() {
    void this.repo.load();
  }
  async select(report: HealthReport) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.repo.selectReport(report.id);
      this.status.set('Current report changed. My health and your summary now use only this report’s details.');
    } catch {
      this.error.set('Could not change your current report. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
