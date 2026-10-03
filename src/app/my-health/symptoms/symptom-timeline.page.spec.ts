import { dayLabel } from './symptom-timeline.page';

describe('symptom history', () => {
  const today = new Date('2026-10-10T12:00:00');

  it('labels recorded days compactly', () => {
    expect(dayLabel('2026-10-10', today)).toBe('Today');
    expect(dayLabel('2026-10-09', today)).toBe('Yesterday');
    expect(dayLabel('2026-10-03', today)).toBe('Sat 3 Oct');
  });
});
