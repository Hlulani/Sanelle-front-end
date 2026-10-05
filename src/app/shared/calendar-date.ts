/**
 * Calendar dates as 'YYYY-MM-DD' strings in the device's own time zone. Plans, check-ins,
 * tasks and challenges are all keyed by these, so they're compared as strings and never
 * through toISOString(), which uses UTC and is a day behind just after midnight east of UTC.
 */

/** The local calendar date of `date` (today by default). */
export function localIsoDate(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight on that date. An invalid string gives an invalid Date. */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** True for a real calendar date written as 'YYYY-MM-DD' ("2026-02-30" is not one). */
export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && localIsoDate(parseLocalDate(value)) === value;
}

export function addDays(iso: string, days: number): string {
  const date = parseLocalDate(iso);
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
}

/** Whole days from one date to another; rounding absorbs daylight-saving hours. */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseLocalDate(toIso).getTime() - parseLocalDate(fromIso).getTime()) / 86_400_000);
}
