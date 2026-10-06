import { expect, test } from './support/fixtures';
import { recordSampleReport, SAMPLE_REPORT } from './support/sample-report';

test.describe('Preparing for the appointment', () => {
  test('the summary brings her concern, questions and report together', async ({ app }) => {
    await recordSampleReport(app);
    await app.diagnosis.results();
    await app.diagnosis.done();

    await app.summary.open();
    await app.summary.setMainConcern('I want to know if my fibroids explain my heavy periods.');

    const questions = await app.summary.scrollTo('Questions I still want to ask');
    await expect(questions).toContainText(SAMPLE_REPORT.cavity.suggested);

    const report = await app.summary.scrollTo('Supporting report details');
    await expect(report).toContainText(SAMPLE_REPORT.largestSize.value);
    await expect(report).toContainText(SAMPLE_REPORT.location.value);

    const missing = await app.summary.scrollTo('Not recorded yet');
    await expect(missing).toContainText('Uterine cavity');
  });
});
