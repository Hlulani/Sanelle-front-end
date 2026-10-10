import { emptyHealthRecord, HealthRecord } from './diagnosis.model';
import { buildSummary, summaryAsText } from './summary';
import { addDays } from '../shared/calendar-date';
import { symptomStats, symptomWindow, statsSentence } from './symptoms/symptom-stats';
const TODAY = '2026-10-08';
function record(partial: Partial<HealthRecord>): HealthRecord {
  return { ...emptyHealthRecord(), ...partial };
}
describe('Appointment summary and symptom denominators', () => {
  it('keeps unknowns separate from explicit negative findings', () => {
    const s = buildSummary(
      record({ findings: { cavity: { key: 'cavity', completeness: { state: 'unknown' } } } }),
      TODAY,
    );
    expect(s.missing).toContain('Uterine cavity');
    expect(s.recorded.length).toBe(0);
    expect(summaryAsText(s)).not.toContain('Report says not affected');
  });
  it('excludes unchecked transcription and preserves units and source for checked details', () => {
    const s = buildSummary(
      record({
        findings: {
          count: { key: 'count', completeness: { state: 'present', value: '2' }, needsChecking: true },
          largestSize: {
            key: 'largestSize',
            completeness: { state: 'present', value: '41 × 38' },
            unit: 'mm',
            source: 'entered-from-report',
          },
          location: {
            key: 'location',
            completeness: { state: 'present', value: 'posterior' },
            source: 'told-by-clinician',
          },
        },
      }),
      TODAY,
    );
    expect(s.missing).toContain('Number of fibroids');
    expect(s.recorded[0].value).toBe('41 × 38 mm');
    expect(s.recorded[1].source).toBe('told at an appointment');
  });
  it('preserves an explicit cavity statement without inferring other findings', () => {
    const s = buildSummary(
      record({
        findings: { cavity: { key: 'cavity', completeness: { state: 'absent' }, source: 'entered-from-report' } },
      }),
      TODAY,
    );
    expect(s.recorded[0].value).toBe('Report says not affected');
    expect(s.missing).toContain('Location');
  });
  it('separates open, answered and unresolved questions and keeps order', () => {
    const s = buildSummary(
      record({
        questions: [
          { id: '1', text: 'First', origin: 'custom', createdAt: TODAY },
          { id: '2', text: 'Answered', answer: 'Exact wording', origin: 'custom', createdAt: TODAY },
          { id: '3', text: 'Later', status: 'unresolved', origin: 'custom', createdAt: TODAY },
          { id: '4', text: 'Second', origin: 'custom', createdAt: TODAY },
        ],
      }),
      TODAY,
    );
    expect(s.questions).toEqual(['First', 'Second']);
    expect(s.answers).toEqual([{ question: 'Answered', answer: 'Exact wording' }]);
    expect(s.unresolved).toEqual(['Later']);
  });
  it('includes the concern, exact result, plan and review date without interpretation', () => {
    const s = buildSummary(
      record({
        visitGoal: 'Pain affects work',
        results: [
          {
            id: 'r',
            name: 'Haemoglobin',
            value: '10.2',
            unit: 'g/dL',
            testDate: '2026-10-01',
            source: 'My report',
            savedAt: TODAY,
          },
        ],
        tasks: [{ id: 't', title: 'Discuss the result', createdAt: TODAY, dueDate: '2026-11-01' }],
      }),
      TODAY,
    );
    const text = summaryAsText(s);
    expect(text).toContain('Pain affects work');
    expect(text).toContain('10.2 g/dL');
    expect(text).toContain('1 November 2026');
    expect(text).toContain('nothing in it has been checked by a clinician');
  });
  it('uses field-specific denominators for 12 check-ins, 10 bleeding answers and 3 heavy answers', () => {
    const entries = Array.from({ length: 12 }, (_, i) => ({
      date: addDays(TODAY, -i),
      ...(i < 10 ? { bleeding: i < 3 ? ('heavy' as const) : ('none' as const) } : { notes: 'No bleeding answer' }),
    }));
    const stats = symptomStats(entries, TODAY);
    expect(stats.recordedDays).toBe(12);
    expect(stats.missingDays).toBe(18);
    expect(stats.bleeding.answered).toBe(10);
    expect(stats.bleeding.heavy).toBe(3);
    expect(statsSentence(stats).join(' ')).toContain('Of the 10 check-ins with a bleeding answer, 3 recorded');
  });
  it('distinguishes no entry, omitted bleeding and an explicit none answer', () => {
    const days = symptomWindow(
      [
        { date: TODAY, bleeding: 'none' },
        { date: addDays(TODAY, -1), pain: 0 },
      ],
      TODAY,
    );
    expect(days[29].mark).toBe('none');
    expect(days[28].mark).toBe('no-bleeding-answer');
    expect(days[27].mark).toBe('no-entry');
  });
  it('ignores outside-window and future observations and counts a date once', () => {
    const s = symptomStats(
      [
        { date: TODAY, pain: 0 },
        { date: TODAY, pain: 5 },
        { date: addDays(TODAY, 1), bleeding: 'heavy' },
        { date: addDays(TODAY, -30), bleeding: 'heavy' },
      ],
      TODAY,
    );
    expect(s.recordedDays).toBe(1);
    expect(s.pain.max).toBe(5);
    expect(s.bleeding.answered).toBe(0);
  });
  it('allows the person to exclude check-ins from the shared summary', () => {
    expect(
      buildSummary(record({ summaryIncludesCheckins: false, symptoms: [{ date: TODAY, bleeding: 'heavy' }] }), TODAY)
        .symptoms,
    ).toBeNull();
  });
});
