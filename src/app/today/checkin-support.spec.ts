import { draftQuestion, supportActions } from './checkin-support';
import { SymptomTopic } from '../my-health/symptom-topics';

const reviewed: SymptomTopic = {
  concern: 'tiredness',
  title: 'Tiredness and heavy periods',
  route: '/learn/tiredness',
  sources: [],
  review: { state: 'reviewed', researchedOn: '2026-10-01', reviewedOn: '2026-10-02', reviewedBy: 'Dr Test' },
};
const draft: SymptomTopic = { ...reviewed, review: { state: 'draft', researchedOn: '2026-10-01' } };

describe('supportActions', () => {
  const entry = { date: '2026-10-14', fatigue: 'severe' as const, affected: ['work' as const] };

  it('never suggests unreviewed content, and shows nothing to understand when none is reviewed', () => {
    const ids = (topics: SymptomTopic[]) =>
      supportActions({ entry, questions: [], focus: [], usedToday: [], topics }).map((a) => a.id);
    expect(ids([])).toEqual(['care', 'food']);
    expect(ids([draft])).toEqual(['care', 'food']);
    expect(ids([reviewed])).toEqual(['understand', 'care']);
  });

  it('shows at most two, putting what she chose in onboarding first', () => {
    const actions = supportActions({ entry, questions: [], focus: ['food'], usedToday: [], topics: [reviewed] });
    expect(actions.map((a) => a.id)).toEqual(['food', 'understand']);
  });

  it('doesn’t offer a question that is already saved, or an action used today', () => {
    const q = draftQuestion(entry)!;
    const saved = [{ id: '1', text: q, origin: 'custom' as const, createdAt: '' }];
    expect(supportActions({ entry, questions: saved, focus: [], usedToday: ['food'], topics: [] })).toEqual([]);
  });

  it('suggests nothing when nothing recorded calls for it', () => {
    expect(
      supportActions({
        entry: { date: 'x', pain: 1, fatigue: 'mild' },
        questions: [],
        focus: [],
        usedToday: [],
        topics: [],
      }),
    ).toEqual([]);
  });

  it('words questions from the record without suggesting a cause', () => {
    expect(draftQuestion({ date: 'x', affected: ['work'] })).toBe(
      'My symptoms have affected my work or study. What could help with that?',
    );
    expect(draftQuestion({ date: 'x', treatmentChange: 'Started iron tablets' })).toContain('(Started iron tablets)');
    for (const e of [
      { date: 'x', bleeding: 'heavy' as const },
      { date: 'x', pain: 8 },
      { date: 'x', treatmentChange: 'x' },
    ]) {
      expect(draftQuestion(e)!).not.toMatch(/fibroid|because|caused|due to/i);
    }
  });
});
