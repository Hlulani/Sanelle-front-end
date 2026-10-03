import { HelpFocus } from '../core/services/focus-preferences.service';
import { FINDINGS, FINDING_KEYS, FindingKey, HealthRecord, diagnosisProgress, findingOrUnknown } from '../my-health/diagnosis.model';

export type DiagnosisStep =
  | { kind: 'start' }
  | { kind: 'continue'; answered: number; total: number; nextKey: FindingKey }
  | { kind: 'ask'; key: FindingKey; question: string }
  | { kind: 'summary' };

export type NextStep = DiagnosisStep | { kind: 'appointment' } | { kind: 'food' };

/**
 * Which area leads Today. One choice leads; with several (which onboarding doesn't rank) the fixed
 * pillar order is used and the screen says so neutrally; with none, the diagnosis leads.
 */
export function leadArea(focus: readonly HelpFocus[]): HelpFocus {
  return focus[0] ?? 'diagnosis';
}

/** The supporting areas below the lead: chosen ones first, then the rest, each in pillar order. */
export function supportingAreas(focus: readonly HelpFocus[]): HelpFocus[] {
  const lead = leadArea(focus);
  const all: HelpFocus[] = ['diagnosis', 'food', 'appointment'];
  return [...all.filter((a) => focus.includes(a)), ...all.filter((a) => !focus.includes(a))].filter((a) => a !== lead);
}

/** The line above the lead action on a first visit: it reflects what she chose, without ranking. */
export function contextLine(focus: readonly HelpFocus[]): string {
  if (focus.length !== 1) return 'Here are a few places to start.';
  return {
    diagnosis: 'You wanted help understanding your diagnosis.',
    food: 'You wanted help with food choices.',
    appointment: 'You wanted help preparing for an appointment.',
  }[focus[0]];
}

/** Where she is with the diagnosis questions. Unanswered details stay unknown; nothing is inferred. */
export function diagnosisStep(record: HealthRecord): DiagnosisStep {
  const progress = diagnosisProgress(record);
  if (progress.answered === 0) return { kind: 'start' };
  if (progress.nextKey) return { kind: 'continue', answered: progress.answered, total: progress.total, nextKey: progress.nextKey };

  const asked = new Set(record.questions.map((q) => q.text.toLowerCase()));
  const missing = FINDING_KEYS.map((k) => findingOrUnknown(record, k)).find(
    (f) => f.completeness.state === 'unknown' && !asked.has(FINDINGS[f.key].questionIfUnknown.toLowerCase()),
  );
  return missing ? { kind: 'ask', key: missing.key, question: FINDINGS[missing.key].questionIfUnknown } : { kind: 'summary' };
}

/** The one card at the top of Today. */
export function nextStep(record: HealthRecord, focus: readonly HelpFocus[]): NextStep {
  const lead = leadArea(focus);
  if (lead === 'food') return { kind: 'food' };
  if (lead === 'appointment') return { kind: 'appointment' };
  return diagnosisStep(record);
}
