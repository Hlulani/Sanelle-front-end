import { GenerateMealPlanRequest } from '../core/services/meal-plans.service';
import { addDays, isIsoDate, localIsoDate, parseLocalDate } from '../shared/calendar-date';

/** A plan date in words, e.g. "Tuesday, October 6"; anything that isn't a date is shown as it is. */
export function formatPlanDate(iso: string, options: Intl.DateTimeFormatOptions): string {
  return isIsoDate(iso) ? new Intl.DateTimeFormat('en-US', options).format(parseLocalDate(iso)) : iso;
}

/** "Today", "Tomorrow", or the weekday. */
export function relativeDay(iso: string, weekday: 'long' | 'short', today = localIsoDate()): string {
  if (iso === today) return 'Today';
  if (iso === addDays(today, 1)) return 'Tomorrow';
  return formatPlanDate(iso, { weekday });
}

/** "Oct 6 – Oct 12". */
export function dateRange(first: string, last: string, separator = ' – '): string {
  const short = { month: 'short', day: 'numeric' } as const;
  return `${formatPlanDate(first, short)}${separator}${formatPlanDate(last, short)}`;
}

export type PlanChoices = Pick<GenerateMealPlanRequest, 'fastingStyle' | 'proteinPreference' | 'maxPrepMinutes'>;

/** The person's own choices in one line: "Lunch and dinner · pescatarian · up to 30 minutes". */
export function describePlanChoices({ fastingStyle, proteinPreference, maxPrepMinutes }: PlanChoices): string {
  const meals = fastingStyle === 'NO_FASTING_3_MEALS' ? 'Breakfast, lunch and dinner' : 'Lunch and dinner';
  const diet = proteinPreference === 'ANY' ? 'any eating style' : proteinPreference.toLowerCase();
  const prep = maxPrepMinutes ? `up to ${maxPrepMinutes} minutes` : 'any prep time';
  return `${meals} · ${diet} · ${prep}`;
}
