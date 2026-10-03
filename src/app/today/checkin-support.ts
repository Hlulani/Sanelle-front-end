import { HelpFocus } from '../core/services/focus-preferences.service';
import { AppointmentQuestion, SymptomEntry } from '../my-health/diagnosis.model';
import { SymptomTopic, concernsIn, reviewedTopicFor } from '../my-health/symptom-topics';

export type SupportId = 'understand' | 'food' | 'care';

export interface SupportAction {
  id: SupportId;
  title: string;
  body: string;
  route: string;
  queryParams?: Record<string, string>;
}

/**
 * A question she can edit before saving, worded from what she recorded and nothing more.
 * It asks; it never suggests a cause (not fibroids, not a treatment change).
 */
export function draftQuestion(e: SymptomEntry): string | null {
  if (e.affected?.includes('work')) return 'My symptoms have affected my work or study. What could help with that?';
  if (e.affected?.includes('daily')) return 'My symptoms have got in the way of daily activities. What could help with that?';
  if (e.affected?.includes('sleep')) return 'My symptoms have affected my sleep. What could help with that?';
  if (e.bleeding === 'heavy' || e.bleeding === 'very-heavy') return 'I’ve had heavy bleeding on some days. What should I keep an eye on?';
  if (e.pain !== undefined && e.pain >= 7) return `I’ve had pain of ${e.pain} out of 10. What could help with the pain?`;
  if (e.treatmentChange?.trim()) return `I noted a treatment change (${e.treatmentChange.trim()}). Is there anything I should look out for?`;
  return null;
}

export interface SupportInput {
  entry: SymptomEntry;
  questions: AppointmentQuestion[];
  focus: readonly HelpFocus[];
  /** Actions already used today, so the same suggestion doesn't keep coming back. */
  usedToday: readonly SupportId[];
  topics?: SymptomTopic[];
}

/**
 * Up to two next steps after a check-in, chosen by explicit rules. Nothing is shown when nothing
 * recorded calls for it, and finishing without doing anything is always fine.
 */
export function supportActions(input: SupportInput): SupportAction[] {
  const { entry, questions, focus, usedToday } = input;
  const candidates: SupportAction[] = [];

  const topic = reviewedTopicFor(concernsIn(entry), input.topics);
  if (topic) {
    candidates.push({ id: 'understand', title: 'Understand what I’m experiencing', body: topic.title, route: topic.route });
  }

  const draft = draftQuestion(entry);
  const alreadySaved = !!draft && questions.some((q) => q.text.toLowerCase() === draft.toLowerCase());
  if (draft && !alreadySaved) {
    candidates.push({
      id: 'care',
      title: 'Prepare for care',
      body: 'Save a question about this for your gynae. Your check-ins already appear in your summary.',
      route: '/health/questions',
      queryParams: { from: 'today', draft },
    });
  }

  const lowEnergy = entry.fatigue === 'moderate' || entry.fatigue === 'severe' || !!entry.affected?.some((a) => a === 'daily' || a === 'work');
  if (lowEnergy || focus.includes('food')) {
    candidates.push({
      id: 'food',
      title: 'Make food easier today',
      body: 'Meals ready in 15 minutes or less that match your saved preferences.',
      route: '/nourish/quick',
      queryParams: { from: 'today' },
    });
  }

  // What she chose in onboarding goes first; otherwise understanding, then care, then food.
  const rank = (id: SupportId) =>
    (focus.includes('appointment') && id === 'care') || (focus.includes('food') && id === 'food') ? -1 : ['understand', 'care', 'food'].indexOf(id);
  return candidates
    .filter((a) => !usedToday.includes(a.id))
    .sort((a, b) => rank(a.id) - rank(b.id))
    .slice(0, 2);
}
