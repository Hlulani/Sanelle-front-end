import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import {
  FINDINGS,
  FINDING_KEYS,
  Finding,
  confirmationLabel,
  findingValue,
  missingExplanation,
} from '../diagnosis.model';
import { FigmaFrameComponent } from '../../shared/design/figma/figma-frame.component';
import { FigmaIconComponent } from '../../shared/design/figma/figma-icon.component';
import { EvidenceService } from '../../evidence/evidence.service';

/**
 * HLT-02: each field of the saved details, recorded or not recorded, kept visually distinct.
 * A missing detail explains that Sanelle can't work it out, and offers a question. The source
 * (original wording, page, date, confirmation) is there, but secondary.
 */
@Component({
  selector: 'app-report-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, RouterLink, FigmaFrameComponent, FigmaIconComponent],
  templateUrl: './report-details.page.html',
})
export class ReportDetailsPage implements OnInit {
  private readonly repo = inject(HealthRepository);
  private readonly evidence = inject(EvidenceService);
  private readonly reportId = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map((p) => p.get('report'))), {
    initialValue: null,
  });

  readonly defs = FINDINGS;
  readonly keys = FINDING_KEYS;
  readonly open = signal<string | null>(null);
  readonly whyUnknown = computed(() => this.evidence.published('C09'));

  ngOnInit() {
    void this.repo.load();
  }

  readonly report = computed(() => {
    const r = this.repo.record();
    const id = this.reportId() ?? r.activeReportId;
    return id ? (r.reports?.find((item) => item.id === id) ?? null) : null;
  });

  readonly findings = computed(() => {
    const source = this.report()?.findings ?? this.repo.record().findings;
    return FINDING_KEYS.map((k): Finding => source[k] ?? { key: k, completeness: { state: 'unknown' } });
  });

  readonly recordedCount = computed(() => this.findings().filter((f) => f.completeness.state !== 'unknown').length);
  readonly editParams = computed(() => (this.report() ? { id: this.report()!.id } : { from: 'current' }));

  ionViewWillEnter() {
    void this.repo.load();
  }

  value = findingValue;
  confirmation = confirmationLabel;
  explain = missingExplanation;

  asked(key: string): boolean {
    return this.repo.record().questions.some((q) => q.findingKey === key);
  }

  toggle(key: string) {
    this.open.set(this.open() === key ? null : key);
  }
}
