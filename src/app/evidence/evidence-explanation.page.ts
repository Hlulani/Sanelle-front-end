import { DialogFocusDirective } from '../shared/design/figma/dialog-focus.directive';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { FigmaIconComponent } from '../shared/design/figma/figma-icon.component';
import { FoodPage } from '../food/food.page';
import { TodayPage } from '../today/today.page';
import { HealthPage } from '../my-health/health.page';
import { ReportDetailsPage } from '../my-health/report/report-details.page';
import { EvidenceService } from './evidence.service';
import { OUTCOME_KIND_LABELS } from './evidence.model';

/** A published explanation, with who it's about, its sources and its limits. Nothing else is shown. */
@Component({
  selector: 'app-evidence-explanation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [DialogFocusDirective, FigmaIconComponent, FoodPage, TodayPage, HealthPage, ReportDetailsPage],
  templateUrl: './evidence-explanation.page.html',
})
export class EvidenceExplanationPage {
  private readonly route = inject(ActivatedRoute);
  readonly origin = this.route.snapshot.queryParamMap.get('from');
  readonly fromFood = this.origin === 'food';
  private readonly evidence = inject(EvidenceService);
  private readonly router = inject(Router);
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  readonly outcomeLabels = OUTCOME_KIND_LABELS;
  /** Patients only ever see published entries. */
  readonly entry = computed(() => this.evidence.published(this.id()));

  back() {
    if (this.origin === 'details') {
      void this.router.navigate(['/health/details'], {
        queryParams: { report: this.route.snapshot.queryParamMap.get('report') },
      });
    } else if (this.origin === 'health') {
      void this.router.navigate(['/tabs/health'], {
        queryParams: { view: this.route.snapshot.queryParamMap.get('view') },
      });
    } else {
      void this.router.navigateByUrl(this.fromFood ? '/tabs/food' : '/tabs/today');
    }
  }
}
