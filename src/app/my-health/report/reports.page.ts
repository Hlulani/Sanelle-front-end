import { FigmaIconComponent } from '../../shared/design/figma/figma-icon.component';
import { FigmaFrameComponent } from '../../shared/design/figma/figma-frame.component';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { HealthReport, REPORT_SOURCE_LABELS, reportStatus } from '../diagnosis.model';

/** Every saved report, newest first. Each keeps its own details; one is used as current. */
@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FigmaIconComponent, FigmaFrameComponent, IonContent, RouterLink],
  templateUrl: './reports.page.html',
})
export class ReportsPage {
  private readonly repo = inject(HealthRepository);
  readonly busy = signal(false);
  readonly current = computed(() => this.repo.record().activeReportId);
  readonly reports = computed(() =>
    [...(this.repo.record().reports ?? [])].sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
  );

  ionViewWillEnter() {
    void this.repo.load();
  }

  status = reportStatus;

  sourceLabel(r: HealthReport): string {
    return r.source ? REPORT_SOURCE_LABELS[r.source] : 'Saved report';
  }

  async use(r: HealthReport) {
    this.busy.set(true);
    try {
      await this.repo.selectReport(r.id);
    } finally {
      this.busy.set(false);
    }
  }
}
