import { emptyHealthRecord, HealthRecord } from '../my-health/diagnosis.model';
import { buildInsightsRequest, checkDraft } from './ai-drafts';

const TODAY = '2026-10-10';

const herRecord: HealthRecord = {
  ...emptyHealthRecord(),
  symptoms: [
    {
      date: '2026-10-08',
      observedSymptoms: ['Bleeding', 'Pain'],
      bleeding: 'heavy',
      dailyImpact: 'Couldn’t do usual activities',
      notes: 'Flooding at night, had to change pads twice',
    },
    { date: '2026-10-07', observedSymptoms: ['Bleeding'], bleeding: 'very-heavy', dailyImpact: 'Changed my plans' },
    { date: '2026-08-01', observedSymptoms: ['Pain'], notes: 'Older than 30 days' },
  ],
};

const explanations = [{ claimId: 'C36', title: 'Bleeding categories', summary: 'Your own words.' }];

describe('AI drafts', () => {
  it('sends only the last 30 days of check-ins, with the counts Sanelle already worked out', () => {
    const req = buildInsightsRequest(herRecord, explanations, TODAY);
    expect(req.checkins.map((c) => c.date)).toEqual(['2026-10-07', '2026-10-08']);
    expect(req.checkins[1]).toEqual({
      date: '2026-10-08',
      symptoms: ['Bleeding', 'Pain'],
      bleeding: 'heavy',
      dailyImpact: 'Couldn’t do usual activities',
      note: 'Flooding at night, had to change pads twice',
    });
    expect(req.facts.join(' ')).toContain('Heavy or very heavy bleeding on 2 of 2 check-ins');
    expect(req.facts.some((f) => f.startsWith('In my words'))).toBeFalse();
    expect(JSON.stringify(req)).not.toContain('Older than 30 days');
  });

  it('drops numbers the facts do not support and quotes she never wrote', () => {
    const req = buildInsightsRequest(herRecord, explanations, TODAY);
    // The window's first day appears in the facts only as a date, so it can't be used as a count.
    const day = /(\d+) Sep\w* to/.exec(req.facts.join(' '))![1];
    const out = checkDraft(
      {
        brief: 'Heavy bleeding on 5 of 7 days.',
        questions: [
          { text: 'What could help with heavy bleeding?', why: 'Heavy bleeding on 2 of 2 check-ins.' },
          { text: 'Why 9 days of pain?', why: '' },
          { text: `Why have I bled for ${day} days?`, why: '' },
        ],
        matches: [
          { claimId: 'C36', quote: 'flooding at night' },
          { claimId: 'C36', quote: 'soaked through everything' },
          { claimId: 'C99', quote: 'Flooding at night' },
        ],
      },
      req,
    );
    expect(out.brief).toBe('');
    expect(out.questions.map((q) => q.text)).toEqual(['What could help with heavy bleeding?']);
    expect(out.matches).toEqual([{ claimId: 'C36', quote: 'flooding at night' }]);
  });
});
