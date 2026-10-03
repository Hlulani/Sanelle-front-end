import {
  BLEEDING_LABELS,
  FINDINGS,
  FINDING_KEYS,
  Finding,
  HealthRecord,
  IMPACT_LABELS,
  ImpactArea,
  SymptomEntry,
  findingOrUnknown,
} from './diagnosis.model';

export interface SummaryLine {
  label: string;
  text: string;
  wording?: string;
}

export interface AppointmentSummary {
  appointmentLine: string | null;
  /** Findings taken from a report (entered by the person or confirmed by them). */
  fromReport: SummaryLine[];
  /** What the person was told or noted themselves. */
  personallyReported: SummaryLine[];
  /** Details nobody has recorded. Never presented as negative findings. */
  notRecorded: string[];
  questions: string[];
  /** Describes logged days only; null when nothing was logged in the period. */
  symptoms: SymptomSummary | null;
  notes: string;
  disclaimer: string;
}

export interface SymptomSummary {
  periodLabel: string;
  /** e.g. "12 check-ins in the last 30 days. Days without a check-in are unknown and aren't counted." */
  coverage: string;
  lines: string[];
  treatmentChanges: string[];
}

export const SYMPTOM_PERIOD_DAYS = 30;

function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Plain counts over logged days. Missing days are never treated as symptom-free,
 * and nothing here suggests a cause.
 */
export function summariseSymptoms(entries: SymptomEntry[], today = new Date(), periodDays = SYMPTOM_PERIOD_DAYS): SymptomSummary | null {
  const start = new Date(today);
  start.setDate(start.getDate() - (periodDays - 1));
  const from = isoDay(start);
  const to = isoDay(today);
  const inPeriod = entries.filter((e) => e.date >= from && e.date <= to);
  if (!inPeriod.length) return null;

  // The denominator is always the check-ins recorded in the period, never the days in it.
  const n = inPeriod.length;
  const of = (count: number) => `${count} of ${n} ${n === 1 ? 'check-in' : 'check-ins'}`;
  const lines: string[] = [];
  const bleedingDays = inPeriod.filter((e) => e.bleeding !== undefined);
  if (bleedingDays.length) {
    const heavy = bleedingDays.filter((e) => e.bleeding === 'heavy' || e.bleeding === 'very-heavy').length;
    const veryHeavy = bleedingDays.filter((e) => e.bleeding === 'very-heavy').length;
    const any = bleedingDays.filter((e) => e.bleeding !== 'none').length;
    let text = `Bleeding: on ${of(any)}, heavy or very heavy on ${heavy}`;
    if (veryHeavy) text += ` (${BLEEDING_LABELS['very-heavy'].toLowerCase()} on ${veryHeavy})`;
    lines.push(text + '.');
  }
  const painDays = inPeriod.filter((e) => e.pain !== undefined).map((e) => e.pain as number);
  if (painDays.length) {
    const max = Math.max(...painDays);
    const min = Math.min(...painDays);
    const sevenPlus = painDays.filter((p) => p >= 7).length;
    lines.push(`Pain (0 to 10): recorded on ${of(painDays.length)}, ${min === max ? `at ${min}` : `ranging ${min} to ${max}`}` + (sevenPlus ? `; 7 or more on ${sevenPlus}.` : '.'));
  }
  for (const [field, label] of [['bloating', 'Pressure or bloating'], ['fatigue', 'Tiredness']] as const) {
    const recorded = inPeriod.filter((e) => e[field] !== undefined);
    if (!recorded.length) continue;
    const severe = recorded.filter((e) => e[field] === 'severe').length;
    const present = recorded.filter((e) => e[field] !== 'none').length;
    lines.push(`${label}: on ${of(present)}` + (severe ? `, severe on ${severe}.` : '.'));
  }
  const impactRecorded = inPeriod.filter((e) => e.affected !== undefined);
  if (impactRecorded.length) {
    const parts = (Object.keys(IMPACT_LABELS) as ImpactArea[])
      .map((a) => [IMPACT_LABELS[a].toLowerCase(), impactRecorded.filter((e) => e.affected!.includes(a)).length] as const)
      .filter(([, c]) => c > 0)
      .map(([label, c]) => `${label} on ${of(c)}`);
    lines.push(parts.length ? `Affected: ${parts.join(', ')}.` : `Affected: nothing, on the ${impactRecorded.length === 1 ? 'check-in' : 'check-ins'} where this was recorded.`);
  }

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(iso + 'T00:00:00'));
  return {
    periodLabel: `${fmt(from)} to ${fmt(to)}`,
    coverage: `${n} ${n === 1 ? 'check-in' : 'check-ins'} in the last ${periodDays} days. Days without a check-in are unknown and aren't counted.`,
    lines,
    treatmentChanges: inPeriod
      .filter((e) => e.treatmentChange?.trim())
      .map((e) => `${fmt(e.date)}: ${e.treatmentChange!.trim()}`),
  };
}

export const SUMMARY_DISCLAIMER =
  'Prepared by me with Sanelle. Details come from my reports and my own notes and have not been checked by a clinician.';

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

function lineFor(f: Finding): SummaryLine {
  const def = FINDINGS[f.key];
  const date = formatDate(f.reportDate);
  if (f.completeness.state === 'absent') {
    return { label: def.label, text: def.absentLabel ? def.absentLabel.replace(/^My report says/, 'Report says') : 'Report says none' };
  }
  const value = f.completeness.state === 'present' ? f.completeness.value : '';
  return {
    label: def.label,
    text: date ? `${value} (report dated ${date})` : value,
    wording: f.originalWording || undefined,
  };
}

export function buildSummary(record: HealthRecord): AppointmentSummary {
  const fromReport: SummaryLine[] = [];
  const personallyReported: SummaryLine[] = [];
  const notRecorded: string[] = [];

  for (const key of FINDING_KEYS) {
    const f = findingOrUnknown(record, key);
    if (f.completeness.state === 'unknown') {
      notRecorded.push(FINDINGS[key].label);
      continue;
    }
    const fromAReport = f.source === 'entered-from-report' || f.source === 'extracted-and-confirmed';
    (fromAReport ? fromReport : personallyReported).push(lineFor(f));
  }

  const date = formatDate(record.appointment.date);
  const who = record.appointment.with?.trim();
  const appointmentLine = date ? `Appointment${who ? ` with ${who}` : ''} on ${date}` : who ? `Appointment with ${who}` : null;

  return {
    appointmentLine,
    fromReport,
    personallyReported,
    notRecorded,
    questions: record.questions.map((q) => q.text),
    // She decides whether check-ins go into what she shares.
    symptoms: record.summaryIncludesCheckins === false ? null : summariseSymptoms(record.symptoms ?? []),
    notes: record.summaryNotes.trim(),
    disclaimer: SUMMARY_DISCLAIMER,
  };
}

/** Plain text for sharing or copying into a message. */
export function summaryAsText(s: AppointmentSummary): string {
  const out: string[] = ['My appointment summary'];
  if (s.appointmentLine) out.push(s.appointmentLine);
  const section = (title: string, lines: string[]) => {
    if (!lines.length) return;
    out.push('', title, ...lines.map((l) => `- ${l}`));
  };
  section('From my report', s.fromReport.map((l) => `${l.label}: ${l.text}${l.wording ? ` ("${l.wording}")` : ''}`));
  section('What I was told or noted', s.personallyReported.map((l) => `${l.label}: ${l.text}`));
  section('Not recorded yet', s.notRecorded);
  if (s.symptoms) {
    section(`Symptoms I logged (${s.symptoms.periodLabel})`, [s.symptoms.coverage, ...s.symptoms.lines]);
    section('Treatment changes I noted', s.symptoms.treatmentChanges);
  }
  section('My questions', s.questions.map((q, i) => `${i + 1}. ${q}`));
  if (s.notes) out.push('', 'Notes', s.notes);
  out.push('', s.disclaimer);
  return out.join('\n');
}
