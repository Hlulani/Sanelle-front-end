/**
 * Curated food-question topics. Content is written and checked by people
 * against the cited papers; nothing here is generated at runtime.
 */

/** Outcomes are always reported separately; a finding about one says nothing about the others. */
export type FibroidOutcome = 'incidence' | 'growth' | 'bleeding' | 'pain' | 'fertility';

export const OUTCOME_LABELS: Record<FibroidOutcome, string> = {
  incidence: 'Developing fibroids',
  growth: 'Growth of existing fibroids',
  bleeding: 'Heavy bleeding',
  pain: 'Pain',
  fertility: 'Fertility',
};

/**
 * What the reviewed research says for one outcome.
 * `none-found` means no study turned up in our search. It is not evidence of no effect.
 */
export type OutcomeVerdict = 'mixed' | 'association-lower' | 'association-higher' | 'none-found';

export type StudyDesign =
  | 'randomised-trial'
  | 'prospective-cohort'
  | 'case-control'
  | 'cross-sectional'
  | 'laboratory-or-animal'
  | 'narrative-review'
  | 'systematic-review'
  | 'clinical-guideline';

export const STUDY_DESIGN_LABELS: Record<StudyDesign, string> = {
  'randomised-trial': 'Randomised trial',
  'prospective-cohort': 'Prospective cohort (observational)',
  'case-control': 'Case-control (observational)',
  'cross-sectional': 'Cross-sectional (observational)',
  'laboratory-or-animal': 'Laboratory or animal study',
  'narrative-review': 'Narrative review',
  'systematic-review': 'Systematic review',
  'clinical-guideline': 'Clinical guideline',
};

export interface Study {
  id: string;
  /** Short label used in lists, e.g. "Black Women's Health Study, US". */
  label: string;
  citation: string;
  url: string;
  design: StudyDesign;
  population: string;
  outcome: FibroidOutcome;
  /** Plain-language result, worded as an association for observational designs. */
  result: string;
  limitations: string[];
}

export interface OutcomeFinding {
  outcome: FibroidOutcome;
  verdict: OutcomeVerdict;
  summary: string;
  studyIds: string[];
}

export type ReviewStatus =
  | { state: 'draft'; researchedOn: string }
  | { state: 'reviewed'; researchedOn: string; reviewedOn: string; reviewedBy: string };

export interface EvidenceTopic {
  id: string;
  /** The claim as people meet it online. */
  claim: string;
  question: string;
  shortAnswer: string;
  findings: OutcomeFinding[];
  practical: string[];
  studies: Study[];
  review: ReviewStatus;
  /** Ingredient matcher used to show related meals. */
  relatedFood?: 'dairy';
}
