import { expect, test } from './support/fixtures';
import { recordSampleReport, SAMPLE_REPORT } from './support/sample-report';

test.describe('Understanding my diagnosis', () => {
  test('an unknown detail stays visible and becomes a question', async ({ app, page }) => {
    await expect(page.getByRole('heading', { name: 'Start with what you know' })).toBeVisible();

    await recordSampleReport(app);

    const results = await app.diagnosis.results();
    expect(results.recorded).toEqual(['Fibroids', 'Largest', 'Location', 'FIGO type']);
    expect(results.missing).toEqual([
      { label: 'Uterine cavity', question: SAMPLE_REPORT.cavity.suggested, saved: true },
    ]);

    await app.diagnosis.seeQuestions();
    await expect(page.locator('ol.list')).toContainText(SAMPLE_REPORT.cavity.suggested);
  });

  test('a detail left unknown without its question can still be asked from the results', async ({ app, page }) => {
    const r = SAMPLE_REPORT;
    await app.today.startDiagnosis();
    await app.diagnosis.record(r.count);
    await app.diagnosis.record(r.largestSize);
    await app.diagnosis.record(r.location);
    await app.diagnosis.leaveUnknown(r.cavity.question, r.cavity.suggested, false);
    await app.diagnosis.record(r.figo, 'Save');

    const results = await app.diagnosis.results();
    expect(results.missing).toEqual([
      { label: 'Uterine cavity', question: SAMPLE_REPORT.cavity.suggested, saved: false },
    ]);

    await app.diagnosis.saveQuestionFor('Uterine cavity');
    await app.diagnosis.seeQuestions();
    await expect(page.locator('ol.list')).toContainText(SAMPLE_REPORT.cavity.suggested);
  });
});
