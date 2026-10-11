import { HealthRecord } from '../my-health/diagnosis.model';
import { symptomWindow } from '../my-health/symptoms/symptom-stats';
import { localIsoDate } from '../shared/calendar-date';
import { Symptom, draftVisitBrief, noticed, suggestQuestions } from './records-assistant';

/**
 * What an AI draft may see, and the checks its answer must pass before she sees it.
 *
 * Only the last 30 days of check-ins and her own notes are sent: no name, email, report or
 * result. The facts are the counts Sanelle already worked out, so the model words them rather
 * than counting. Anything that adds a number not in those facts, or quotes words she never
 * wrote, is dropped here as well as on the server.
 */

export interface InsightsRequest {
  checkins: { date: string; symptoms: string[]; bleeding: string; dailyImpact: string; note: string }[];
  facts: string[];
  explanations: { claimId: string; title: string; summary: string }[];
  savedQuestions: string[];
}

export interface InsightsResponse {
  brief: string;
  questions: { text: string; why: string }[];
  matches: { claimId: string; quote: string }[];
}

const SYMPTOM_LABELS: Record<Symptom, string> = {
  bleeding: 'Bleeding',
  pain: 'Pain',
  pressure: 'Pelvic pressure',
  energy: 'Low energy',
};

export function buildInsightsRequest(
  record: HealthRecord,
  published: { claimId: string; title: string; summary: string }[],
  today = localIsoDate(),
): InsightsRequest {
  const entries = symptomWindow(record.symptoms ?? [], today)
    .filter((d) => d.entry)
    .map((d) => d.entry!);
  const brief = draftVisitBrief(record, today);
  return {
    checkins: entries.map((e) => ({
      date: e.date,
      symptoms: (Object.keys(SYMPTOM_LABELS) as Symptom[]).filter((s) => noticed(e, s)).map((s) => SYMPTOM_LABELS[s]),
      bleeding: e.bleeding ?? '',
      dailyImpact: e.dailyImpact ?? '',
      note: [e.notes, e.treatmentChange].filter((t) => t?.trim()).join(' · '),
    })),
    // The rule-based brief, without the quoted note, plus why each rule-based question applies.
    facts: [
      ...(brief ?? '').split(/(?<=\.) (?=[A-Z])/).filter((s) => s && !s.startsWith('In my words')),
      ...suggestQuestions(record, today).map((q) => q.why),
    ],
    explanations: published,
    savedQuestions: record.questions.map((q) => q.text),
  };
}

const DATE = /\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/gi;

/** Dates and counts are checked apart, so a day of the month can't pass as a count. */
function tokens(text: string): string[] {
  const dates = (text.match(DATE) ?? []).map((d) => d.slice(0, d.indexOf(' ') + 4).toLowerCase());
  const counts = (text.replace(DATE, ' ').match(/\d+/g) ?? []).map((n) => `#${n}`);
  return [...dates, ...counts];
}

/** Keeps only what the facts and her notes support. */
export function checkDraft(draft: InsightsResponse, request: InsightsRequest): InsightsResponse {
  const allowed = new Set(tokens(request.facts.join(' ') + ' ' + request.checkins.map((c) => c.note).join(' ')));
  const supported = (text: string) => tokens(text).every((t) => allowed.has(t));
  const notes = request.checkins.map((c) => c.note.toLowerCase()).join('\n');
  const ids = new Set(request.explanations.map((e) => e.claimId));
  return {
    brief: draft.brief && supported(draft.brief) ? draft.brief.trim() : '',
    questions: (draft.questions ?? []).filter((q) => q.text?.trim() && supported(q.text) && supported(q.why ?? '')),
    // Each quote supports one explanation at most.
    matches: (draft.matches ?? []).filter(
      (m, i, all) =>
        ids.has(m.claimId) &&
        m.quote?.trim() &&
        notes.includes(m.quote.trim().toLowerCase()) &&
        all.findIndex((x) => x.quote?.trim().toLowerCase() === m.quote.trim().toLowerCase()) === i,
    ),
  };
}
