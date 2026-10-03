import { HelpFocus } from '../core/services/focus-preferences.service';
import { FINDINGS, FINDING_KEYS, FindingKey, HealthRecord, diagnosisProgress, findingOrUnknown } from '../my-health/diagnosis.model';

export type NextStep =
  | { kind: 'start' }
  | { kind: 'continue'; answered: number; total: number; nextKey: FindingKey }
  | { kind: 'ask'; key: FindingKey; question: string }
  | { kind: 'summary' }
  | { kind: 'appointment' }
  | { kind: 'food' };

/**
 * The one card at the top of Today. It follows the first thing someone said they want help
 * with; with nothing chosen it starts with the diagnosis.
 */
export function nextStep(record: HealthRecord, focus: readonly HelpFocus[]): NextStep {
  const lead = focus[0] ?? 'diagnosis';
  if (lead === 'food') return { kind: 'food' };
  if (lead === 'appointment' && !record.appointment.date) return { kind: 'appointment' };

  const progress = diagnosisProgress(record);
  if (progress.answered === 0) return { kind: 'start' };
  if (progress.nextKey) return { kind: 'continue', answered: progress.answered, total: progress.total, nextKey: progress.nextKey };

  const asked = new Set(record.questions.map((q) => q.text.toLowerCase()));
  const missing = FINDING_KEYS.map((k) => findingOrUnknown(record, k)).find(
    (f) => f.completeness.state === 'unknown' && !asked.has(FINDINGS[f.key].questionIfUnknown.toLowerCase()),
  );
  return missing ? { kind: 'ask', key: missing.key, question: FINDINGS[missing.key].questionIfUnknown } : { kind: 'summary' };
}
