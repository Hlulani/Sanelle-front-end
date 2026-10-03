import { HealthRecord, emptyHealthRecord } from './diagnosis.model';
import { buildSummary, summariseSymptoms, summaryAsText } from './summary';

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
    expect(s.lines).toContain('Affected: sleep on 1 of 3 check-ins, work or study on 1 of 3 check-ins.');
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
});

describe('check-ins in the summary', () => {
  it('leaves them out when she switches them off, and keeps everything else', () => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const record = { ...emptyHealthRecord(), symptoms: [{ date, fatigue: 'severe' as const, affected: ['work' as const] }], questions: [{ id: '1', text: 'Q?', origin: 'custom' as const, createdAt: '' }] };
    expect(buildSummary(record).symptoms).not.toBeNull();
    const off = buildSummary({ ...record, summaryIncludesCheckins: false });
    expect(off.symptoms).toBeNull();
    expect(off.questions).toEqual(['Q?']);
    expect(summaryAsText(off)).not.toContain('Symptoms I logged');
  });
});
