import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { FINDINGS, FINDING_KEYS, Finding, FindingKey, findingOrUnknown } from '../diagnosis.model';
import { FindingStatusComponent } from '../finding-status.component';

interface Gap {
  key: FindingKey;
  label: string;
  question: string;
  saved: boolean;
}

/**
 * The end of the diagnosis questions, and Sanelle's core idea in one screen: what the report
 * says, what it leaves open, and the question each blank became. Blanks are never filled in.
 */
@Component({
  selector: 'app-recorded',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, IonContent, FindingStatusComponent],
  templateUrl: './recorded.page.html',
  styleUrls: ['./recorded.page.scss'],
})
export class RecordedPage {
  private repo = inject(HealthRepository);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private readonly findings = computed(() => FINDING_KEYS.map((k) => findingOrUnknown(this.repo.record(), k)));
  readonly known = computed(() =>
    this.findings()
      .filter((f) => f.completeness.state !== 'unknown')
      .map((f): { key: FindingKey; label: string; finding: Finding } => ({
        key: f.key,
        label: FINDINGS[f.key].label,
        finding: f,
      })),
  );
  readonly missing = computed(() => {
    const asked = new Set(this.repo.record().questions.map((q) => q.text.toLowerCase()));
    return this.findings()
      .filter((f) => f.completeness.state === 'unknown')
      .map((f): Gap => {
        const question = FINDINGS[f.key].questionIfUnknown;
        return { key: f.key, label: FINDINGS[f.key].label, question, saved: asked.has(question.toLowerCase()) };
      });
  });
  readonly questionCount = computed(() => this.repo.record().questions.length);

  ask(gap: Gap) {
    void this.repo.addQuestion(gap.question, gap.key);
  }

  ionViewWillEnter() {
    void this.repo.load();
  }

  done() {
    const from = this.route.snapshot.queryParamMap.get('from');
    this.router.navigateByUrl(from === 'today' ? '/tabs/today' : '/tabs/health', { replaceUrl: true });
  }
}
