import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { BLEEDING_LABELS, IMPACT_LABELS, LEVEL_LABELS, SymptomEntry } from '../diagnosis.model';

export interface TimelineDay {
  date: string;
  label: string;
  entry?: SymptomEntry;
  parts: string[];
}

function iso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Short, factual description of one entry, e.g. "Heavy bleeding · Pain 6/10 · Work affected". */
export function describeEntry(e: SymptomEntry): string[] {
  const parts: string[] = [];
  if (e.bleeding !== undefined) parts.push(e.bleeding === 'none' ? 'No bleeding' : `${BLEEDING_LABELS[e.bleeding]} bleeding`);
  if (e.pain !== undefined) parts.push(`Pain ${e.pain}/10`);
  if (e.bloating !== undefined && e.bloating !== 'none') parts.push(`${LEVEL_LABELS[e.bloating]} bloating`);
  if (e.fatigue !== undefined && e.fatigue !== 'none') parts.push(`${LEVEL_LABELS[e.fatigue]} tiredness`);
  if (e.affected?.length) parts.push(e.affected.map((a) => IMPACT_LABELS[a]).join(', ') + ' affected');
  if (e.treatmentChange?.trim()) parts.push('Treatment change');
  if (!parts.length && e.notes?.trim()) parts.push('Note');
  return parts;
}

/** Builds the last `n` days, newest first. Days without an entry stay empty. */
export function buildTimeline(entries: SymptomEntry[], n: number, today = new Date()): TimelineDay[] {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const out: TimelineDay[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = iso(d);
    const entry = byDate.get(key);
    out.push({
      date: key,
      label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(d),
      entry,
      parts: entry ? describeEntry(entry) : [],
    });
  }
  return out;
}

@Component({
  selector: 'app-symptom-timeline',
  standalone: true,
  imports: [RouterLink, IonContent],
  templateUrl: './symptom-timeline.page.html',
  styleUrls: ['./symptom-timeline.page.scss'],
})
export class SymptomTimelinePage {
  private repo = inject(HealthRepository);
  private router = inject(Router);

  readonly span = signal(14);
  readonly days = computed(() => buildTimeline(this.repo.record().symptoms ?? [], this.span()));
  readonly loggedCount = computed(() => this.days().filter((d) => d.entry).length);

  ionViewWillEnter() {
    void this.repo.load();
  }

  back() {
    this.router.navigateByUrl('/tabs/health');
  }

  showMore() {
    this.span.set(this.span() === 14 ? 30 : 14);
  }
}
