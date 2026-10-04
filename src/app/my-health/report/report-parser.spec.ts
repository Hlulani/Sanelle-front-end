import { suggestReportFindings } from './report-parser';

describe('Report suggestions', () => {
  it('keeps explicit statements with their wording and units', () => {
    const text = 'Two intramural fibroids are noted. The largest fibroid measures 41 x 36 mm. The uterine cavity is not distorted. FIGO type 2.';
    const suggestions = suggestReportFindings(text);
    expect(suggestions.find((s) => s.key === 'count')?.completeness).toEqual({ state: 'present', value: 'Two intramural fibroids' });
    expect(suggestions.find((s) => s.key === 'largestSize')?.completeness).toEqual({ state: 'present', value: '41 x 36 mm' });
    expect(suggestions.find((s) => s.key === 'largestSize')?.wording).toBe('The largest fibroid measures 41 x 36 mm.');
    expect(suggestions.find((s) => s.key === 'cavity')?.completeness).toEqual({ state: 'absent' });
    expect(suggestions.find((s) => s.key === 'figo')?.completeness).toEqual({ state: 'present', value: 'FIGO type 2' });
  });

  it('does not infer missing findings or a largest size from unlabelled measurements', () => {
    const suggestions = suggestReportFindings('Two fibroids measure 3 cm and 4 cm.');
    expect(suggestions.map((s) => s.key)).toEqual(['count']);
    expect(suggestReportFindings('No information about the uterine cavity.')).toEqual([]);
  });

  it('leaves conflicting statements separate for the person to choose', () => {
    const suggestions = suggestReportFindings('Two fibroids were noted. Three fibroids are noted.');
    expect(suggestions.filter((s) => s.key === 'count').length).toBe(2);
  });

  it('does not turn negated or uncertain statements into positive findings', () => {
    expect(suggestReportFindings('No intramural fibroids are noted. FIGO type 2 is not reported.')).toEqual([]);
    expect(suggestReportFindings('Possible two fibroids, largest fibroid 4.1 cm.')).toEqual([]);
    expect(suggestReportFindings('The uterine cavity may be distorted.')).toEqual([]);
  });

  it('does not assign measurements from other structures to a fibroid', () => {
    const suggestions = suggestReportFindings('The largest fibroid measures 3 cm and the ovary measures 4 cm.');
    expect(suggestions.find((s) => s.key === 'largestSize')).toBeUndefined();
  });
});
