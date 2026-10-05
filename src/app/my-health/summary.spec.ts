import { HealthRecord, emptyHealthRecord } from './diagnosis.model';
import { buildSummary, summariseSymptoms, summaryAsText } from './summary';
import { localIsoDate } from '../shared/calendar-date';

function record(partial: Partial<HealthRecord>): HealthRecord {
  return { ...emptyHealthRecord(), ...partial };
}

describe('buildSummary', () => {
  it('lists every unrecorded finding as not recorded, never as a negative', () => {
    const s = buildSummary(emptyHealthRecord());
    expect(s.notRecorded).toEqual(['Fibroids', 'Largest', 'Location', 'Uterine cavity', 'FIGO type']);
    const text = summaryAsText(s).toLowerCase();
    expect(text).not.toContain('not affected');
    expect(text).not.toContain('no cavity');
    expect(text).not.toContain('says none');
  });

  it('keeps an unknown cavity out of the findings even when other details exist', () => {
    const s = buildSummary(
      record({
        findings: {
          count: { key: 'count', completeness: { state: 'present', value: '2' }, source: 'entered-from-report' },
          cavity: { key: 'cavity', completeness: { state: 'unknown' } },
        },
      }),
    );
    expect(s.notRecorded).toContain('Uterine cavity');
    expect(s.fromReport.map((l) => l.label)).not.toContain('Uterine cavity');
  });

  it('separates report findings from what the person was told', () => {
    const s = buildSummary(
      record({
        findings: {
          count: { key: 'count', completeness: { state: 'present', value: '2' }, source: 'entered-from-report', originalWording: 'Two intramural fibroids' },
          location: { key: 'location', completeness: { state: 'present', value: 'in the wall' }, source: 'told-by-clinician' },
        },
      }),
    );
    expect(s.fromReport.map((l) => l.label)).toEqual(['Fibroids']);
    expect(s.fromReport[0].wording).toBe('Two intramural fibroids');
    expect(s.personallyReported.map((l) => l.label)).toEqual(['Location']);
  });

  it('only reports an absent cavity when the report explicitly said so', () => {
    const s = buildSummary(
      record({ findings: { cavity: { key: 'cavity', completeness: { state: 'absent' }, source: 'entered-from-report' } } }),
    );
    expect(s.fromReport[0].text).toBe('Report says it isn’t affected');
  });

  it('never claims clinical verification', () => {
    const text = summaryAsText(buildSummary(emptyHealthRecord())).toLowerCase();
    expect(text).toContain('not been checked by a clinician');
    expect(text).not.toContain('verified');
  });

  it('keeps question order', () => {
    const s = buildSummary(
      record({
        questions: [
          { id: 'a', text: 'Second?', origin: 'custom', createdAt: '' },
          { id: 'b', text: 'First?', origin: 'custom', createdAt: '' },
        ],
      }),
    );
    expect(s.questions).toEqual(['Second?', 'First?']);
  });

  it('defaults to three unanswered priorities and excludes earlier answers and visits', () => {
    const s = buildSummary(record({
      questions: [
        { id: 'answered', text: 'Earlier question', answer: 'Private earlier answer', origin: 'custom', createdAt: '' },
        ...['First', 'Second', 'Third', 'Fourth'].map((text, index) => ({ id: String(index), text, origin: 'custom' as const, createdAt: '' })),
      ],
      visits: [{ date: '2026-10-01', discussion: 'Private earlier visit', nextSteps: '', followUp: '' }],
    }));
    expect(s.questions).toEqual(['First', 'Second', 'Third']);
    expect(s.answeredQuestions).toEqual([]);
    expect(s.previousVisits).toEqual([]);
    expect(summaryAsText(s)).not.toContain('Private earlier');
  });

  it('honours an empty selection and retains list order when selected priorities are reordered', () => {
    const r = record({
      questions: ['a', 'b', 'c', 'd'].map((id) => ({ id, text: id, origin: 'custom', createdAt: '' })),
      summaryQuestionIds: ['d', 'b'],
    });
    expect(buildSummary(r).questions).toEqual(['b', 'd']);
    expect(buildSummary({ ...r, questions: [...r.questions].reverse() }).questions).toEqual(['d', 'b']);
    expect(buildSummary({ ...r, summaryQuestionIds: [] }).questions).toEqual([]);
  });

  it('puts the goal, questions and symptoms ahead of supporting report details', () => {
    const today = new Date();
    const date = localIsoDate(today);
    const text = summaryAsText(buildSummary(record({
      visitGoal: 'My main concern',
      questions: [{ id: 'q', text: 'My priority question?', origin: 'custom', createdAt: '' }],
      symptoms: [{ date, pain: 7 }],
      findings: { count: { key: 'count', completeness: { state: 'present', value: 'My report value' }, source: 'entered-from-report' } },
    })));
    expect(text.indexOf('My main concern')).toBeLessThan(text.indexOf('My priority question?'));
    expect(text.indexOf('My priority question?')).toBeLessThan(text.indexOf('Pain (0 to 10)'));
    expect(text.indexOf('Pain (0 to 10)')).toBeLessThan(text.indexOf('My report value'));
  });

  it('brings priorities, unanswered questions, answers and latest visit into the shared document', () => {
    const s = buildSummary(record({
      visitGoal: 'Discuss the impact on work',
      summaryAnswerIds: ['a'], summaryVisitDates: ['2026-10-01'],
      questions: [
        { id: 'a', text: 'What are my options?', answer: 'We discussed monitoring', origin: 'custom', createdAt: '' },
        { id: 'b', text: 'What should I ask next?', origin: 'custom', createdAt: '' },
      ],
      visits: [
        { date: '2026-09-01', discussion: 'Older visit', nextSteps: '', followUp: '' },
        { date: '2026-10-01', discussion: 'Discussed symptoms', nextSteps: 'Arrange a follow-up', followUp: 'Bring the report' },
      ],
    }));
    expect(s.questions).toEqual(['What should I ask next?']);
    expect(s.answeredQuestions).toEqual([{ question: 'What are my options?', answer: 'We discussed monitoring' }]);
    const text = summaryAsText(s);
    expect(text).toContain('Discuss the impact on work');
    expect(text).toContain('We discussed monitoring');
    expect(text).toContain('Arrange a follow-up');
    expect(text).toContain('Bring the report');
    expect(text).not.toContain('Older visit');
  });
});

describe('summariseSymptoms', () => {
  const today = new Date('2026-10-10T12:00:00');

  it('returns nothing when no day in the period was logged', () => {
    expect(summariseSymptoms([], today)).toBeNull();
    expect(summariseSymptoms([{ date: '2026-08-01', pain: 5 }], today)).toBeNull();
  });

  it('counts logged days only and says missing days are not counted', () => {
    const s = summariseSymptoms(
      [
        { date: '2026-10-01', bleeding: 'heavy', pain: 6 },
        { date: '2026-10-02', bleeding: 'very-heavy', pain: 8, affected: ['work', 'sleep'] },
        { date: '2026-10-05', bleeding: 'none', pain: 2, affected: [] },
      ],
      today,
    )!;
    expect(s.coverage).toBe("3 check-ins in the last 30 days. Days without a check-in are unknown and aren't counted.");
    expect(s.lines).toContain('Bleeding: on 2 of 3 check-ins, heavy or very heavy on 2 (very heavy on 1).');
    expect(s.lines).toContain('Pain (0 to 10): recorded on 3 of 3 check-ins, ranging 2 to 8; 7 or more on 1.');
    expect(s.lines).toContain('Affected: sleep on 1 of 3 check-ins, work or study on 1 of 3 check-ins. Not recorded on 1 of 3 check-ins; these are unknown.');
  });

  it('leaves out fields that were never recorded instead of reporting them as none', () => {
    const s = summariseSymptoms([{ date: '2026-10-09', pain: 4 }], today)!;
    expect(s.lines.join(' ')).not.toMatch(/bleeding|bloating|tiredness|affected/i);
  });

  it('makes no claims about causes', () => {
    const s = summariseSymptoms([{ date: '2026-10-09', pain: 9, bleeding: 'heavy', notes: 'after dairy' }], today)!;
    const text = [s.coverage, ...s.lines].join(' ').toLowerCase();
    for (const word of ['because', 'caused', 'due to', 'improv', 'worse', 'better', 'dairy', 'inflam']) {
      expect(text).not.toContain(word);
    }
  });

  it('states missing fields within recorded days and preserves notes as the person’s words', () => {
    const s = summariseSymptoms([
      { date: '2026-10-08', bleeding: 'heavy', notes: 'Had to leave work early' },
      { date: '2026-10-09', pain: 4 },
    ], today)!;
    expect(s.lines.find((line) => line.startsWith('Bleeding:'))).toContain('Not recorded on 1 of 2 check-ins; these are unknown.');
    expect(s.notes).toEqual(['8 Oct: Had to leave work early']);
  });
});

describe('check-ins in the summary', () => {
  it('excludes every part of a deselected check-in and labels the counts as selected entries', () => {
    const today = new Date();
    const date = localIsoDate(today);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const otherDate = localIsoDate(yesterday);
    const r = record({ symptoms: [{ date, pain: 2 }, { date: otherDate, pain: 9, notes: 'Private note', treatmentChange: 'Private change' }], summarySymptomDates: [date] });
    const s = buildSummary(r);
    expect(s.symptoms?.coverage).toContain('Selected entries only.');
    expect(s.symptoms?.lines.join(' ')).toContain('at 2');
    expect(summaryAsText(s)).not.toContain('Private');
    expect(buildSummary({ ...r, summarySymptomDates: [] }).symptoms).toBeNull();
  });
  it('uses the selected period and removes symptom notes along with excluded check-ins', () => {
    const today = new Date();
    const older = new Date(today);
    older.setDate(older.getDate() - 40);
    const date = localIsoDate(older);
    const r = record({ symptoms: [{ date, notes: 'A note from an earlier check-in' }], summaryPeriodDays: 90 });
    expect(summaryAsText(buildSummary(r))).toContain('A note from an earlier check-in');
    expect(buildSummary({ ...r, summaryPeriodDays: 30 }).symptoms).toBeNull();
    expect(summaryAsText(buildSummary({ ...r, summaryIncludesCheckins: false }))).not.toContain('A note from an earlier check-in');
  });
  it('leaves them out when she switches them off, and keeps everything else', () => {
    const today = new Date();
    const date = localIsoDate(today);
    const record = { ...emptyHealthRecord(), symptoms: [{ date, fatigue: 'severe' as const, affected: ['work' as const] }], questions: [{ id: '1', text: 'Q?', origin: 'custom' as const, createdAt: '' }] };
    expect(buildSummary(record).symptoms).not.toBeNull();
    const off = buildSummary({ ...record, summaryIncludesCheckins: false });
    expect(off.symptoms).toBeNull();
    expect(off.questions).toEqual(['Q?']);
    expect(summaryAsText(off)).not.toContain('Symptoms I logged');
  });
});
