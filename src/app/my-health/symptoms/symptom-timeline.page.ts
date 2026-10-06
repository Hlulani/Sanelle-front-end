import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { SymptomEntry } from '../diagnosis.model';
import { checkinsInWindow, coverageLine, impactLine, observations, symptomParts } from '../checkins';
import { addDays, localIsoDate, parseLocalDate } from '../../shared/calendar-date';

/** "Today", "Yesterday" or "Sat 3 Oct". */
export function dayLabel(iso: string, today = new Date()): string {
  const todayIso = localIsoDate(today);
  if (iso === todayIso) return 'Today';
  if (iso === addDays(todayIso, -1)) return 'Yesterday';
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(parseLocalDate(iso));
}

/**
 * Symptom history: only the check-ins she recorded, with what they mean for her, never a wall of
 * empty days. Coverage is stated once, and unrecorded days are explicitly unknown.
 */
@Component({
  selector: 'app-symptom-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, IonContent],
  templateUrl: './symptom-timeline.page.html',
  styleUrls: ['./symptom-timeline.page.scss'],
})
export class SymptomTimelinePage {
  private repo = inject(HealthRepository);
  private router = inject(Router);

  readonly span = signal(14);
  questionFor(e: SymptomEntry): string {
    const details = [...symptomParts(e), impactLine(e), e.notes].filter(Boolean).join('; ');
    return `On ${e.date} I noted: ${details || e.treatmentChange || 'a change I want to discuss'}. What should we discuss or monitor?`;
  }
  readonly todayIso = localIsoDate();
  readonly entries = computed(() => checkinsInWindow(this.repo.record().symptoms ?? [], this.span()));
  readonly coverage = computed(() => coverageLine(this.entries().length, this.span()));
  readonly observations = computed(() => observations(this.entries()));
  readonly loggedToday = computed(() => this.entries().some((e) => e.date === this.todayIso));

  ionViewWillEnter() {
    void this.repo.load();
  }

  label(e: SymptomEntry): string {
    return dayLabel(e.date);
  }

  impact(e: SymptomEntry): string | null {
    return impactLine(e);
  }

  parts(e: SymptomEntry): string[] {
    return symptomParts(e);
  }

  back() {
    this.router.navigateByUrl('/tabs/health');
  }

  toggleSpan() {
    this.span.set(this.span() === 14 ? 30 : 14);
  }
}
