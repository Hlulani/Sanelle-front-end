import { dateRange, describePlanChoices, formatPlanDate, relativeDay } from './plan-format';

describe('plan format', () => {
  it('writes plan dates in words and leaves non-dates alone', () => {
    expect(formatPlanDate('2026-10-06', { weekday: 'long', day: 'numeric', month: 'long' })).toBe('Tuesday, October 6');
    expect(formatPlanDate('soon', { weekday: 'long' })).toBe('soon');
  });

  it('names today and tomorrow, then weekdays', () => {
    expect(relativeDay('2026-10-06', 'short', '2026-10-06')).toBe('Today');
    expect(relativeDay('2026-10-07', 'short', '2026-10-06')).toBe('Tomorrow');
    expect(relativeDay('2026-10-08', 'long', '2026-10-06')).toBe('Thursday');
  });

  it('writes a range', () => {
    expect(dateRange('2026-10-06', '2026-10-12')).toBe('Oct 6 – Oct 12');
  });

  it('describes only the choices she made', () => {
    expect(
      describePlanChoices({ fastingStyle: 'FASTING_16_8', proteinPreference: 'PESCATARIAN', maxPrepMinutes: 30 }),
    ).toBe('Lunch and dinner · pescatarian · up to 30 minutes');
    expect(
      describePlanChoices({ fastingStyle: 'NO_FASTING_3_MEALS', proteinPreference: 'ANY', maxPrepMinutes: null }),
    ).toBe('Breakfast, lunch and dinner · any eating style · any prep time');
  });
});
