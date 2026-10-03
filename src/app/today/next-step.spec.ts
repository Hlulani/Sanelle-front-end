import { nextStep } from './next-step';
import { HealthRecord, diagnosisProgress, emptyHealthRecord } from '../my-health/diagnosis.model';

function withFindings(states: Record<string, 'present' | 'unknown'>): HealthRecord {
  const r = emptyHealthRecord();
  for (const [key, state] of Object.entries(states)) {
    r.findings[key as keyof HealthRecord['findings']] = {
      key: key as never,
      completeness: state === 'present' ? { state: 'present', value: 'x' } : { state: 'unknown' },
    };
  }
  return r;
}

describe('diagnosisProgress', () => {
  it('counts "I don’t know" as answered and points at the first unanswered question', () => {
    const p = diagnosisProgress(withFindings({ count: 'present', largestSize: 'unknown' }));
    expect(p).toEqual({ answered: 2, total: 5, nextKey: 'location' });
  });

  it('has nothing left once all five are answered', () => {
    const all = withFindings({ count: 'present', largestSize: 'present', location: 'unknown', cavity: 'unknown', figo: 'unknown' });
    expect(diagnosisProgress(all).nextKey).toBeNull();
  });
});

describe('nextStep (top of Today)', () => {
  it('starts with the diagnosis when nothing is chosen or recorded', () => {
    expect(nextStep(emptyHealthRecord(), [])).toEqual({ kind: 'start' });
  });

  it('offers to carry on part-way through the questions', () => {
    expect(nextStep(withFindings({ count: 'present' }), ['diagnosis'])).toEqual({
      kind: 'continue',
      answered: 1,
      total: 5,
      nextKey: 'largestSize',
    });
  });

  it('suggests asking about a blank once all five are answered', () => {
    const all = withFindings({ count: 'present', largestSize: 'present', location: 'unknown', cavity: 'present', figo: 'present' });
    expect(nextStep(all, [])).toEqual({ kind: 'ask', key: 'location', question: 'Where are my fibroids?' });
  });

  it('leads with food when that is the first thing chosen', () => {
    expect(nextStep(emptyHealthRecord(), ['food'])).toEqual({ kind: 'food' });
  });

  it('follows pillar order, so diagnosis leads even if food was also chosen', () => {
    expect(nextStep(emptyHealthRecord(), ['diagnosis', 'food'])).toEqual({ kind: 'start' });
  });

  it('asks for the appointment date first for someone preparing for one', () => {
    expect(nextStep(emptyHealthRecord(), ['appointment'])).toEqual({ kind: 'appointment' });
    const dated = emptyHealthRecord();
    dated.appointment = { date: '2026-10-20' };
    expect(nextStep(dated, ['appointment'])).toEqual({ kind: 'start' });
  });
});
