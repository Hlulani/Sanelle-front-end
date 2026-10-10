import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaFrameComponent } from '../../shared/design/figma/figma-frame.component';
import { FigmaIconComponent } from '../../shared/design/figma/figma-icon.component';
import { HealthRepository } from '../health-repository';
import { FINDINGS, FINDING_KEYS, reportStatus } from '../diagnosis.model';

/** RPT-04: where the report went, and whether it is Checked or still Needs checking. */
@Component({
  selector: 'app-report-saved',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, RouterLink, FigmaFrameComponent, FigmaIconComponent],
  templateUrl: './report-saved.page.html',
})
export class ReportSavedPage {
  private readonly repo = inject(HealthRepository);
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  readonly report = computed(() => this.repo.record().reports?.find((r) => r.id === this.id()) ?? null);
  readonly checked = computed(() => !!this.report() && reportStatus(this.report()!) === 'checked');
  readonly recorded = computed(() =>
    FINDING_KEYS.filter(
      (k) => this.report()?.findings[k] && this.report()!.findings[k]!.completeness.state !== 'unknown',
    ).map((k) => FINDINGS[k].label),
  );
  readonly missing = computed(() =>
    FINDING_KEYS.filter((k) => !this.recorded().includes(FINDINGS[k].label)).map((k) => FINDINGS[k].label),
  );

  ionViewWillEnter() {
    void this.repo.load();
  }
}
