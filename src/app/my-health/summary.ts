import { FINDINGS, FINDING_KEYS, Finding, HealthRecord, findingOrUnknown } from './diagnosis.model';

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
  notes: string;
  disclaimer: string;
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
  section('My questions', s.questions.map((q, i) => `${i + 1}. ${q}`));
  if (s.notes) out.push('', 'Notes', s.notes);
  out.push('', s.disclaimer);
  return out.join('\n');
}
