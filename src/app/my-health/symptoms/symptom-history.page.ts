import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { impactLine, symptomParts } from '../checkins';
import { SymptomEntry } from '../diagnosis.model';
import { symptomStats, symptomWindow, windowLabel } from './symptom-stats';
import { SymptomDotsComponent } from './symptom-dots.component';
import { localIsoDate, parseLocalDate } from '../../shared/calendar-date';

/** SYM-02: the current 30-day window, one dot a day, then the check-ins themselves. */
@Component({
  selector: 'app-symptom-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, RouterLink, SymptomDotsComponent],
  template: `
    <ion-content>
      <main class="sn-page">
        <div class="sn-top"><a class="sn-back" routerLink="/tabs/health">My health</a></div>
        <header class="sn-title">
          <p class="sn-eyebrow">Symptoms</p>
          <h1>Your last 30 days</h1>
          <p class="sn-lead">{{ range() }}</p>
        </header>
        @if (saved()) {
          <p class="sn-notice" role="status">Check-in saved. It’s in this history and your appointment summary.</p>
        }

        <section class="window" aria-labelledby="w-title">
          <div class="sn-section-head">
            <h2 id="w-title">Current 30-day window</h2>
            <strong class="count"
              >{{ stats().recordedDays }} {{ stats().recordedDays === 1 ? 'day' : 'days' }} recorded</strong
            >
          </div>
          <app-symptom-dots [days]="window()"></app-symptom-dots>
          <p class="sn-hint">Days without a check-in are unknown, not symptom-free.</p>
        </section>

        <div class="sn-actions">
          <a class="sn-btn" [routerLink]="['/health/check-in', today]">{{
            checkedInToday() ? 'Edit today’s check-in' : 'Add a check-in'
          }}</a>
          <a class="sn-btn sn-btn--outline" routerLink="/health/symptoms/summary">See my summary</a>
        </div>

        <section class="sn-section" aria-labelledby="list-title">
          <h2 id="list-title">Check-ins</h2>
          @if (entries().length) {
            <ul class="sn-list">
              @for (e of entries(); track e.date) {
                <li>
                  <a
                    class="sn-row"
                    [routerLink]="['/health/check-in', e.date]"
                    [attr.aria-label]="'Edit check-in for ' + day(e.date)"
                  >
                    <span class="sn-row-text">
                      <span class="sn-row-name">{{ day(e.date) }}</span>
                      <span class="sn-row-sub">{{ summary(e) }}</span>
                      @if (e.treatmentChange) {
                        <span class="sn-row-sub">Treatment change: {{ e.treatmentChange }}</span>
                      }
                    </span>
                    <span class="sn-chev" aria-hidden="true"></span>
                  </a>
                </li>
              }
            </ul>
          } @else {
            <p class="sn-muted">No check-ins yet.</p>
          }
        </section>
      </main>
    </ion-content>
  `,
  styles: [
    `
      .window {
        display: grid;
        gap: 14px;
        border: 1px solid var(--sn-line);
        border-radius: var(--sn-radius-section);
        padding: 16px;
      }
      .window h2 {
        font: 600 1.125rem/1.2 var(--sn-display);
      }
      .count {
        color: var(--sn-berry);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class SymptomHistoryPage {
  private readonly repo = inject(HealthRepository);
  readonly today = localIsoDate();
  readonly saved = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map((p) => p.get('saved'))), {
    initialValue: null,
  });
  readonly window = computed(() => symptomWindow(this.repo.record().symptoms ?? [], this.today));
  readonly stats = computed(() => symptomStats(this.repo.record().symptoms ?? [], this.today));
  readonly range = computed(() => windowLabel(this.stats()));
  readonly entries = computed(() =>
    this.window()
      .filter((d) => d.entry)
      .map((d) => d.entry!)
      .reverse(),
  );
  readonly checkedInToday = computed(() => this.entries().some((e) => e.date === this.today));

  ionViewWillEnter() {
    void this.repo.load();
  }

  day(iso: string): string {
    return iso === this.today
      ? 'Today'
      : new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(
          parseLocalDate(iso),
        );
  }

  summary(e: SymptomEntry): string {
    return [impactLine(e), ...symptomParts(e)].filter(Boolean).join(' · ') || (e.notes ? `“${e.notes}”` : 'A note');
  }
}
