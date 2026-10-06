import { checkinsInWindow, coverageLine, impactLine, observations, symptomParts } from './checkins';
import { SymptomEntry } from './diagnosis.model';

const today = new Date('2026-10-14T12:00:00');

describe('check-in counts', () => {
  it('keeps only recorded days in the window, newest first, and states coverage once', () => {
    const entries: SymptomEntry[] = [
      { date: '2026-10-14', pain: 3 },
      { date: '2026-09-20', pain: 5 },
      { date: '2026-10-02', fatigue: 'mild' },
    ];
    const w = checkinsInWindow(entries, 14, today);
    expect(w.map((e) => e.date)).toEqual(['2026-10-14', '2026-10-02']);
    expect(coverageLine(1, 14)).toBe('1 check-in recorded in the last 14 days.');
  });

  it('leads with what affected daily life', () => {
    expect(impactLine({ date: 'x', affected: ['work'] })).toBe('Work or study was affected');
    expect(impactLine({ date: 'x', affected: ['sleep', 'work'] })).toBe('Sleep and Work or study were affected');
    expect(impactLine({ date: 'x', affected: [] })).toBe('Didn’t get in the way of sleep, work or daily activities');
    expect(impactLine({ date: 'x' })).toBeNull();
  });

  it('describes symptoms without listing "none" levels', () => {
    expect(symptomParts({ date: 'x', bleeding: 'heavy', pain: 6, fatigue: 'none', bloating: 'mild' })).toEqual([
      'Heavy bleeding',
      'Pain 6/10',
      'Mild pressure or bloating',
    ]);
  });
});

describe('observations', () => {
  it('needs at least two check-ins', () => {
    expect(observations([{ date: '2026-10-14', fatigue: 'severe', affected: ['work'] }])).toEqual([]);
  });

  it('always uses check-ins as the denominator and only describes co-occurrence', () => {
    const w: SymptomEntry[] = [
      { date: '1', fatigue: 'moderate', affected: ['work'] },
      { date: '2', fatigue: 'mild', affected: ['work'] },
      { date: '3', fatigue: 'severe' },
      { date: '4', fatigue: 'mild', pain: 2 },
      { date: '5', pain: 7 },
      { date: '6', fatigue: 'none' },
    ];
    const lines = observations(w);
    expect(lines).toContain(
      'You recorded tiredness on 4 of your 6 check-ins. On 2 of those days, you said work or study was affected.',
    );
    expect(lines).toContain('Pain was recorded on 2 of your 6 check-ins, from 2 to 7 out of 10.');
    expect(lines.filter((l) => l.startsWith('Work or study was affected'))).toEqual([]);
    expect(lines.join(' ')).not.toMatch(/because|caused|improv|better|worse|trend|days without/i);
  });
});

describe('impact on its own', () => {
  it('is listed when no symptom line already mentions it', () => {
    const lines = observations([
      { date: '1', affected: ['sleep'] },
      { date: '2', pain: 3 },
    ]);
    expect(lines).toContain('Sleep was affected on 1 of your 2 check-ins.');
  });
});
