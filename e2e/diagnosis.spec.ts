import { expect, test } from './support/fixtures';
import { recordSampleReport, SAMPLE_REPORT } from './support/sample-report';

test.describe('Understanding my diagnosis', () => {
  test('an unknown detail stays visible and becomes a question', async ({ app, page }) => {
    await expect(page.getByRole('heading', { name: 'Start with what you know' })).toBeVisible();

    await recordSampleReport(app);

    const summary = await app.diagnosis.summary();
    expect(summary.recorded).toBe('4: Fibroids, Largest, Location, FIGO type');
    expect(summary.notRecorded).toBe('1: Uterine cavity');
    expect(summary.questions).toBe('1');

    await app.diagnosis.seeQuestions();
    await expect(page.locator('ol.list')).toContainText(SAMPLE_REPORT.cavity.suggested);
  });

  test('she can leave a detail unknown without adding its question', async ({ app }) => {
    const r = SAMPLE_REPORT;
    await app.today.startDiagnosis();
    await app.diagnosis.record(r.count);
    await app.diagnosis.record(r.largestSize);
    await app.diagnosis.record(r.location);
    await app.diagnosis.leaveUnknown(r.cavity.question, r.cavity.suggested, false);
    await app.diagnosis.record(r.figo, 'Save');

    const summary = await app.diagnosis.summary();
    expect(summary.notRecorded).toBe('1: Uterine cavity');
    expect(summary.questions).toBe('0');
  });
});
