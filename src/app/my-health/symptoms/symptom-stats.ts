import { BLEEDING_LABELS, BleedingLevel, IMPACT_LABELS, ImpactArea, SymptomEntry } from '../diagnosis.model';
import { addDays, localIsoDate, parseLocalDate } from '../../shared/calendar-date';

/**
 * Personal history over a fixed window of calendar days. Rules (evidence C36, C37):
 *  - every count names its denominator: recorded days, or check-ins that answered that field;
 *  - a day without a check-in is unknown, never symptom-free;
 *  - a field left blank is unknown for that day, never "none";
 *  - categories are never turned into blood volume, a diagnosis or a prediction.
 */
export const WINDOW_DAYS = 30;

export type DayMark = BleedingLevel | 'no-bleeding-answer' | 'no-entry';

export const DAY_MARK_LABELS: Record<DayMark, string> = {
  none: 'No bleeding',
  spotting: 'Spotting',
  light: 'Light',
  moderate: 'Moderate',
  heavy: 'Heavy',
  'very-heavy': 'Very heavy',
  'no-bleeding-answer': 'Checked in, bleeding not recorded',
  'no-entry': 'No entry',
};

/** A day's dot, read aloud: "light bleeding", "no entry (unknown)". */
export function dayMarkText(mark: DayMark): string {
  if (mark === 'no-entry') return 'no entry (unknown)';
  if (mark === 'none' || mark === 'no-bleeding-answer') return DAY_MARK_LABELS[mark].toLowerCase();
  return `${DAY_MARK_LABELS[mark].toLowerCase()} bleeding`;
}

export interface WindowDay {
  date: string;
  entry?: SymptomEntry;
  mark: DayMark;
}

/** One dot per calendar day, oldest first, ending today. */
export function symptomWindow(entries: SymptomEntry[], today = localIsoDate(), days = WINDOW_DAYS): WindowDay[] {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - (days - 1));
    const entry = byDate.get(date);
    return { date, entry, mark: entry ? (entry.bleeding ?? 'no-bleeding-answer') : 'no-entry' };
  });
}

export interface SymptomStats {
  from: string;
  to: string;
  days: number;
  recordedDays: number;
  missingDays: number;
  bleeding: { answered: number; heavy: number; byLevel: { level: BleedingLevel; count: number }[] };
  pain: { answered: number; min: number | null; max: number | null; sevenPlus: number };
  tiredness: { answered: number; present: number };
  pressure: { answered: number; present: number };
  impact: { answered: number; areas: { area: ImpactArea; count: number }[] };
  selections: { symptom: string; count: number }[];
  dailyImpacts: { impact: string; count: number }[];
  treatmentChanges: { date: string; text: string }[];
}

export function symptomStats(entries: SymptomEntry[], today = localIsoDate(), days = WINDOW_DAYS): SymptomStats {
  const window = symptomWindow(entries, today, days);
  const recorded = window.filter((d) => d.entry).map((d) => d.entry!);
  const withBleeding = recorded.filter((e) => e.bleeding !== undefined);
  const pain = recorded.filter((e) => e.pain !== undefined).map((e) => e.pain!);
  const impact = recorded.filter((e) => e.affected !== undefined);
  const levels = Object.keys(BLEEDING_LABELS) as BleedingLevel[];
  return {
    from: window[0].date,
    to: window[window.length - 1].date,
    days,
    recordedDays: recorded.length,
    missingDays: days - recorded.length,
    bleeding: {
      answered: withBleeding.length,
      heavy: withBleeding.filter((e) => e.bleeding === 'heavy' || e.bleeding === 'very-heavy').length,
      byLevel: levels
        .map((level) => ({ level, count: withBleeding.filter((e) => e.bleeding === level).length }))
        .filter((l) => l.count > 0),
    },
    pain: {
      answered: pain.length,
      min: pain.length ? Math.min(...pain) : null,
      max: pain.length ? Math.max(...pain) : null,
      sevenPlus: pain.filter((p) => p >= 7).length,
    },
    tiredness: {
      answered: recorded.filter((e) => e.fatigue !== undefined).length,
      present: recorded.filter((e) => e.fatigue && e.fatigue !== 'none').length,
    },
    pressure: {
      answered: recorded.filter((e) => e.bloating !== undefined).length,
      present: recorded.filter((e) => e.bloating && e.bloating !== 'none').length,
    },
    impact: {
      answered: impact.length,
      areas: (Object.keys(IMPACT_LABELS) as ImpactArea[])
        .map((area) => ({ area, count: impact.filter((e) => e.affected!.includes(area)).length }))
        .filter((a) => a.count > 0),
    },
    selections: (['Bleeding', 'Pain', 'Pelvic pressure', 'Low energy'] as const)
      .map((symptom) => ({
        symptom,
        count: recorded.filter(
          (e) =>
            e.observedSymptoms?.includes(symptom) &&
            (symptom === 'Pain'
              ? e.pain === undefined
              : symptom === 'Low energy'
                ? e.fatigue === undefined
                : symptom === 'Pelvic pressure'
                  ? e.bloating === undefined
                  : e.bleeding === undefined),
        ).length,
      }))
      .filter((item) => item.count > 0),
    dailyImpacts: (['No change', 'Slowed me down', 'Changed my plans', 'Couldn’t do usual activities'] as const)
      .map((impact) => ({ impact, count: recorded.filter((e) => e.dailyImpact === impact).length }))
      .filter((item) => item.count > 0),
    treatmentChanges: recorded
      .filter((e) => e.treatmentChange?.trim())
      .map((e) => ({ date: e.date, text: e.treatmentChange!.trim() })),
  };
}

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/**
 * The required SYM-03 sentence: "You checked in on X of 30 days. Of the Y check-ins with a
 * bleeding answer, Z recorded heavy or very heavy bleeding."
 */
export function statsSentence(s: SymptomStats): string[] {
  const lines = [`You checked in on ${s.recordedDays} of ${s.days} days.`];
  if (s.bleeding.answered) {
    lines.push(
      `Of the ${plural(s.bleeding.answered, 'check-in')} with a bleeding answer, ${s.bleeding.heavy} recorded heavy or very heavy bleeding.`,
    );
  } else if (s.recordedDays) {
    lines.push('None of your check-ins in this window has a bleeding answer.');
  }
  return lines;
}

/** Further lines, each with its own denominator. */
export function detailLines(s: SymptomStats): string[] {
  const lines: string[] = [];
  if (s.pain.answered) {
    const range = s.pain.min === s.pain.max ? `at ${s.pain.min}` : `from ${s.pain.min} to ${s.pain.max}`;
    lines.push(
      `Pain was recorded on ${plural(s.pain.answered, 'check-in')}, ${range} out of 10` +
        (s.pain.sevenPlus ? `; 7 or more on ${s.pain.sevenPlus}.` : '.'),
    );
  }
  if (s.tiredness.answered)
    lines.push(
      `Of ${plural(s.tiredness.answered, 'check-in')} answering tiredness, ${s.tiredness.present} recorded some.`,
    );
  if (s.pressure.answered)
    lines.push(
      `Of ${plural(s.pressure.answered, 'check-in')} answering pressure or bloating, ${s.pressure.present} recorded some.`,
    );
  if (s.impact.answered) {
    const parts = s.impact.areas.map((a) => `${IMPACT_LABELS[a.area].toLowerCase()} on ${a.count}`);
    lines.push(
      parts.length
        ? `Of ${plural(s.impact.answered, 'check-in')} answering “effect on my day”: ${parts.join(', ')}.`
        : `On the ${plural(s.impact.answered, 'check-in')} answering “effect on my day”, nothing was affected.`,
    );
  }
  for (const observation of s.selections)
    lines.push(
      `${observation.symptom} selected on ${plural(observation.count, 'recorded day')} of ${s.recordedDays}. No severity inferred; unselected symptoms remain unknown.`,
    );
  const impactAnswers = s.dailyImpacts.reduce((sum, item) => sum + item.count, 0);
  for (const item of s.dailyImpacts)
    lines.push(`“${item.impact}” on ${item.count} of ${plural(impactAnswers, 'check-in')} with a daily-impact answer.`);
  return lines;
}

export function windowLabel(s: Pick<SymptomStats, 'from' | 'to'>): string {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(parseLocalDate(iso));
  return `${fmt(s.from)} to ${fmt(s.to)}`;
}

/** Which published explanations apply to this history (handoff journey 6, contextual learning). */
export function contextualEvidence(s: SymptomStats): { id: string; trigger: string }[] {
  const out: { id: string; trigger: string }[] = [];
  const anyImpact =
    s.selections.length > 0 ||
    s.dailyImpacts.some((i) => i.impact !== 'No change') ||
    s.impact.areas.length > 0 ||
    s.pain.answered > 0 ||
    s.pressure.present > 0;
  if (anyImpact) out.push({ id: 'C11', trigger: 'You recorded symptoms or their effect on your day' });
  if (s.bleeding.heavy > 0 || s.tiredness.present > 0)
    out.push({ id: 'C12', trigger: 'You recorded heavy bleeding or tiredness' });
  if (s.missingDays > 0) out.push({ id: 'C37', trigger: `${s.missingDays} days in this window have no check-in` });
  out.push({ id: 'C14', trigger: 'Preparing for an appointment' });
  return out;
}
