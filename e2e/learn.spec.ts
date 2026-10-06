import { expect, test } from './support/fixtures';

test.describe('Learn', () => {
  test('trusted reading and things she read online become questions for her visit', async ({ app, page }) => {
    await app.learn.open();
    await app.learn.saveQuestionAbout('Understanding fibroids');
    await app.learn.askAbout('turmeric shrinks fibroids');
    await expect(
      page.getByRole('status').filter({ hasText: 'I read that “turmeric shrinks fibroids”. Does this apply to me?' }),
    ).toBeVisible();

    await app.summary.open();
    const questions = await app.summary.scrollTo('Questions I still want to ask');
    await expect(questions).toContainText(
      'Which parts of my report matter most for my symptoms and the options we discuss?',
    );
    await expect(questions).toContainText('I read that “turmeric shrinks fibroids”. Does this apply to me?');
  });

  test('a food claim shows a short answer, the evidence by outcome, and its sources', async ({ app }) => {
    await app.today.exploreFoodQuestions();
    await app.learn.waitUntilShown();
    const topic = await app.learn.openTopic('Should I cut out dairy?');

    await expect(topic.shortAnswer()).toContainText('We found no research showing dairy makes fibroids worse.');
    await topic.expandOutcome(/Getting fibroids/);
    const study = await topic.openStudy(/Black Women.s Health Study/);
    await expect(study).toContainText('Limits');

    const sources = await topic.openSources();
    await expect(sources).toHaveCount(3);
    await expect(sources.first().getByRole('link')).toHaveAttribute('href', /^https:\/\//);
  });
});
