import { DialogFocusDirective } from '../../shared/design/figma/dialog-focus.directive';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaIconComponent } from '../../shared/design/figma/figma-icon.component';
import { FigmaFrameComponent } from '../../shared/design/figma/figma-frame.component';
import { HealthPage } from '../health.page';
import { ReportDetailsPage } from './report-details.page';
import { HealthRepository } from '../health-repository';
import {
  FINDINGS,
  FINDING_KEYS,
  FindingKey,
  SUGGESTED_FROM_MISSING_DETAIL,
  missingExplanation,
} from '../diagnosis.model';

/** HLT-03: a suggested question she can edit. Nothing is added unless she saves it. */
@Component({
  selector: 'app-suggested-question',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [DialogFocusDirective, FormsModule, FigmaIconComponent, HealthPage, ReportDetailsPage],
  templateUrl: './suggested-question.page.html',
})
export class SuggestedQuestionPage implements OnInit {
  private readonly repo = inject(HealthRepository);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly fromDetails = this.route.snapshot.queryParamMap.get('from') === 'details';
  private readonly param = inject(ActivatedRoute).snapshot.paramMap.get('key') as FindingKey;

  readonly key = FINDING_KEYS.includes(this.param) ? this.param : 'location';
  readonly def = computed(() => FINDINGS[this.key]);
  readonly explanation = computed(() => missingExplanation(this.key));
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  text =
    this.key === 'location'
      ? 'Where are my fibroids located?'
      : this.key === 'figo'
        ? 'What FIGO type are my fibroids?'
        : this.key === 'cavity'
          ? 'Do my fibroids affect the uterine cavity?'
          : FINDINGS[this.key].questionIfUnknown;

  close() {
    if (this.fromDetails) {
      void this.router.navigate(['/health/details'], {
        queryParams: { report: this.route.snapshot.queryParamMap.get('report') },
      });
    } else {
      void this.router.navigateByUrl('/tabs/health');
    }
  }
  ngOnInit() {
    void this.repo.load();
  }

  async save() {
    const text = this.text.trim();
    if (!text) {
      this.error.set('Write the question you’d like to ask, or choose “Not now”.');
      return;
    }
    this.saving.set(true);
    try {
      await this.repo.addQuestion(text, this.key, SUGGESTED_FROM_MISSING_DETAIL);
      void this.router.navigate(['/tabs/appointment'], { queryParams: { added: 1 }, replaceUrl: true });
    } catch {
      this.error.set('Your question couldn’t be saved. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }
}
