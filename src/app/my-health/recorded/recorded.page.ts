import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { FINDINGS, FINDING_KEYS, findingOrUnknown } from '../diagnosis.model';

/**
 * The end of the diagnosis questions: what's recorded, what's still blank, and how many
 * questions are ready for the appointment. Blanks turning into questions is the point.
 */
@Component({
  selector: 'app-recorded',
  standalone: true,
  imports: [RouterLink, IonContent],
  templateUrl: './recorded.page.html',
  styleUrls: ['./recorded.page.scss'],
})
export class RecordedPage {
  private repo = inject(HealthRepository);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private readonly findings = computed(() => FINDING_KEYS.map((k) => findingOrUnknown(this.repo.record(), k)));
  readonly recorded = computed(() => this.findings().filter((f) => f.completeness.state !== 'unknown').map((f) => FINDINGS[f.key].label));
  readonly notRecorded = computed(() => this.findings().filter((f) => f.completeness.state === 'unknown').map((f) => FINDINGS[f.key].label));
  readonly questionCount = computed(() => this.repo.record().questions.length);

  ionViewWillEnter() {
    void this.repo.load();
  }

  done() {
    const from = this.route.snapshot.queryParamMap.get('from');
    this.router.navigateByUrl(from === 'today' ? '/tabs/today' : '/tabs/health', { replaceUrl: true });
  }
}
