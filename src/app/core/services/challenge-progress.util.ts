import { addDays, daysBetween, localIsoDate } from '../../shared/calendar-date';
// 'meals-in-period': counts individual cooked meals (multiple meals on the
// same day each count). 'days-in-period': counts distinct days with at least
// one cooked meal. 'streak': longest run of consecutive cooked days.
export type ChallengeType = 'meals-in-period' | 'days-in-period' | 'streak';

export interface ChallengeProgress {
  current: number;
  target: number;
  daysRemaining: number;
  completed: boolean;
  expired: boolean;
}

export interface CookedEntry {
  date: string;
  mealId: string;
}

/**
 * Pure progress calculation shared by built-in and user-created challenges —
 * both track type/target/durationDays the same way, they just differ in how
 * a user gets a `joinedAtIso` recorded (built-in: joining a fixed catalog
 * entry; custom: creating or redeeming an invite code). Neither the challenge
 * source nor the join mechanism belongs in this function.
 */
export function computeChallengeProgress(
  type: ChallengeType,
  target: number,
  durationDays: number,
  joinedAtIso: string,
  cookedEntries: CookedEntry[],
): ChallengeProgress {
  const windowEndIso = addDays(joinedAtIso, durationDays - 1);
  const elapsedDays = daysBetween(joinedAtIso, localIsoDate()) + 1;
  const daysRemaining = Math.max(0, durationDays - elapsedDays);

  const entriesInWindow = cookedEntries.filter((entry) => entry.date >= joinedAtIso && entry.date <= windowEndIso);

  let current: number;
  if (type === 'meals-in-period') {
    current = entriesInWindow.length;
  } else {
    const datesInWindow = Array.from(new Set(entriesInWindow.map((entry) => entry.date)));
    current =
      type === 'streak' ? longestStreakInWindow(datesInWindow, joinedAtIso, windowEndIso) : datesInWindow.length;
  }

  const completed = current >= target;
  const expired = !completed && elapsedDays > durationDays;

  return {
    current: Math.min(current, target),
    target,
    daysRemaining,
    completed,
    expired,
  };
}

function longestStreakInWindow(cookedDates: string[], startIso: string, endIso: string): number {
  const cookedSet = new Set(cookedDates);
  let longest = 0;
  let running = 0;
  for (let day = startIso; day <= endIso; day = addDays(day, 1)) {
    if (cookedSet.has(day)) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }
  return longest;
}
