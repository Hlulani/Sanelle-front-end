import { addDays, daysBetween, isIsoDate, localIsoDate, parseLocalDate } from './calendar-date';

describe('calendar dates', () => {
  it('formats the local calendar date, not the UTC one', () => {
    // 00:30 on 5 October local time is still 4 October in UTC east of Greenwich.
    expect(localIsoDate(new Date(2026, 9, 5, 0, 30))).toBe('2026-10-05');
  });

  it('parses to local midnight', () => {
    const d = parseLocalDate('2026-10-05');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 5, 0]);
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts whole days between dates', () => {
    expect(daysBetween('2026-10-05', '2026-10-12')).toBe(7);
    expect(daysBetween('2026-10-12', '2026-10-05')).toBe(-7);
  });

  it('accepts only real dates in YYYY-MM-DD form', () => {
    expect(isIsoDate('2026-10-05')).toBeTrue();
    expect(isIsoDate('2026-02-30')).toBeFalse();
    expect(isIsoDate('5 Oct 2026')).toBeFalse();
    expect(isIsoDate('')).toBeFalse();
  });
});
