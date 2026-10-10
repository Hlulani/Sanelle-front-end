import { emptyHealthRecord, HealthRecord, SymptomEntry } from '../my-health/diagnosis.model';
import { draftVisitBrief, matchExplanations, suggestQuestions } from './records-assistant';

const TODAY = '2026-10-10';

function record(symptoms: SymptomEntry[], extra: Partial<HealthRecord> = {}): HealthRecord {
  return { ...emptyHealthRecord(), symptoms, ...extra };
}

// Entries as the quick check-in saves them: what showed up, bleeding level, effect on the day, a note.
const heavyWeek: SymptomEntry[] = [
  {
    date: '2026-10-08',
    observedSymptoms: ['Bleeding', 'Pain'],
    bleeding: 'heavy',
    dailyImpact: 'Couldn’t do usual activities',
    notes: 'Flooding at night, had to change pads twice',
  },
  {
    date: '2026-10-07',
    observedSymptoms: ['Bleeding', 'Pain', 'Low energy'],
    bleeding: 'very-heavy',
    dailyImpact: 'Changed my plans',
  },
  {
    date: '2026-10-05',
    observedSymptoms: ['Low energy'],
    dailyImpact: 'Slowed me down',
    treatmentChange: 'Started iron tablets',
  },
  { date: '2026-10-02', observedSymptoms: ['Pelvic pressure'], notes: 'Felt dizzy on the stairs' },
];

describe('records assistant', () => {
  it('suggests nothing without check-ins', () => {
    expect(suggestQuestions(record([]), TODAY)).toEqual([]);
    expect(draftVisitBrief(record([]), TODAY)).toBeNull();
  });

  it('bases each suggested question on counts with their denominators', () => {
    const qs = suggestQuestions(record(heavyWeek), TODAY);
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.length).toBeLessThanOrEqual(3);
    const bleeding = qs.find((q) => q.text.includes('heavy bleeding'))!;
    expect(bleeding.why).toBe(
      'You recorded heavy or very heavy bleeding on 2 of the 2 check-ins with a bleeding answer.',
    );
    const pain = qs.find((q) => q.text.includes('pain'))!;
    expect(pain.text).toBe('What could help with pain that disrupts my days?');
    expect(pain.why).toBe(
      'You recorded pain on 2 of your 4 check-ins, and on 2 of those days it changed your plans or stopped usual activities.',
    );
  });

  it('never repeats a question she already saved', () => {
    const first = suggestQuestions(record(heavyWeek), TODAY)[0];
    const saved = record(heavyWeek, {
      questions: [{ id: 'q', text: first.text, origin: 'custom', status: 'open', createdAt: TODAY }],
    });
    expect(suggestQuestions(saved, TODAY).map((q) => q.text)).not.toContain(first.text);
  });

  it('never names a cause or a diagnosis', () => {
    const text = [
      ...suggestQuestions(record(heavyWeek), TODAY).flatMap((q) => [q.text, q.why]),
      draftVisitBrief(record(heavyWeek), TODAY)!,
    ].join(' ');
    expect(text).not.toMatch(/\b(caused by|because of your fibroid|you have anaemia|you are anaemic|diagnos)/i);
  });

  it('matches her own words to published explanations only, quoting them', () => {
    const all = matchExplanations(record(heavyWeek), () => true, TODAY);
    expect(all.map((m) => m.claimId)).toEqual(jasmine.arrayContaining(['C36', 'C12']));
    expect(all.find((m) => m.claimId === 'C36')!.quote).toContain('Flooding at night');
    expect(all.find((m) => m.claimId === 'C12')!.quote).toContain('dizzy');
    const onlyC12 = matchExplanations(record(heavyWeek), (id) => id === 'C12', TODAY);
    expect(onlyC12.map((m) => m.claimId)).toEqual(['C12']);
  });

  it('still reads older detailed entries with pain scores', () => {
    const older: SymptomEntry[] = [
      { date: '2026-10-08', pain: 8, affected: ['work'] },
      { date: '2026-10-06', pain: 7, affected: ['work'] },
    ];
    expect(suggestQuestions(record(older), TODAY).map((q) => q.text)).toContain(
      'What could help with pain that disrupts my days?',
    );
  });

  it('drafts a brief from her records, including her own words', () => {
    const brief = draftVisitBrief(record(heavyWeek), TODAY)!;
    expect(brief).toContain('My main concern: heavy bleeding, and how it disrupts my days.');
    expect(brief).toContain('I checked in on 4 of the last 30 days');
    expect(brief).toContain('Heavy or very heavy bleeding on 2 of 2 check-ins with a bleeding answer.');
    expect(brief).toContain('on 2 of 3 check-ins recording the effect on my day');
    expect(brief).toContain('Started iron tablets');
    expect(brief).toContain('“Flooding at night, had to change pads twice”');
  });
});
