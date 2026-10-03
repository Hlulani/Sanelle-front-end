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

export type FindingKey = 'count' | 'location' | 'cavity' | 'largestSize';

export interface Finding {
  key: FindingKey;
  label: string;
  completeness: FindingCompleteness;
  /** Absent when completeness is unknown. */
  source?: FindingSource;
  /** The report's own words, kept next to any plain-language version. */
  originalWording?: string;
  reportDate?: string;
}

/** Question suggested when a finding is unknown. */
export const QUESTION_FOR_UNKNOWN: Record<FindingKey, string> = {
  count: 'How many fibroids do I have?',
  location: 'Where are my fibroids located?',
  cavity: 'Does my report say whether the uterine cavity is affected?',
  largestSize: 'How big is my largest fibroid?',
};
