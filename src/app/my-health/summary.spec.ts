import { HealthRecord, emptyHealthRecord } from './diagnosis.model';
import { buildSummary, summaryAsText } from './summary';

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
