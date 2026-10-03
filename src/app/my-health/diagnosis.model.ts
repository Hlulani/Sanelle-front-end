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
  | 'extracted-and-confirmed'; // future: from an uploaded report, confirmed by the person

export const SOURCE_LABELS: Record<FindingSource, string> = {
  'entered-from-report': 'From your report, entered by you',
  'told-by-clinician': 'What you were told at an appointment',
  'self-reported': 'Your own note',
  'extracted-and-confirmed': 'Read from your report, checked by you',
};

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
  reportDate?: string;
  updatedAt?: string;
}

export interface FindingDefinition {
  key: FindingKey;
  label: string;
  /** Asked one at a time while recording. */
  question: string;
  /** Placeholder for the value field. */
  example: string;
  /** Whether "the report says no / none" is a meaningful answer. */
  canBeAbsent: boolean;
  absentLabel?: string;
  /** Question suggested when the finding is unknown. */
  questionIfUnknown: string;
  /** Short plain-language explanation. Draft until clinically reviewed. */
  explanation: string;
}

export const FINDINGS: Record<FindingKey, FindingDefinition> = {
  count: {
    key: 'count',
    label: 'Fibroids',
    question: 'How many fibroids does your report mention?',
    example: 'e.g. 2',
    canBeAbsent: false,
    questionIfUnknown: 'How many fibroids do I have?',
    explanation:
      'Reports usually say how many fibroids were seen. Small ones can be hard to count, so the number can change between scans.',
  },
  largestSize: {
    key: 'largestSize',
    label: 'Largest',
    question: 'How big is the largest one?',
    example: 'e.g. 4.1 cm or 41 x 36 mm',
    canBeAbsent: false,
    questionIfUnknown: 'How big is my largest fibroid?',
    explanation:
      'Size is usually given in centimetres or millimetres, sometimes as two or three measurements. Copy it as written.',
  },
  location: {
    key: 'location',
    label: 'Location',
    question: 'Where are they, in your report’s words?',
    example: 'e.g. intramural, posterior wall',
    canBeAbsent: false,
    questionIfUnknown: 'Where are my fibroids?',
    explanation:
      'Reports describe where a fibroid sits in the wall of the uterus, with words like submucosal (under the inner lining), intramural (in the wall) or subserosal (on the outer surface).',
  },
  cavity: {
    key: 'cavity',
    label: 'Uterine cavity',
    question: 'Does your report say whether the uterine cavity is affected?',
    example: 'e.g. cavity distorted by a submucosal fibroid',
    canBeAbsent: true,
    absentLabel: 'My report says it isn’t affected',
    questionIfUnknown: 'Is my uterine cavity affected?',
    explanation:
      'The cavity is the space inside the uterus. Whether a fibroid changes its shape is something doctors consider when talking about bleeding and pregnancy.',
  },
  figo: {
    key: 'figo',
    label: 'FIGO type',
    question: 'Does your report give a FIGO type?',
    example: 'e.g. FIGO 2',
    canBeAbsent: false,
    questionIfUnknown: 'Do my fibroids have a FIGO type?',
    explanation:
      'FIGO is a numbered system (0 to 8) some reports use to describe position. Only add it if your report states it. Sanelle never works it out from other details.',
  },
};

export interface AppointmentQuestion {
  id: string;
  text: string;
  /** The finding that prompted a suggested question, if any. */
  findingKey?: FindingKey;
  origin: 'suggested' | 'custom';
  answer?: string;
  createdAt: string;
}

export interface Appointment {
  date?: string; // YYYY-MM-DD
  with?: string;
}

/** Everything Sanelle stores about one person's health, on their device. */
export interface HealthRecord {
  version: 1;
  findings: Partial<Record<FindingKey, Finding>>;
  questions: AppointmentQuestion[];
  appointment: Appointment;
  summaryNotes: string;
}

export function emptyHealthRecord(): HealthRecord {
  return { version: 1, findings: {}, questions: [], appointment: {}, summaryNotes: '' };
}

/** A finding that hasn't been recorded at all reads as unknown, never as absent. */
export function findingOrUnknown(record: HealthRecord, key: FindingKey): Finding {
  return record.findings[key] ?? { key, completeness: { state: 'unknown' } };
}
