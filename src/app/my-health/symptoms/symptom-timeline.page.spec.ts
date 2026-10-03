import { buildTimeline, describeEntry } from './symptom-timeline.page';

describe('symptom timeline', () => {
  const today = new Date('2026-10-10T12:00:00');

  it('shows every day, with unlogged days left empty', () => {
    const days = buildTimeline([{ date: '2026-10-09', pain: 3 }], 3, today);
    expect(days.map((d) => d.date)).toEqual(['2026-10-10', '2026-10-09', '2026-10-08']);
    expect(days[0].entry).toBeUndefined();
    expect(days[0].parts).toEqual([]);
    expect(days[1].parts).toEqual(['Pain 3/10']);
  });

  it('describes an entry factually', () => {
    expect(describeEntry({ date: 'x', bleeding: 'heavy', pain: 6, affected: ['work'], treatmentChange: 'Iron tablets' }))
      .toEqual(['Heavy bleeding', 'Pain 6/10', 'Work or study affected', 'Treatment change']);
    expect(describeEntry({ date: 'x', bleeding: 'none' })).toEqual(['No bleeding']);
  });
});
