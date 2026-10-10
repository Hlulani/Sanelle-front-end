import {
  ClinicalResult,
  FINDINGS,
  FINDING_KEYS,
  HealthRecord,
  findingOrUnknown,
  findingValue,
  questionStatus,
} from './diagnosis.model';
import { detailLines, statsSentence, symptomStats, windowLabel } from './symptoms/symptom-stats';
import { localIsoDate, parseLocalDate } from '../shared/calendar-date';

/**
 * The appointment summary (APT-01). It holds only what the person entered or confirmed: no
 * unchecked report details, no interpretation. Whether it helps a visit is still a hypothesis (C15).
 */
export interface AppointmentSummary {
  appointmentLine: string | null;
  concern: string;
  recorded: { label: string; value: string; source: string }[];
  missing: string[];
  symptoms: { window: string; lines: string[]; missingDays: number } | null;
  results: string[];
  questions: string[];
  answers: { question: string; answer: string }[];
  unresolved: string[];
  nextSteps: { step: string; reviewDate: string | null }[];
  disclaimer: string;
}

export const SUMMARY_DISCLAIMER =
  'Prepared by me with Sanelle. It contains only details I entered or checked; nothing in it has been checked by a clinician.';

export function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = iso.length === 10 ? parseLocalDate(iso) : new Date(iso);
  return isNaN(d.getTime())
    ? null
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export function resultLine(r: ClinicalResult): string {
  const date = formatDate(r.testDate);
  return `${r.name}: ${r.value}${r.unit ? ' ' + r.unit : ''}${date ? ` (tested ${date})` : ''} · ${r.source}`;
}

export function buildSummary(record: HealthRecord, today = localIsoDate()): AppointmentSummary {
  const recorded: AppointmentSummary['recorded'] = [];
  const missing: string[] = [];
  for (const key of FINDING_KEYS) {
    const f = findingOrUnknown(record, key);
    if (f.completeness.state === 'unknown' || f.needsChecking) {
      missing.push(FINDINGS[key].label);
      continue;
    }
    recorded.push({
      label: FINDINGS[key].label,
      value: f.completeness.state === 'absent' ? 'Report says not affected' : findingValue(f),
      source:
        f.source === 'self-reported'
          ? 'my own note'
          : f.source === 'told-by-clinician'
            ? 'told at an appointment'
            : 'from my report',
    });
  }

  const stats = symptomStats(record.symptoms ?? [], today);
  const date = formatDate(record.appointment.date);
  const who = record.appointment.with?.trim();
  const appointmentLine = date
    ? `Appointment${who ? ` with ${who}` : ''} on ${date}`
    : who
      ? `Appointment with ${who}`
      : null;

  return {
    appointmentLine,
    concern: record.visitGoal?.trim() ?? '',
    recorded,
    missing,
    symptoms:
      record.summaryIncludesCheckins === false || !stats.recordedDays
        ? null
        : {
            window: windowLabel(stats),
            lines: [...statsSentence(stats), ...detailLines(stats)],
            missingDays: stats.missingDays,
          },
    results: [...(record.results ?? [])].map(resultLine),
    questions: record.questions.filter((q) => questionStatus(q) === 'open').map((q) => q.text),
    answers: record.questions
      .filter((q) => questionStatus(q) === 'answered' && q.answer?.trim())
      .map((q) => ({ question: q.text, answer: q.answer!.trim() })),
    unresolved: record.questions.filter((q) => questionStatus(q) === 'unresolved').map((q) => q.text),
    nextSteps: (record.tasks ?? [])
      .filter((t) => !t.completedAt)
      .map((t) => ({ step: t.title, reviewDate: formatDate(t.dueDate) })),
    disclaimer: SUMMARY_DISCLAIMER,
  };
}

/** Plain text for copying into a message or a notes app. */
export function summaryAsText(s: AppointmentSummary): string {
  const out: string[] = ['My appointment summary'];
  if (s.appointmentLine) out.push(s.appointmentLine);
  const section = (title: string, lines: string[]) => {
    if (lines.length) out.push('', title, ...lines.map((l) => `- ${l}`));
  };
  if (s.concern) out.push('', 'My main concern', s.concern);
  section(
    'Questions I want to ask',
    s.questions.map((q, i) => `${i + 1}. ${q}`),
  );
  section('Questions still unresolved from before', s.unresolved);
  if (s.symptoms) section(`My symptoms (${s.symptoms.window}, my own check-ins)`, s.symptoms.lines);
  section('Reported clinical results', s.results);
  section(
    'Recorded diagnosis details',
    s.recorded.map((r) => `${r.label}: ${r.value} (${r.source})`),
  );
  section('Not recorded in my report', s.missing);
  section(
    'Answers I noted',
    s.answers.map((a) => `${a.question}\n  ${a.answer}`),
  );
  section(
    'Agreed next steps',
    s.nextSteps.map((n) => (n.reviewDate ? `${n.step} (review ${n.reviewDate})` : n.step)),
  );
  out.push('', s.disclaimer);
  return out.join('\n');
}
