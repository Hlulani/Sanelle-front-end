import { ReviewStatus } from '../learn/evidence.model';
import { SymptomEntry } from './diagnosis.model';

/** A recorded concern that reviewed information could explain. */
export type SymptomConcern = 'bleeding' | 'pain' | 'tiredness' | 'bloating';

/**
 * Reviewed information about a symptom, matched to check-ins by an explicit rule (its concern).
 * Only topics with a dated clinical review are ever suggested. None exist yet, so
 * "Understand what I'm experiencing" stays hidden until one is reviewed and added here.
 */
export interface SymptomTopic {
  concern: SymptomConcern;
  title: string;
  /** Where the explanation lives in the app. */
  route: string;
  sources: { citation: string; url: string }[];
  review: ReviewStatus;
}

export const SYMPTOM_TOPICS: SymptomTopic[] = [];

/** Concerns recorded in one check-in, by explicit thresholds. */
export function concernsIn(e: SymptomEntry): SymptomConcern[] {
  const out: SymptomConcern[] = [];
  if (e.bleeding === 'heavy' || e.bleeding === 'very-heavy') out.push('bleeding');
  if (e.pain !== undefined && e.pain >= 4) out.push('pain');
  if (e.fatigue === 'moderate' || e.fatigue === 'severe') out.push('tiredness');
  if (e.bloating === 'moderate' || e.bloating === 'severe') out.push('bloating');
  return out;
}

/** The first reviewed topic for a recorded concern, or null. Drafts are never suggested. */
export function reviewedTopicFor(concerns: SymptomConcern[], topics: SymptomTopic[] = SYMPTOM_TOPICS): SymptomTopic | null {
  for (const c of concerns) {
    const t = topics.find((x) => x.concern === c && x.review.state === 'reviewed');
    if (t) return t;
  }
  return null;
}
