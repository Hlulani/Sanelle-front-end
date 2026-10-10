import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { EvidenceService } from '../../evidence/evidence.service';
import { CatalogEntry } from '../../evidence/evidence.model';
import { contextualEvidence, detailLines, statsSentence, symptomStats, windowLabel } from './symptom-stats';
import { localIsoDate } from '../../shared/calendar-date';

/**
 * SYM-03: personal history with every denominator visible, then published explanations chosen by
 * what was recorded. Never a volume, an anaemia diagnosis or a comparison with other people.
 */
@Component({
  selector: 'app-symptom-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, RouterLink],
  template: `
    <ion-content>
      <main class="sn-page">
        <div class="sn-top"><a class="sn-back" routerLink="/health/symptoms">Symptoms</a></div>
        <header class="sn-title">
          <p class="sn-eyebrow">Personal history · not research</p>
          <h1>Your 30-day summary</h1>
          <p class="sn-lead">{{ range() }}</p>
        </header>

        @if (stats().recordedDays) {
          <section class="sn-panel" aria-label="Summary">
            @for (line of headline(); track line) {
              <p class="big">{{ line }}</p>
            }
            @for (line of details(); track line) {
              <p>{{ line }}</p>
            }
            <p class="sn-hint">
              {{ stats().missingDays }} of {{ stats().days }} days have no check-in; they’re unknown, not symptom-free.
            </p>
          </section>
          @if (stats().treatmentChanges.length) {
            <section class="sn-section">
              <h2>Treatment changes you noted</h2>
              <ul class="plain">
                @for (t of stats().treatmentChanges; track t.date) {
                  <li>{{ t.date }}: {{ t.text }}</li>
                }
              </ul>
              <p class="sn-hint">Listed by date only. Sanelle doesn’t judge whether they changed anything.</p>
            </section>
          }
        } @else {
          <div class="sn-missing">
            <p><strong>0 of 30 days recorded; remaining days unknown.</strong></p>
            <a class="sn-btn" [routerLink]="['/health/check-in', today]">Add check-in</a>
          </div>
        }

        <div class="sn-actions">
          <a class="sn-btn" routerLink="/tabs/appointment">Prepare for a visit</a>
          <a class="sn-btn sn-btn--outline" routerLink="/health/results">Add a clinical result</a>
        </div>

        @if (learning().length) {
          <section class="sn-section sn-section--line" aria-labelledby="learn-title">
            <h2 id="learn-title">Worth knowing</h2>
            @for (l of learning(); track l.entry.id) {
              <article class="sn-box">
                <p class="sn-hint">{{ l.trigger }}</p>
                <h3>{{ l.entry.title }}</h3>
                <p>{{ l.entry.explanation }}</p>
                <a class="sn-link" [routerLink]="['/learn', l.entry.claimId]">Sources and limits</a>
              </article>
            }
          </section>
        }
      </main>
    </ion-content>
  `,
  styles: [
    `
      .big {
        font: 700 1.0625rem/1.45 var(--sn-body);
      }
      h3 {
        font: 800 1rem/1.3 var(--sn-body);
      }
      .plain {
        margin: 0;
        padding-left: 18px;
      }
    `,
  ],
})
export class SymptomSummaryPage {
  private readonly repo = inject(HealthRepository);
  private readonly evidence = inject(EvidenceService);
  readonly today = localIsoDate();
  readonly stats = computed(() => symptomStats(this.repo.record().symptoms ?? [], this.today));
  readonly range = computed(() => windowLabel(this.stats()));
  readonly headline = computed(() => statsSentence(this.stats()));
  readonly details = computed(() => detailLines(this.stats()));
  /** Only published entries are shown to patients. */
  readonly learning = computed(() =>
    contextualEvidence(this.stats())
      .map((c) => ({ trigger: c.trigger, entry: this.evidence.published(c.id) }))
      .filter((l): l is { trigger: string; entry: CatalogEntry } => !!l.entry),
  );

  ionViewWillEnter() {
    void this.repo.load();
  }
}
