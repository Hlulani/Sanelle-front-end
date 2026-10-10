import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { FigmaIconComponent } from '../shared/design/figma/figma-icon.component';
import { EvidenceService } from './evidence.service';
import { CatalogEntry, EvidenceTopic, TOPIC_LABELS } from './evidence.model';

/** The order topics appear in: understanding first, then daily life, then food. */
const TOPIC_ORDER: EvidenceTopic[] = [
  'diagnosis',
  'symptoms',
  'measurement',
  'appointment',
  'treatment',
  'reproduction',
  'growth',
  'food',
  'population',
  'biology',
  'access',
  'research',
];

/**
 * Learn: every published explanation, by topic. Only published entries are listed; topics still
 * in review simply don't appear yet.
 */
@Component({
  selector: 'app-learn',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, RouterLink, FigmaFrameComponent, FigmaIconComponent],
  template: `<ion-content
    ><app-figma-frame active="health" title="What the research says" label="Learn">
      <p class="fine-print learn-intro">
        Plain-language summaries from Sanelle’s research library. Each one shows who was studied, its sources and its
        limits. Topics still being reviewed aren’t shown yet.
      </p>
      @for (group of groups; track group.topic) {
        <section class="learn-topic" [attr.aria-labelledby]="'topic-' + group.topic">
          <div class="section-title">
            <div>
              <p class="eyebrow">
                {{ group.entries.length }} {{ group.entries.length === 1 ? 'summary' : 'summaries' }}
              </p>
              <h2 [id]="'topic-' + group.topic">{{ group.label }}</h2>
            </div>
          </div>
          @for (e of group.entries; track e.id) {
            <button class="claim-row" [routerLink]="['/learn', e.claimId ?? e.id]" [queryParams]="{ from: 'learn' }">
              <div class="claim-label">
                {{ group.short }}<br /><span>{{ e.claimId }}</span>
              </div>
              <div>
                <strong>{{ e.title }}</strong>
                <p>{{ e.outcome }}</p>
              </div>
              <svg figmaIcon="arrow" />
            </button>
          }
        </section>
      } @empty {
        <div class="report-empty">
          <strong>Research summaries are being reviewed.</strong>
          <p>They’ll appear here once they’re published.</p>
        </div>
      }
      <button class="secondary wide" routerLink="/tabs/health">Back to My health</button>
    </app-figma-frame></ion-content
  >`,
})
export class LearnPage {
  private readonly evidence = inject(EvidenceService);

  readonly groups = TOPIC_ORDER.map((topic) => ({
    topic,
    label: TOPIC_LABELS[topic],
    short: TOPIC_LABELS[topic].split(' ')[0],
    entries: this.evidence.publishedIn(topic) as CatalogEntry[],
  })).filter((g) => g.entries.length);
}
