import type { SanelleApp } from './sanelle-app';

/** A made-up scan report used across tests. Its uterine cavity isn't mentioned. */
export const SAMPLE_REPORT = {
  count: { question: 'How many fibroids does your report mention?', field: 'Number of fibroids', value: '2' },
  largestSize: { question: 'How big is the largest one?', field: 'Size of the largest fibroid', value: '4.1 cm' },
  location: { question: 'Where are they, in your report’s words?', field: 'Where the fibroids are located', value: 'intramural, posterior wall' },
  cavity: { question: 'Does your report say whether the uterine cavity is affected?', suggested: 'Is my uterine cavity affected?' },
  figo: { question: 'Does your report give a FIGO type?', field: 'FIGO type stated in the report', value: 'FIGO 4' },
};

/** Records the sample report from Today, leaving the cavity unknown with its question saved. */
export async function recordSampleReport(app: SanelleApp): Promise<void> {
  const r = SAMPLE_REPORT;
  await app.today.startDiagnosis();
  await app.diagnosis.record(r.count);
  await app.diagnosis.record(r.largestSize);
  await app.diagnosis.record(r.location);
  await app.diagnosis.leaveUnknown(r.cavity.question, r.cavity.suggested);
  await app.diagnosis.record(r.figo, 'Save');
}
