import { AppointmentQuestion, HealthRecord, SymptomEntry } from '../my-health/diagnosis.model';
import { symptomStats, symptomWindow, windowLabel } from '../my-health/symptoms/symptom-stats';
import { localIsoDate, parseLocalDate } from '../shared/calendar-date';

/**
 * Reads her own records with her: suggests questions from her patterns, matches what she wrote
 * to published explanations, and drafts a visit brief. Everything here is a suggestion she edits
 * or ignores; nothing is saved for her.
 *
 * These are rules, not a language model. The same outputs are the contract an AI drafter must
 * meet later: every count names its denominator, nothing names a cause or a diagnosis, and only
 * published explanations can be offered.
 */

export const SUGGESTED_FROM_CHECKINS = 'Suggested from my check-ins.';

export interface SuggestedQuestion {
  text: string;
  /** Why it was suggested, with the counts it rests on. */
  why: string;
}

export interface MatchedExplanation {
  claimId: string;
  /** Her own words that matched, quoted from a note. */
  quote: string;
  date: string;
}

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

export type Symptom = 'bleeding' | 'pain' | 'pressure' | 'energy';
const SYMPTOM_WORDS: Record<Symptom, string> = {
  bleeding: 'bleeding',
  pain: 'pain',
  pressure: 'pelvic pressure',
  energy: 'low energy',
};

/** Whether a check-in recorded the symptom, from either the quick check-in or older detailed entries. */
export function noticed(e: SymptomEntry, s: Symptom): boolean {
  switch (s) {
    case 'bleeding':
      return (e.bleeding !== undefined && e.bleeding !== 'none') || !!e.observedSymptoms?.includes('Bleeding');
    case 'pain':
      return (e.pain ?? 0) > 0 || !!e.observedSymptoms?.includes('Pain');
    case 'pressure':
      return (!!e.bloating && e.bloating !== 'none') || !!e.observedSymptoms?.includes('Pelvic pressure');
    default:
      return (!!e.fatigue && e.fatigue !== 'none') || !!e.observedSymptoms?.includes('Low energy');
  }
}

const DISRUPTIVE = new Set(['Changed my plans', 'Couldn’t do usual activities']);

/** The day was disrupted: her own answer, or an affected area on older entries. */
function disrupted(e: SymptomEntry): boolean {
  return (e.dailyImpact !== undefined && DISRUPTIVE.has(e.dailyImpact)) || !!e.affected?.length;
}

function impactRecorded(e: SymptomEntry): boolean {
  return e.dailyImpact !== undefined || e.affected !== undefined;
}

function recordedEntries(record: HealthRecord, today: string): SymptomEntry[] {
  return symptomWindow(record.symptoms ?? [], today)
    .filter((d) => d.entry)
    .map((d) => d.entry!);
}

/** Up to three questions drawn from patterns in the last 30 days, skipping ones she already saved. */
export function suggestQuestions(record: HealthRecord, today = localIsoDate()): SuggestedQuestion[] {
  const stats = symptomStats(record.symptoms ?? [], today);
  if (!stats.recordedDays) return [];
  const recorded = recordedEntries(record, today);
  const n = recorded.length;
  const withImpact = recorded.filter(impactRecorded);
  const out: SuggestedQuestion[] = [];

  if (stats.bleeding.heavy >= 2) {
    out.push({
      text: 'What could help with heavy bleeding, and what should make me seek help sooner?',
      why: `You recorded heavy or very heavy bleeding on ${stats.bleeding.heavy} of the ${plural(stats.bleeding.answered, 'check-in')} with a bleeding answer.`,
    });
  }

  const pain = recorded.filter((e) => noticed(e, 'pain'));
  if (pain.length >= 2) {
    const disruptive = pain.filter(disrupted).length;
    out.push({
      text: disruptive
        ? 'What could help with pain that disrupts my days?'
        : 'What could help with the pain I keep noticing?',
      why:
        `You recorded pain on ${pain.length} of your ${plural(n, 'check-in')}` +
        (disruptive ? `, and on ${disruptive} of those days it changed your plans or stopped usual activities.` : '.'),
    });
  }

  const disruptedDays = withImpact.filter(disrupted).length;
  if (disruptedDays >= 2 && !out.some((q) => q.text.includes('disrupts'))) {
    out.push({
      text: 'How could we reduce how much my symptoms disrupt my days?',
      why: `On ${disruptedDays} of the ${plural(withImpact.length, 'check-in')} that recorded the effect on your day, symptoms changed your plans or stopped usual activities.`,
    });
  }

  const pressure = recorded.filter((e) => noticed(e, 'pressure')).length;
  if (pressure >= 2) {
    out.push({
      text: 'What could explain the pelvic pressure I notice, and what would help?',
      why: `You recorded pelvic pressure on ${pressure} of your ${plural(n, 'check-in')}.`,
    });
  }

  const energy = recorded.filter((e) => noticed(e, 'energy')).length;
  if (!(record.results ?? []).length && (energy >= 2 || stats.bleeding.heavy >= 2)) {
    out.push({
      text: 'Would a blood test, for example for iron or haemoglobin, be useful for me?',
      why:
        (energy >= 2
          ? `You recorded low energy on ${energy} of your ${plural(n, 'check-in')}`
          : `You recorded heavy bleeding on ${stats.bleeding.heavy} check-ins`) +
        ' and no blood result is saved. Check-ins can’t show anaemia; a blood test can.',
    });
  }

  const change = stats.treatmentChanges.at(-1);
  if (change) {
    out.push({
      text: `How will we know whether “${change.text}” is helping, and when should we review it?`,
      why: `You noted this treatment change on ${dayLabel(change.date)}.`,
    });
  }

  const saved = new Set(record.questions.map((q: AppointmentQuestion) => q.text.trim().toLowerCase()));
  return out.filter((q) => !saved.has(q.text.toLowerCase())).slice(0, 3);
}

/**
 * Words people use for an experience, mapped to the explanation that fits it. Only entries
 * published in the catalogue are ever shown; the caller checks that.
 */
const NOTE_MATCHES: { claimId: string; words: string[] }[] = [
  {
    claimId: 'C36',
    words: [
      'flood',
      'flooding',
      'clot',
      'clots',
      'soaked',
      'soaking',
      'leak',
      'leaked',
      'pad',
      'pads',
      'tampon',
      'tampons',
    ],
  },
  {
    claimId: 'C12',
    words: [
      'dizzy',
      'dizziness',
      'faint',
      'fainted',
      'lightheaded',
      'exhausted',
      'breathless',
      'out of breath',
      'pale',
    ],
  },
  {
    claimId: 'C11',
    words: [
      'cramp',
      'cramps',
      'pressure',
      'bloated',
      'bloating',
      'back pain',
      'bladder',
      'peeing',
      'wee',
      'heavy feeling',
    ],
  },
  {
    claimId: 'C14',
    words: ['dismissed', 'ignored', 'not listened', 'told it was normal', 'worried', 'anxious', 'scared'],
  },
  { claimId: 'C17', words: ['diet', 'dairy', 'soy', 'sugar', 'gluten', 'detox'] },
  { claimId: 'C18', words: ['vitamin d'] },
  { claimId: 'C19', words: ['green tea', 'egcg'] },
];

/** Matches her notes and treatment changes to explanations, quoting the words that matched. */
export function matchExplanations(
  record: HealthRecord,
  isPublished: (claimId: string) => boolean,
  today = localIsoDate(),
): MatchedExplanation[] {
  const entries = symptomWindow(record.symptoms ?? [], today)
    .filter((d) => d.entry)
    .map((d) => d.entry!)
    .reverse();
  const out: MatchedExplanation[] = [];
  for (const { claimId, words } of NOTE_MATCHES) {
    if (!isPublished(claimId)) continue;
    for (const e of entries) {
      const text = [e.notes, e.treatmentChange].filter(Boolean).join(' · ');
      const found = words
        .map((w) => ({ w, m: new RegExp(`\\b${w.replace(/ /g, '\\s+')}\\b`, 'i').exec(text) }))
        .find((x) => x.m);
      if (found?.m) {
        out.push({ claimId, quote: excerpt(text, found.m.index, found.m[0].length), date: e.date });
        break;
      }
    }
  }
  return out.slice(0, 3);
}

function excerpt(text: string, at: number, length: number): string {
  // Short notes are quoted whole; only long ones are trimmed around the matching words.
  if (text.length <= 120) return text;
  const start = Math.max(0, text.lastIndexOf(' ', Math.max(0, at - 24)) + 1);
  const endSpace = text.indexOf(' ', at + length + 24);
  const end = endSpace < 0 ? text.length : endSpace;
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

/** A short draft of her main concern, from her own records. She edits it before saving. */
export function draftVisitBrief(record: HealthRecord, today = localIsoDate()): string | null {
  const stats = symptomStats(record.symptoms ?? [], today);
  if (!stats.recordedDays) return null;
  const recorded = recordedEntries(record, today);
  const n = recorded.length;
  const counts = (Object.keys(SYMPTOM_WORDS) as Symptom[])
    .map((s) => ({ s, count: recorded.filter((e) => noticed(e, s)).length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const withImpact = recorded.filter(impactRecorded);
  const disruptedDays = withImpact.filter(disrupted).length;
  const parts: string[] = [];

  const lead = stats.bleeding.heavy >= 2 ? 'heavy bleeding' : counts[0] ? SYMPTOM_WORDS[counts[0].s] : null;
  if (lead) parts.push(`My main concern: ${lead}` + (disruptedDays ? ', and how it disrupts my days.' : '.'));
  parts.push(`I checked in on ${stats.recordedDays} of the last ${stats.days} days (${windowLabel(stats)}).`);
  if (counts.length)
    parts.push(
      'I noticed ' +
        joinWords(counts.map((c) => `${SYMPTOM_WORDS[c.s]} on ${c.count}`)) +
        ` of my ${plural(n, 'check-in')}.`,
    );
  if (stats.bleeding.answered)
    parts.push(
      `Heavy or very heavy bleeding on ${stats.bleeding.heavy} of ${plural(stats.bleeding.answered, 'check-in')} with a bleeding answer.`,
    );
  if (withImpact.length)
    parts.push(
      `My plans changed or I couldn’t do usual activities on ${disruptedDays} of ${plural(withImpact.length, 'check-in')} recording the effect on my day.`,
    );
  for (const t of stats.treatmentChanges.slice(-2)) parts.push(`On ${dayLabel(t.date)}: ${t.text}.`);
  const note = recorded.filter((e) => e.notes?.trim()).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (note) parts.push(`In my words (${dayLabel(note.date)}): “${note.notes!.trim()}”`);
  return parts.join(' ');
}

function joinWords(items: string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : (items[0] ?? '');
}

function dayLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(parseLocalDate(iso));
}
