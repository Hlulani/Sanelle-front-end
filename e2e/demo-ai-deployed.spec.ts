import { test, expect, type Locator, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('docs/demo/deployed-ai');
const pause = (page: Page, ms = 7000) => page.waitForTimeout(ms);
async function reveal(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  await target.evaluate(async (el) => {
    if (el.closest('.mobile-nav')) return;
    const content = el.closest('ion-content') as any;
    const rect = el.getBoundingClientRect();
    if (rect.top >= 70 && rect.bottom <= innerHeight - 85) return;
    if (content?.getScrollElement) {
      const scroll = await content.getScrollElement();
      await content.scrollToPoint(0, scroll.scrollTop + rect.top - 95, 950);
    } else el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await page.waitForTimeout(1100);
}
async function click(page: Page, target: Locator) {
  await reveal(page, target);
  await target.hover();
  await page.waitForTimeout(800);
  await target.click();
  await page.waitForTimeout(1100);
}
async function type(page: Page, target: Locator, text: string) {
  await reveal(page, target);
  await target.fill('');
  await target.pressSequentially(text, { delay: 55 });
  await page.waitForTimeout(900);
}

async function append(page: Page, target: Locator, text: string) {
  await reveal(page, target);
  await target.focus();
  await target.evaluate((el) => {
    const field = el as HTMLTextAreaElement;
    field.setSelectionRange(field.value.length, field.value.length);
  });
  await target.pressSequentially(text, { delay: 65 });
  await pause(page, 900);
}

test('record the real deployed Sanelle AI journeys in the phone frame', async ({ page }, info) => {
  const email = process.env['SANELLE_DEMO_EMAIL'];
  const password = process.env['SANELLE_DEMO_PASSWORD'];
  if (!email || !password) throw new Error('Set SANELLE_DEMO_EMAIL and SANELLE_DEMO_PASSWORD for the demo account.');
  await mkdir(output, { recursive: true });
  const started = Date.now();
  let phone: { x: number; y: number; width: number; height: number } | null = null;
  const clips: { id: string; title: string; start: number; end?: number }[] = [];
  const chapters: { title: string; seconds: number }[] = [];
  const aiCalls: { status: number; checkinCount: number; sentAccountDetails: boolean }[] = [];
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (response) => {
    if (response.url().endsWith('/ai/insights') && response.request().method() === 'POST') {
      const data = response.request().postDataJSON();
      aiCalls.push({
        status: response.status(),
        checkinCount: data.checkins?.length ?? 0,
        sentAccountDetails: JSON.stringify(data).includes(email),
      });
    }
  });
  const time = () => (Date.now() - started) / 1000;
  const begin = (id: string, title: string) => {
    if (clips.length) clips[clips.length - 1].end = time();
    clips.push({ id, title, start: time() });
    console.log(`Recording: ${title}`);
  };
  const chapter = async (title: string, target?: Locator, ms = 7000) => {
    if (target) await reveal(page, target);
    chapters.push({ title, seconds: time() });
    await page.screenshot({ path: info.outputPath('current-chapter.png') });
    await writeFile(
      path.join(output, 'recording-progress.json'),
      JSON.stringify({ phone, clips, chapters, aiCalls, browserErrors: errors }, null, 2),
    );
    await pause(page, ms);
  };

  await page.goto('/phone');
  const app = page.frameLocator('iframe[title="Sanelle app"]');
  await expect(app.getByRole('link', { name: 'I already have an account' })).toBeVisible();
  await app.getByRole('link', { name: 'I already have an account' }).click();
  await app.getByLabel('Email', { exact: true }).fill(email);
  await app.getByLabel('Password', { exact: true }).fill(password);
  await app.getByRole('button', { name: 'Log in', exact: true }).click();
  const frame = page.frames().find((f) => f.parentFrame())!;
  await expect(app.locator('.mobile-nav:visible')).toBeVisible({ timeout: 120_000 });
  await expect(page).toHaveURL(/\/phone\/?$/);
  phone = await page.locator('.phone').boundingBox();
  expect(phone).toBeTruthy();
  const nav = (name: string) => app.locator('.mobile-nav:visible').getByRole('button', { name, exact: true });
  const symptoms = async () => {
    await click(page, nav('My health'));
    await click(page, app.getByRole('tab', { name: 'Symptoms & daily life', exact: true }));
  };
  const worth = () => app.locator('.from-checkins:visible').last();
  const log = async (note: string) => {
    const dialog = app.getByRole('dialog', { name: 'What showed up today?' });
    for (const name of ['Bleeding', 'Pain', 'Heavy', 'Changed my plans']) {
      await click(page, dialog.getByRole('button', { name, exact: true }));
    }
    await type(page, dialog.getByLabel('Anything else, in your own words? (optional)'), note);
    await chapter('A fictional check-in: symptoms, impact and her own words', dialog.locator('textarea'));
    await click(page, dialog.getByRole('button', { name: 'Save today’s check-in', exact: true }));
    await expect(app.locator('.history-entry:visible')).toBeVisible();
  };

  begin('00-check-in-setup', 'Set up two fictional check-ins');
  await symptoms();
  await chapter('Start with her own recorded experience', app.getByRole('button', { name: 'Log today', exact: true }));
  await click(page, app.getByRole('button', { name: 'Log today', exact: true }));
  await log('Flooding at night, had to change pads twice');
  // There is no previous-day picker in the deployed history. Open its supported route
  // inside the same phone frame, during setup rather than the AI feature clips.
  const yesterday = await frame.evaluate(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  await frame.goto(`https://sanelle.netlify.app/health/check-in/${yesterday}?from=health`);
  await log('Felt dizzy on the stairs');
  await expect(app.locator('.history-window-head:visible strong')).toContainText('2');
  await chapter('Two recorded days; missing days remain unknown', app.locator('.history-window:visible'));

  begin('01-ai-suggestions', 'Sanelle AI suggestions');
  await chapter('Starting state: suggestions from patterns in her own records', worth());
  await click(page, worth().getByRole('button', { name: 'Suggest with AI', exact: true }));
  const consent = worth().getByRole('group', { name: 'Draft with Sanelle AI?' });
  await expect(consent).toContainText('Anthropic');
  await expect(consent).toContainText('Not your name, email, reports or results');
  await chapter('Consent: what is read, who processes it, and review before saving', consent, 12000);
  await click(page, consent.getByRole('button', { name: 'Send and draft', exact: true }));
  await expect(
    worth().getByText('Drafted by Sanelle AI from your check-ins. Check it before adding.', { exact: true }),
  ).toBeVisible({ timeout: 120_000 });
  expect(aiCalls.at(-1)?.status).toBe(200);
  expect(aiCalls.at(-1)?.checkinCount).toBe(2);
  expect(aiCalls.at(-1)?.sentAccountDetails).toBe(false);
  await chapter('Fresh AI questions, grounded in the two recorded check-ins', worth().locator('.ai-label'), 9000);
  const question = worth().locator('.suggestion-card:has(textarea)').first();
  await chapter('Why this question: inspect its recorded counts', question.locator('.why'), 9000);
  await append(page, question.locator('textarea'), ' What should we discuss next?');
  const editedQuestion = await question.locator('textarea').inputValue();
  await chapter('She edits the question before adding it', question);
  await click(page, question.getByRole('button', { name: 'Add to my questions', exact: true }));
  await expect(worth().getByRole('status').filter({ hasText: 'Added to your questions in Appointment' })).toBeVisible();
  await chapter('Only the question she chose is added', worth().locator('.saved-note'));
  const matches = worth().locator('.match-card');
  await expect(matches.first()).toBeVisible();
  await chapter('An exact note excerpt matched to a published explanation', matches.first(), 10000);
  await expect(matches.first()).toContainText(/You wrote:/);
  await click(page, matches.first().getByRole('link', { name: 'Sources and limits', exact: true }));
  const evidence = app.locator('.claim-sheet:visible');
  await chapter('Read the research explanation and its limits', evidence.locator('.evidence-answer'), 9000);
  await click(page, evidence.getByRole('button', { name: 'Done reading', exact: true }));

  begin('02-ai-visit-draft', 'Sanelle AI appointment concern');
  await click(page, nav('Appointment'));
  await chapter('The chosen question is now ready for the appointment', app.locator('.visit-questions:visible'));
  await expect(app.locator('.visit-questions:visible')).toContainText(editedQuestion);
  await click(page, app.getByText('Appointment date and main concern', { exact: true }));
  await chapter(
    'Draft a concern using her recorded experience',
    app.getByRole('button', { name: 'Draft with AI', exact: true }),
  );
  await click(page, app.getByRole('button', { name: 'Draft with AI', exact: true }));
  // Consent persists across actual app navigation; allow the explicit dialog if the app asks again.
  if (await app.getByRole('button', { name: 'Send and draft', exact: true }).isVisible()) {
    await chapter('Review consent before sending', app.locator('.ai-consent:visible'), 10000);
    await click(page, app.getByRole('button', { name: 'Send and draft', exact: true }));
  }
  const concern = app.locator('textarea[name=concern]:visible');
  await expect(concern).not.toHaveValue('', { timeout: 120_000 });
  await expect(app.locator('.ai-label:visible')).toContainText('Drafted by Sanelle AI');
  expect(aiCalls.at(-1)?.checkinCount).toBe(2);
  await chapter('Read the first-person AI draft; it is not a medical summary', concern, 12000);
  await append(page, concern, ' I would like to discuss next steps.');
  const savedConcern = await concern.inputValue();
  await chapter('She reviews and edits every word before saving', concern, 9000);
  await click(page, app.getByRole('button', { name: 'Save', exact: true }));
  await expect(app.getByText(savedConcern, { exact: true })).toBeVisible();
  await chapter('The edited concern is saved for her appointment', app.getByText(savedConcern, { exact: true }), 10000);

  begin('03-report-reading', 'On-device report text recognition');
  await click(page, nav('My health'));
  await click(page, app.getByRole('tab', { name: 'Diagnosis details', exact: true }));
  await chapter('Add a scan report', app.getByRole('button', { name: /Add (a scan|another) report/ }));
  await click(page, app.getByRole('button', { name: /Add (a scan|another) report/ }));
  await chapter(
    'Report reading happens on the device; review before saving',
    app.locator('.scan-privacy:visible'),
    10000,
  );
  await app
    .locator('input[type=file]')
    .setInputFiles(
      process.env['SANELLE_DEMO_REPORT'] ?? '/Users/hbaloyi/Downloads/sanelle-sample-reports/sample-report-scan.png',
    );
  const report = app.getByRole('dialog', { name: 'Add a report', exact: true });
  await expect(report.locator('input[name=v-largestSize]')).not.toHaveValue('', { timeout: 150_000 });
  await chapter('Real text recognition: compare the captured wording', report.locator('.original-wording'), 10000);
  await chapter(
    'Check the extracted measurements against the report',
    report.locator('input[name=v-largestSize]'),
    10000,
  );
  await click(page, report.getByText('Report name and date', { exact: true }));
  await report.locator('input[name=title]').fill('Sample report — demonstration');
  await reveal(page, report.locator('input[name=confirmed]'));
  await report.locator('input[name=confirmed]').check();
  await chapter('Confirm only after checking the original', report.locator('input[name=confirmed]'), 9000);
  await click(page, report.getByRole('button', { name: 'Save checked details', exact: true }));
  await expect(app.getByRole('button', { name: 'Review report details', exact: true })).toBeVisible();
  await chapter('Checked details saved', app.locator('.extraction-review:visible'), 9000);

  begin('04-research-library', 'Published research supporting the matches');
  await symptoms();
  await click(page, app.getByRole('link', { name: 'What the research says', exact: true }));
  await chapter('Published summaries grouped by topic', app.locator('.learn-intro:visible'), 10000);
  await click(page, app.locator('.claim-row:visible').first());
  await chapter('Short answer and evidence limits', app.locator('.claim-sheet:visible .evidence-answer'), 10000);
  await click(page, app.locator('.claim-sheet:visible').getByText('Sources and limitations', { exact: true }));
  await chapter('Study population, sources and limitations', app.locator('.claim-sheet:visible .citation-list'), 10000);
  await click(page, app.getByRole('button', { name: 'Done reading', exact: true }));
  clips[clips.length - 1].end = time();

  expect(aiCalls).toHaveLength(2);
  expect(aiCalls.every((c) => c.status === 200 && c.checkinCount === 2 && !c.sentAccountDetails)).toBe(true);
  expect(errors).toEqual([]);
  await writeFile(
    path.join(output, 'recording.json'),
    JSON.stringify(
      {
        source: 'https://sanelle.netlify.app/phone',
        fictionalCheckins: true,
        realAiRequests: true,
        viewport: { width: 1280, height: 1040 },
        phone,
        clips,
        chapters,
        aiCalls,
        browserErrors: errors,
        safetyTalkingPoints: [
          'Unsupported diagnoses, causes, numbers, quotations and unpublished references are filtered.',
          'An empty accepted result keeps the rules-based fallback and the user’s own text.',
          'Nothing is saved until she chooses Add or Save.',
        ],
      },
      null,
      2,
    ),
  );
  const video = page.video()!;
  await page.close();
  await video.saveAs(path.join(output, 'full-recording.webm'));
});
