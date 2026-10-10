/**
 * Diagnosis findings. Two independent questions are stored for every finding:
 *
 *  - completeness: is the finding present, explicitly absent, or unknown?
 *  - provenance:   where did the information come from?
 *
 * Unknown is never treated as absent. Information a person types in from a report
 * stays "entered from a report" and is never upgraded to clinician-confirmed.
 */

export type FindingCompleteness =
  | { state: 'present'; value: string }
  | { state: 'absent' } // the source explicitly says it isn't there
  | { state: 'unknown' }; // not recorded, or the person doesn't know

export type FindingSource =
  | 'entered-from-report' // typed in by the person while reading their report
  | 'told-by-clinician' // the person's own account of what they were told
  | 'self-reported'
  | 'extracted-and-confirmed'; // read on device from a report, checked by the person

/** One-word source tag shown on collapsed rows. */
export const SOURCE_TAGS: Record<FindingSource, string> = {
  'entered-from-report': 'Report',
  'told-by-clinician': 'Appointment',
  'self-reported': 'Your note',
  'extracted-and-confirmed': 'Report',
};

/** Sources a person can choose when entering a finding by hand. */
export const ENTERABLE_SOURCES: FindingSource[] = ['entered-from-report', 'told-by-clinician', 'self-reported'];

export type FindingKey = 'count' | 'largestSize' | 'location' | 'cavity' | 'figo';

export const FINDING_KEYS: FindingKey[] = ['count', 'largestSize', 'location', 'cavity', 'figo'];

export interface Finding {
  key: FindingKey;
  completeness: FindingCompleteness;
  /** Absent when completeness is unknown. */
  source?: FindingSource;
  /** The report's own words, kept next to any plain-language version. */
  originalWording?: string;
  /** The unit exactly as reported, e.g. "mm". Older records keep the unit inside the value. */
  unit?: string;
  /** The report page the wording was read from (1-based). */
  sourcePage?: number;
  /** Read from a report and not yet compared with it by the person. */
  needsChecking?: boolean;
  reportDate?: string;
  updatedAt?: string;
}

/** A finding's value with its unit, exactly as recorded. */
export function findingValue(f: Finding): string {
  if (f.completeness.state !== 'present') return '';
  return f.unit ? `${f.completeness.value} ${f.unit}` : f.completeness.value;
}

/** How the person confirmed a finding: the confirmation type kept with every detail. */
export function confirmationLabel(f: Finding): string {
  switch (f.source) {
    case 'extracted-and-confirmed':
      return f.needsChecking ? 'Read from the report · not checked yet' : 'Read from the report · checked by me';
    case 'entered-from-report':
      return 'Typed from the report by me';
    case 'told-by-clinician':
      return 'What I was told at an appointment';
    case 'self-reported':
      return 'My own note';
    default:
      return 'Not recorded';
  }
}

export interface FindingDefinition {
  key: FindingKey;
  label: string;
  /** Specific instructions for the editable field; separate from compact summary labels. */
  fieldLabel: string;
  inputHint: string;
  /** Asked one at a time while recording. */
  question: string;
  /** Placeholder for the value field. */
  example: string;
  /** Whether "the report says no / none" is a meaningful answer. */
  canBeAbsent: boolean;
  absentLabel?: string;
  /** Question suggested when the finding is unknown. */
  questionIfUnknown: string;
  /** Completes "Your saved report does not include …". */
  missingNoun: string;
  /** Short plain-language explanation. Draft until clinically reviewed. */
  explanation: string;
}

export const FINDINGS: Record<FindingKey, FindingDefinition> = {
  count: {
    key: 'count',
    label: 'Number of fibroids',
    fieldLabel: 'Number of fibroids',
    inputHint: 'Enter the number mentioned, or copy wording such as “multiple fibroids” if no number is given.',
    question: 'How many fibroids does your report mention?',
    example: 'e.g. 2',
    canBeAbsent: false,
    questionIfUnknown: 'How many fibroids do I have?',
    missingNoun: 'the number of fibroids',
    explanation:
      'Reports usually say how many fibroids were seen. Small ones can be hard to count, so the number can change between scans.',
  },
  largestSize: {
    key: 'largestSize',
    label: 'Largest fibroid size',
    fieldLabel: 'Size of the largest fibroid',
    inputHint:
      'Include the unit, cm or mm. If several measurements are given, copy them together, for example 41 × 36 mm.',
    question: 'How big is the largest one?',
    example: 'e.g. 4.1 cm or 41 x 36 mm',
    canBeAbsent: false,
    questionIfUnknown: 'How big is my largest fibroid?',
    missingNoun: 'a size for the largest fibroid',
    explanation:
      'Size is usually given in centimetres or millimetres, sometimes as two or three measurements. Copy it as written.',
  },
  location: {
    key: 'location',
    label: 'Location',
    fieldLabel: 'Where the fibroids are located',
    inputHint: 'Copy the location words as written. You don’t need to translate medical terms.',
    question: 'Where are they, in your report’s words?',
    example: 'e.g. intramural, posterior wall',
    canBeAbsent: false,
    questionIfUnknown: 'Where are my fibroids?',
    missingNoun: 'a location',
    explanation:
      'Reports describe where a fibroid sits in the wall of the uterus, with words like submucosal (under the inner lining), intramural (in the wall) or subserosal (on the outer surface).',
  },
  cavity: {
    key: 'cavity',
    label: 'Uterine cavity',
    fieldLabel: 'What is written about the uterine cavity',
    inputHint: 'Copy the statement about the cavity. If it is not mentioned, choose “I don’t know”.',
    question: 'Does your report say whether the uterine cavity is affected?',
    example: 'e.g. cavity distorted by a submucosal fibroid',
    canBeAbsent: true,
    absentLabel: 'My report says it isn’t affected',
    questionIfUnknown: 'Is my uterine cavity affected?',
    missingNoun: 'a statement about the uterine cavity',
    explanation:
      'The cavity is the space inside the uterus. Whether a fibroid changes its shape is something doctors consider when talking about bleeding and pregnancy.',
  },
  figo: {
    key: 'figo',
    label: 'FIGO type',
    fieldLabel: 'FIGO type stated in the report',
    inputHint: 'Copy the type exactly, for example “FIGO 2”. If no FIGO type is written, choose “I don’t know”.',
    question: 'Does your report give a FIGO type?',
    example: 'e.g. FIGO 2',
    canBeAbsent: false,
    questionIfUnknown: 'Do my fibroids have a FIGO type?',
    missingNoun: 'a FIGO type',
    explanation:
      'FIGO is a numbered system (0 to 8) some reports use to describe position. Only add it if your report states it. Sanelle never works it out from other details.',
  },
};

/**
 * open: still to ask. answered: an answer was recorded in the person's own words.
 * unresolved: asked, but not answered at the visit. Unresolved is not the same as unanswered.
 */
export type QuestionStatus = 'open' | 'answered' | 'unresolved';

export interface QuestionEvent {
  at: string;
  status: QuestionStatus;
  answer?: string;
  note?: string;
  visitDate?: string;
}

export interface AppointmentQuestion {
  id: string;
  text: string;
  /** The finding that prompted a suggested question, if any. */
  findingKey?: FindingKey;
  origin: 'suggested' | 'custom';
  /** Where the question came from, e.g. "Suggested from missing report detail." */
  sourceLabel?: string;
  /** Missing on older records: worked out from `answer`. */
  status?: QuestionStatus;
  answer?: string;
  /** Every earlier answer or unresolved visit, oldest first. Carrying a question forward keeps it. */
  history?: QuestionEvent[];
  createdAt: string;
}

export const SUGGESTED_FROM_MISSING_DETAIL = 'Suggested from missing report detail.';

export function questionStatus(q: AppointmentQuestion): QuestionStatus {
  return q.status ?? (q.answer?.trim() ? 'answered' : 'open');
}

export interface Appointment {
  date?: string; // YYYY-MM-DD
  with?: string;
}

/** The person's account of a visit, never an app-generated treatment plan. */
export interface VisitReview {
  date: string;
  discussion: string;
  nextSteps: string;
  followUp: string;
}

export interface CareTask {
  /** The visit question this agreement follows, when explicitly saved together. */
  questionId?: string;
  id: string;
  title: string;
  visitDate?: string;
  dueDate?: string;
  reminderAt?: string;
  completedAt?: string;
  createdAt: string;
}

export type ReportSource = 'camera' | 'photos' | 'pdf' | 'manual';
export type ReportStatus = 'needs-checking' | 'checked';

export const REPORT_SOURCE_LABELS: Record<ReportSource, string> = {
  camera: 'Photos taken in Sanelle',
  photos: 'Photos chosen from my phone',
  pdf: 'PDF',
  manual: 'Entered by me',
};

/** A report is kept separately so later scans never erase earlier findings. */
export interface HealthReport {
  id: string;
  title: string;
  reportDate?: string;
  savedAt: string;
  source?: ReportSource;
  pageCount?: number;
  /** Missing on older reports, which were all checked before saving. */
  status?: ReportStatus;
  checkedAt?: string;
  findings: Partial<Record<FindingKey, Finding>>;
}

export function reportStatus(report: HealthReport): ReportStatus {
  return report.status ?? 'checked';
}

/** Someone measured or tested: the exact value, unit and source, never interpreted. */
export interface ClinicalResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  testDate?: string;
  source: string;
  savedAt: string;
}

export type BleedingLevel = 'none' | 'spotting' | 'light' | 'moderate' | 'heavy' | 'very-heavy';
export type SymptomLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type ImpactArea = 'sleep' | 'work' | 'daily';

/** The categories offered in a check-in. "Spotting" only appears on older entries. */
export const BLEEDING_CHOICES: BleedingLevel[] = ['none', 'light', 'moderate', 'heavy', 'very-heavy'];

export const BLEEDING_LABELS: Record<BleedingLevel, string> = {
  none: 'None',
  spotting: 'Spotting',
  light: 'Light',
  moderate: 'Moderate',
  heavy: 'Heavy',
  'very-heavy': 'Very heavy',
};

export const LEVEL_LABELS: Record<SymptomLevel, string> = {
  none: 'None',
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
};

export const IMPACT_LABELS: Record<ImpactArea, string> = {
  sleep: 'Sleep',
  work: 'Work or study',
  daily: 'Daily activities',
};

/**
 * One day's check-in, in the person's own words. Every field is optional: a field
 * that's missing was not recorded, which is different from "none".
 * This is a personal record, not a validated questionnaire.
 */
export interface SymptomEntry {
  date: string; // YYYY-MM-DD, one entry per day
  /** Native Figma check-in choices; never converted into an invented severity score. */
  observedSymptoms?: ('Bleeding' | 'Pelvic pressure' | 'Pain' | 'Low energy')[];
  dailyImpact?: 'No change' | 'Slowed me down' | 'Changed my plans' | 'Couldn’t do usual activities';
  bleeding?: BleedingLevel;
  /** 0 = no pain, 10 = worst pain imaginable. */
  pain?: number;
  bloating?: SymptomLevel;
  fatigue?: SymptomLevel;
  /** Areas the person said were affected. Absent means not recorded. */
  affected?: ImpactArea[];
  notes?: string;
  /** e.g. "Started iron tablets". Recorded as the person describes it. */
  treatmentChange?: string;
  updatedAt?: string;
}

/** Everything Sanelle stores about one person's health, on their device. */
export interface HealthRecord {
  version: 1;
  findings: Partial<Record<FindingKey, Finding>>;
  questions: AppointmentQuestion[];
  appointment: Appointment;
  summaryNotes: string;
  /** Whether check-ins go into the appointment summary. Missing means yes. */
  summaryIncludesCheckins?: boolean;
  summaryPeriodDays?: 14 | 30 | 90;
  symptoms: SymptomEntry[];
  visitGoal?: string;
  visits?: VisitReview[];
  tasks?: CareTask[];
  reports?: HealthReport[];
  activeReportId?: string;
  results?: ClinicalResult[];
  /** Missing selections preserve the previous behavior for existing records. */
  summaryQuestionIds?: string[];
  summaryAnswerIds?: string[];
  summarySymptomDates?: string[];
  summaryVisitDates?: string[];
}

/** Questions still to ask. Unresolved ones are listed separately until carried forward. */
export function unansweredQuestions(record: HealthRecord): AppointmentQuestion[] {
  return record.questions.filter((q) => questionStatus(q) === 'open');
}

export function emptyHealthRecord(): HealthRecord {
  return { version: 1, findings: {}, questions: [], appointment: {}, summaryNotes: '', symptoms: [] };
}

/** True when an entry has at least one recorded field. */
export function hasContent(e: SymptomEntry): boolean {
  return (
    e.observedSymptoms !== undefined ||
    e.dailyImpact !== undefined ||
    e.bleeding !== undefined ||
    e.pain !== undefined ||
    e.bloating !== undefined ||
    e.fatigue !== undefined ||
    e.affected !== undefined ||
    !!e.notes?.trim() ||
    !!e.treatmentChange?.trim()
  );
}

/** A finding that hasn't been recorded at all reads as unknown, never as absent. */
export function findingOrUnknown(record: HealthRecord, key: FindingKey): Finding {
  return record.findings[key] ?? { key, completeness: { state: 'unknown' } };
}

/** The HLT-02 explanation for a detail the saved report doesn't include. */
export function missingExplanation(key: FindingKey): string {
  return `Your saved report does not include ${FINDINGS[key].missingNoun}. Sanelle cannot determine it from the other fields.`;
}
