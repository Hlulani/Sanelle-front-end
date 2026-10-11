import { test, expect, type Page, type Locator } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { registerAccount, deleteAccount } from './support/accounts';
import { openApp, screen as baseScreen } from './support/redesign';

const screen = (page: Page) =>
  page.url().includes('/health/report/check')
    ? page.getByRole('dialog', { name: 'Add a report', exact: true })
    : baseScreen(page);

const output = path.resolve('docs/demo');

// Presentation pacing is deliberately slower than ordinary E2E tests.
async function reveal(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  await target.evaluate(async (el) => {
    if (el.closest('.mobile-nav')) return;
    const content = el.closest('ion-content') as HTMLElement & {
      getScrollElement?: () => Promise<HTMLElement>;
      scrollToPoint?: (x: number, y: number, duration: number) => Promise<void>;
    };
    const scroll = await content?.getScrollElement?.();
    if (scroll && content.scrollToPoint) {
      const rect = el.getBoundingClientRect();
      if (rect.top < 70 || rect.bottom > innerHeight - 100)
        await content.scrollToPoint(0, scroll.scrollTop + rect.top - 100, 900);
    } else el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await page.waitForTimeout(1000);
}
async function hold(page: Page, target?: Locator) {
  await expect(page.locator('#splash')).toBeHidden();
  if (target) await reveal(page, target);
  await page.evaluate(async () => {
    await document.fonts.ready;
    (document.activeElement as HTMLElement)?.blur();
  });
  await page.waitForTimeout(6500);
}
async function click(page: Page, target: Locator) {
  await reveal(page, target);
  await target.hover();
  await page.waitForTimeout(700);
  await target.click();
  await page.waitForTimeout(900);
}
async function type(page: Page, target: Locator, value: string) {
  await reveal(page, target);
  await target.fill('');
  await target.pressSequentially(value, { delay: 45 });
  await page.waitForTimeout(1000);
}
async function tab(page: Page, name: string) {
  await click(page, page.locator('.mobile-nav:visible').getByRole('button', { name, exact: true }));
}

for (const journey of ['health', 'food'] as const) {
  test(`record ${journey} main journey`, async ({ browser, request }, info) => {
    await mkdir(output, { recursive: true });
    const account = await registerAccount(request, 'Thandi Demo');
    // Sign in and finish onboarding off-camera; videos begin inside the product.
    const setup = await browser.newContext({ ...info.project.use, recordVideo: undefined });
    let recording: Awaited<ReturnType<typeof browser.newContext>> | undefined;
    try {
      await openApp(await setup.newPage(), account);
      const fixturePage = await setup.newPage();
      const reportImage = await fixturePage.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1100;
        canvas.height = 650;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 1100, 650);
        ctx.fillStyle = '#111';
        ctx.font = '32px Arial';
        [
          'FICTIONAL DEMO REPORT',
          'Ultrasound report',
          'Report date: 08 October 2026',
          'Two fibroids.',
          'Largest fibroid measures 41 x 38 mm.',
          'Page 1 of 1.',
        ].forEach((text, i) => ctx.fillText(text, 65, 85 + i * 80));
        return canvas.toDataURL('image/png').split(',')[1];
      });
      await fixturePage.close();
      const storageState = await setup.storageState();
      await setup.close();
      recording = await browser.newContext({
        ...info.project.use,
        storageState,
        recordVideo: { dir: info.outputPath('videos'), size: { width: 390, height: 844 } },
      });
      const page = await recording.newPage();
      const video = page.video()!;
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const chapters: { title: string; seconds: number }[] = [];
      const start = Date.now();
      const chapter = async (title: string, target?: Locator) => {
        chapters.push({ title, seconds: Math.round((Date.now() - start) / 1000) });
        await hold(page, target);
      };
      if (journey === 'health') {
        await page.goto('/tabs/today');
        await chapter('Today: a clear starting point');
        await tab(page, 'My health');
        await chapter('My health: add the report you have');
        await click(page, screen(page).getByRole('button', { name: 'Add a scan report', exact: true }));
        await chapter('Choose a report — fictional demo document');
        // Use an image so this recording exercises the real Tesseract OCR model.
        await page.locator('input[type=file]').setInputFiles({
          name: 'fictional-demo-report.png',
          mimeType: 'image/png',
          buffer: Buffer.from(reportImage, 'base64'),
        });
        await expect(screen(page).locator('input[name=v-largestSize]')).toHaveValue(/41.*38/, { timeout: 120_000 });
        await chapter('Review the result of real photo OCR', screen(page).locator('.original-wording'));
        await click(page, screen(page).getByText('Report name and date', { exact: true }));
        await type(page, screen(page).locator('input[name=title]'), 'Fictional demo scan');
        if (!(await screen(page).locator('input[name=reportDate]').isVisible()))
          await click(page, screen(page).getByText('Report name and date', { exact: true }));
        await screen(page).locator('input[name=reportDate]').fill('2026-10-08');
        await screen(page).locator('input[name=v-count]').fill('2');
        await chapter('Check extracted wording and measurements', screen(page).locator('input[name=v-largestSize]'));
        await screen(page).locator('input[name=confirmed]').check();
        await click(page, screen(page).getByRole('button', { name: 'Save checked details', exact: true }));
        await expect(page).toHaveURL(/\/saved/);
        await chapter('Checked details saved');
        await click(page, screen(page).getByRole('button', { name: 'Review report details', exact: true }));
        const location = screen(page).locator('.report-detail').filter({ hasText: 'Location' });
        await chapter('Missing information stays unknown', location);
        await click(page, location.getByRole('button', { name: 'Add a question for my next doctor’s visit' }));
        await type(
          page,
          screen(page).locator('.question-editor textarea'),
          'Where are my fibroids located, and is the uterine cavity affected?',
        );
        await chapter('Turn a report gap into a question', screen(page).locator('.question-editor'));
        await click(page, screen(page).getByRole('button', { name: 'Add to my next doctor’s visit' }));
        await tab(page, 'My health');
        await chapter('Start a symptom check-in');
        await click(page, screen(page).getByRole('button', { name: 'Log symptoms', exact: true }));
        await chapter('Choose what you noticed');
        await click(page, page.getByRole('dialog').getByRole('button', { name: 'Bleeding', exact: true }));
        await chapter('Describe the bleeding in your own categories');
        await click(page, page.getByRole('dialog').getByRole('button', { name: 'Heavy', exact: true }));
        await click(page, page.getByRole('dialog').getByRole('button', { name: 'Low energy', exact: true }));
        await click(page, page.getByRole('dialog').getByRole('button', { name: 'Changed my plans', exact: true }));
        await chapter('Record symptoms and impact');
        await click(page, page.getByRole('dialog').getByRole('button', { name: 'Save today’s check-in' }));
        await expect(page).toHaveURL(/\/health\/symptoms/);
        await chapter('Recorded history, with missing days disclosed', screen(page).locator('.stat-callout'));
        await tab(page, 'Appointment');
        await chapter('Appointment: bring your information together');
        await click(page, screen(page).getByText('Appointment date and main concern', { exact: true }));
        await click(page, screen(page).getByRole('button', { name: 'Add date and concern', exact: true }));
        await type(
          page,
          screen(page).locator('textarea[name=concern]'),
          'Heavy bleeding is affecting my day. I want to understand my scan and discuss next steps.',
        );
        await click(page, screen(page).getByRole('button', { name: 'Save', exact: true }));
        await chapter('Prepare the appointment brief', screen(page).locator('.visit-paper'));
        const question = screen(page).locator('.visit-questions li').first();
        await expect(question).toContainText('Where are my fibroids located');
        await chapter('Bring the question to the visit', question);
        await click(page, question.getByRole('button', { name: 'Record an answer or next step' }));
        await type(
          page,
          question.getByLabel('What did your clinician say?'),
          'We reviewed the report and agreed to request the complete scan details.',
        );
        await type(page, question.getByLabel('Agreed next step'), 'Request the complete scan report');
        await chapter('After the visit: record the agreed next step', question);
        await click(page, question.getByRole('button', { name: 'Save answer' }));
        await tab(page, 'Today');
        await chapter('Return to Today');
        await tab(page, 'Appointment');
        await expect(screen(page).getByText('Request the complete scan report', { exact: true }).first()).toBeVisible();
        await chapter('Saved next step persists', screen(page).locator('.visit-questions li').first());
      } else {
        await page.goto('/tabs/food');
        await chapter('Nourish: practical food support');
        await click(page, screen(page).getByRole('button', { name: /Plan meals & groceries/ }));
        await chapter('Review your food requirements');
        await click(page, screen(page).getByRole('radio', { name: 'Vegetarian', exact: true }));
        await chapter('Choose a vegetarian pattern');
        await click(page, screen(page).getByRole('button', { name: 'Quick meals', exact: true }));
        await click(page, screen(page).getByRole('button', { name: 'Few ingredients', exact: true }));
        await chapter('Choose food preferences');
        await click(page, screen(page).getByRole('button', { name: 'Confirm and plan meals', exact: true }));
        await click(page, screen(page).getByRole('tab', { name: '1 week', exact: true }));
        await expect(screen(page).locator('.plan-calendar > .plan-day > button')).toHaveCount(7);
        await chapter('Preview a week of meals', screen(page).locator('.meal-plan-builder'));
        await click(page, screen(page).getByRole('button', { name: 'Save 7-day plan', exact: false }));
        await expect(screen(page).getByRole('status').filter({ hasText: 'Meal plan saved.' })).toBeVisible();
        await tab(page, 'Food');
        const saved = screen(page).getByRole('region', { name: 'My saved meal plan' });
        await chapter('Saved plan ready to use', saved);
        await saved
          .getByRole('link', { name: /^Cook Day/ })
          .first()
          .click();
        await expect(screen(page).getByRole('heading', { name: 'How to cook', exact: true })).toBeInViewport();
        await chapter('Follow the recipe', screen(page).getByRole('heading', { name: 'How to cook', exact: true }));
        await click(page, screen(page).getByRole('button', { name: 'I made this', exact: true }));
        await expect(screen(page).getByRole('status').filter({ hasText: 'Made ·' })).toBeVisible();
        await chapter('Mark the meal as made');
        await tab(page, 'Food');
        await click(page, saved.getByRole('button', { name: 'Open shopping list', exact: true }));
        const shopping = screen(page).locator('.shopping-section');
        await expect(shopping.getByRole('checkbox').first()).toBeVisible();
        await chapter('Shopping list from the saved plan', shopping);
        await type(page, shopping.getByLabel('Add another item'), 'Apples');
        await click(page, shopping.getByRole('button', { name: 'Add grocery item' }));
        await shopping.getByRole('checkbox', { name: 'Already have Apples', exact: true }).check();
        await tab(page, 'Food');
        await click(page, saved.getByRole('button', { name: 'Open shopping list', exact: true }));
        await expect(shopping.getByRole('checkbox', { name: 'Already have Apples', exact: true })).toBeChecked();
        await chapter('Shopping edits persist', shopping.getByText('Apples', { exact: true }));
      }
      expect(errors, 'Demo must have no uncaught browser errors').toEqual([]);
      await recording.close();
      await video.saveAs(path.join(output, `${journey}-journey.webm`));
      await writeFile(
        path.join(output, `${journey}-chapters.json`),
        JSON.stringify({ fictionalData: true, viewport: '390 × 844', chapters }, null, 2),
      );
    } catch (error) {
      for (const page of recording?.pages() ?? [])
        await page.screenshot({ path: info.outputPath('recording-failure.png') }).catch(() => undefined);
      throw error;
    } finally {
      await recording?.close();
      await setup.close();
      await deleteAccount(request, account);
    }
  });
}
