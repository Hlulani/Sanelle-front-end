/**
 * The evidence catalogue. Every explanation a patient can read comes from a catalogue entry,
 * and only a published entry can supply one. Draft, in-review and withdrawn entries stay in the
 * internal workspace.
 */
export type EvidenceStatus = 'draft' | 'in-review' | 'published' | 'withdrawn';

export const STATUS_LABELS: Record<EvidenceStatus, string> = {
  draft: 'Draft',
  'in-review': 'In review',
  published: 'Published',
  withdrawn: 'Withdrawn',
};

export type EvidenceTopic =
  | 'diagnosis'
  | 'symptoms'
  | 'appointment'
  | 'food'
  | 'treatment'
  | 'reproduction'
  | 'measurement'
  | 'growth'
  | 'biology'
  | 'population'
  | 'access'
  | 'research';

export const TOPIC_LABELS: Record<EvidenceTopic, string> = {
  diagnosis: 'Diagnosis and reports',
  symptoms: 'Symptoms and anaemia',
  appointment: 'Appointments and experience',
  food: 'Food and risk factors',
  treatment: 'Treatment',
  reproduction: 'Reproduction',
  measurement: 'Measurement',
  growth: 'Growth over time',
  biology: 'Biology',
  population: 'Who gets fibroids',
  access: 'Access, equity and cost',
  research: 'Research and data',
};

export interface EvidenceSource {
  id: string;
  label: string;
  title: string;
  type: string;
  url: string;
  /** How much of the source was read, e.g. "Full main text read". */
  depth: string;
}

/** One row of the research library's claim-to-evidence map. */
export interface ResearchClaim {
  claimId: string;
  domain: string;
  claim: string;
  confidence: string;
  basis: string;
  limits: string;
  productRule: string;
  verification: string;
  asOf: string;
  sources: EvidenceSource[];
}

export interface ReviewEvent {
  date: string;
  status: EvidenceStatus;
  by: string;
  note: string;
}

/** Outcomes are always kept apart: a finding about one says nothing about the others. */
export type OutcomeKind = 'incidence' | 'growth' | 'symptoms' | 'supplements' | 'fertility';
export const OUTCOME_KIND_LABELS: Record<OutcomeKind, string> = {
  incidence: 'Getting fibroids',
  growth: 'Measured growth',
  symptoms: 'Symptoms',
  supplements: 'Supplements',
  fertility: 'Fertility',
};

export interface CatalogEntry {
  id: string;
  claimId?: string;
  title: string;
  topic: EvidenceTopic;
  /** Plain-language explanation. Patients see it only when the entry is published. */
  explanation: string;
  population: string;
  outcome: string;
  findings: string;
  limitations: string;
  sources: EvidenceSource[];
  reviewer: string;
  reviewDate: string;
  version: string;
  researchCutoff: string;
  status: EvidenceStatus;
  history: ReviewEvent[];
  /** The screens and prompts that show this entry. */
  usedBy: string[];
  outcomes?: { kind: OutcomeKind; text: string }[];
  /** Optional practical conclusion displayed by the source claim sheet. */
  practicalTake?: string;
}
