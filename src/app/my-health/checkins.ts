import { BLEEDING_LABELS, IMPACT_LABELS, ImpactArea, LEVEL_LABELS, SymptomEntry } from './diagnosis.model';

/**
 * Plain counts over the check-ins someone recorded. Ordinary code, no generated text.
 *
 * Rules, so nothing reads as more than the records support:
 * - The denominator is always the number of check-ins, never the days in the range.
 * - Days without a check-in are unknown. They never count as symptom-free, zero pain or improvement.
 * - Observations need at least MIN_CHECKINS_FOR_OBSERVATIONS check-ins in the window. One entry
 *   is shown as itself, not summarised.
 * - Only descriptive counts and co-occurrence ("on 2 of those days…"). No comparisons between
 *   periods, trends, recurring patterns or thresholds: those would need regular check-ins over
 *   several periods and a clinically reviewed definition, and neither exists yet.
 * - Nothing here suggests a cause, including treatment changes, which are listed by date only.
 */
export const MIN_CHECKINS_FOR_OBSERVATIONS = 2;

export function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Check-ins from the last `days` days (today included), newest first. */
export function checkinsInWindow(entries: SymptomEntry[], days: number, today = new Date()): SymptomEntry[] {
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const from = isoDay(start);
  const to = isoDay(today);
  return entries.filter((e) => e.date >= from && e.date <= to).sort((a, b) => b.date.localeCompare(a.date));
}

export function coverageLine(count: number, days: number): string {
  return `${count} ${count === 1 ? 'check-in' : 'check-ins'} recorded in the last ${days} days.`;
}

/** What affected daily life, said plainly. It leads an entry because it's what matters most to people. */
export function impactLine(e: SymptomEntry): string | null {
  if (e.affected === undefined) return null;
  if (!e.affected.length) return 'Didn’t get in the way of sleep, work or daily activities';
  const names = e.affected.map((a) => IMPACT_LABELS[a]);
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  return `${list} ${e.affected.length > 1 ? 'were' : 'was'} affected`.replace(/^(.)/, (c) => c.toUpperCase());
}

/** The symptoms recorded in one entry, e.g. ["Heavy bleeding", "Pain 6/10"]. "None" levels are left out. */
export function symptomParts(e: SymptomEntry): string[] {
  const parts: string[] = [];
  if (e.bleeding !== undefined) parts.push(e.bleeding === 'none' ? 'No bleeding' : `${BLEEDING_LABELS[e.bleeding]} bleeding`);
  if (e.pain !== undefined) parts.push(`Pain ${e.pain}/10`);
  if (e.bloating !== undefined && e.bloating !== 'none') parts.push(`${LEVEL_LABELS[e.bloating]} pressure or bloating`);
  if (e.fatigue !== undefined && e.fatigue !== 'none') parts.push(`${LEVEL_LABELS[e.fatigue]} tiredness`);
  return parts;
}

type Concern = { key: 'tiredness' | 'bleeding' | 'pain' | 'bloating'; label: string; present: (e: SymptomEntry) => boolean };

const CONCERNS: Concern[] = [
  { key: 'tiredness', label: 'tiredness', present: (e) => !!e.fatigue && e.fatigue !== 'none' },
  { key: 'bleeding', label: 'heavy or very heavy bleeding', present: (e) => e.bleeding === 'heavy' || e.bleeding === 'very-heavy' },
  { key: 'bloating', label: 'pressure or bloating', present: (e) => !!e.bloating && e.bloating !== 'none' },
];

/**
 * Sentences such as "You recorded tiredness on 4 of your 6 check-ins. On 2 of those days, you said
 * work or study was affected." Empty when there are fewer than MIN_CHECKINS_FOR_OBSERVATIONS.
 */
export function observations(window: SymptomEntry[]): string[] {
  const n = window.length;
  if (n < MIN_CHECKINS_FOR_OBSERVATIONS) return [];
  const lines: string[] = [];

  const mentioned = new Set<ImpactArea>();
  for (const c of CONCERNS) {
    const days = window.filter(c.present);
    if (!days.length) continue;
    let line = `You recorded ${c.label} on ${days.length} of your ${n} check-ins.`;
    const impact = mostCommonImpact(days);
    if (impact) {
      line += ` On ${impact.count} of those days, you said ${IMPACT_LABELS[impact.area].toLowerCase()} was affected.`;
      mentioned.add(impact.area);
    }
    lines.push(line);
  }

  const pain = window.filter((e) => e.pain !== undefined).map((e) => e.pain as number);
  if (pain.length) {
    const min = Math.min(...pain);
    const max = Math.max(...pain);
    lines.push(`Pain was recorded on ${pain.length} of your ${n} check-ins, ${min === max ? `at ${min}` : `from ${min} to ${max}`} out of 10.`);
  }

  const impactRecorded = window.filter((e) => e.affected !== undefined);
  // An area already described alongside a symptom isn't repeated on its own.
  for (const area of (Object.keys(IMPACT_LABELS) as ImpactArea[]).filter((a) => !mentioned.has(a))) {
    const count = impactRecorded.filter((e) => e.affected!.includes(area)).length;
    if (count) lines.push(`${IMPACT_LABELS[area]} was affected on ${count} of your ${n} check-ins.`);
  }
  return lines;
}

function mostCommonImpact(days: SymptomEntry[]): { area: ImpactArea; count: number } | null {
  let best: { area: ImpactArea; count: number } | null = null;
  for (const area of Object.keys(IMPACT_LABELS) as ImpactArea[]) {
    const count = days.filter((e) => e.affected?.includes(area)).length;
    if (count && (!best || count > best.count)) best = { area, count };
  }
  return best;
}

