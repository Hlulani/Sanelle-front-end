import { Finding } from './diagnosis.model';

/**
 * DEMO RECORDS. Example data for presenting the design before diagnosis
 * records are stored. Shown only when environment.showDemoRecords is true,
 * and always labelled "Demo" in the UI. Not real patient data.
 */
export const DEMO_APPOINTMENT = {
  inDays: 6,
  with: 'your gynaecologist',
};

export const DEMO_FINDINGS: Finding[] = [
  {
    key: 'count',
    label: 'Number of fibroids',
    completeness: { state: 'present', value: '2' },
    source: 'entered-from-report',
    originalWording: 'Two intramural fibroids are noted.',
    reportDate: '2026-08-14',
  },
  {
    key: 'largestSize',
    label: 'Largest fibroid',
    completeness: { state: 'present', value: '4.1 cm' },
    source: 'entered-from-report',
    originalWording: 'The larger measures 41 x 36 mm.',
    reportDate: '2026-08-14',
  },
  {
    key: 'cavity',
    label: 'Uterine cavity affected?',
    completeness: { state: 'unknown' },
  },
];
