/**
 * Draft food-question topics, written against the cited papers. They appear only in the
 * internal evidence catalogue until reviewed; nothing here is generated at runtime.
 */

/** Outcomes are always reported separately; a finding about one says nothing about the others. */
export type FibroidOutcome = 'incidence' | 'growth' | 'bleeding' | 'pain' | 'fertility';

export const OUTCOME_LABELS: Record<FibroidOutcome, string> = {
  incidence: 'Getting fibroids',
  growth: 'Fibroid growth',
  bleeding: 'Heavy bleeding',
  pain: 'Pain',
  fertility: 'Fertility',
};

/**
 * What the reviewed research says for one outcome.
 * `none-found` means no study turned up in our search. It is not evidence of no effect.
 */
export type OutcomeVerdict =
  | 'mixed'
  | 'association-lower'
  | 'association-higher'
  /** Only lab, animal or closely related studies (e.g. supplements, other groups of women). */
  | 'indirect'
  | 'none-found';

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
  /** One line shown before the details are opened. */
  keyFinding: string;
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
  /** Short question used as the screen title and in lists. */
  title: string;
  question: string;
  /** Read first: one sentence, then one line of context. */
  answer: { headline: string; detail: string };
  findings: OutcomeFinding[];
  practical: string[];
  studies: Study[];
  review: ReviewStatus;
  /** Sources that aren't studies of fibroids, e.g. a food-safety opinion. */
  otherSources?: { label: string; citation: string; url: string }[];
  /** Ingredient matcher used to show related meals. */
  /** The food the topic is about, e.g. 'dairy'. */
  relatedFood?: string;
}
