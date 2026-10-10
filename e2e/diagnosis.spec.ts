import { test, expect, screen, shot, openApp, manualReport, reportPdf } from './support/redesign';
test.beforeEach(async ({ page, account }) => openApp(page, account));
test('RPT-01–04 and HLT-01–03: manual report, checked provenance, missing detail, editable question', async ({
  page,
}, info) => {
  await page.goto('/tabs/health');
  await expect(
    screen(page)
      .getByText(/No report/)
      .first(),
  ).toBeVisible();
  await shot(page, 'HLT-01', info);
  await page.goto('/health/report/new');
  await shot(page, 'RPT-01', info);
  await manualReport(page);
  await expect(screen(page).getByText('Checked', { exact: true })).toBeVisible();
  await shot(page, 'RPT-04', info);
  await screen(page).getByRole('button', { name: 'Review report details' }).click();
  await expect(screen(page).getByText('41 × 38 mm', { exact: true })).toBeVisible();
  await shot(page, 'HLT-02', info);
  const location = screen(page)
    .locator('article.report-detail')
    .filter({ has: page.getByRole('link', { name: 'Edit Location', exact: true }) });
  await expect(location).toContainText('Not recorded');
  await location.getByRole('button', { name: 'Add a question for my next doctor’s visit' }).click();
  await shot(page, 'HLT-03', info);
  await screen(page).getByRole('textbox').fill('Where are my fibroids, and what does that mean for me?');
  await screen(page).getByRole('button', { name: 'Add to my next doctor’s visit' }).click();
  await expect(page).toHaveURL(/tabs\/appointment/);
  await expect(screen(page).getByText('Where are my fibroids, and what does that mean for me?')).toBeVisible();
  await page.reload();
  await expect(screen(page).getByText('Where are my fibroids, and what does that mean for me?')).toBeVisible();
  await page.goto('/health/question/cavity');
  await screen(page).getByRole('button', { name: 'Not now' }).click();
  await page.goto('/tabs/appointment');
  await expect(screen(page).locator('ol.questions li')).toHaveCount(1);
});
test('RPT-03 unfinished details stay out of summary and resume from Today', async ({ page }, info) => {
  await manualReport(page, false);
  await expect(screen(page).getByText('Needs checking', { exact: true })).toBeVisible();
  await page.goto('/tabs/appointment');
  await expect(screen(page).getByText(/2 fibroids/)).toHaveCount(0);
  await page.goto('/tabs/today');
  await screen(page).getByRole('button', { name: 'Check report details' }).click();
  await expect(screen(page).locator('input[name=v-count]')).toHaveValue('2');
  await shot(page, 'RPT-03', info);
  await screen(page).locator('input[name=confirmed]').check();
  await screen(page).getByRole('button', { name: 'Save checked details' }).click();
  await expect(screen(page).getByText('Checked', { exact: true })).toBeVisible();
  await page.goto('/tabs/appointment');
  await expect(screen(page).getByText(/2 fibroids/)).toBeVisible();
});
test('PDF extraction retains source wording and warns about a missing page', async ({ page }) => {
  await page.goto('/health/report/new');
  await screen(page)
    .locator('input[accept*="application/pdf"]')
    .setInputFiles({ name: 'sample-scan.pdf', mimeType: 'application/pdf', buffer: reportPdf() });
  await expect(screen(page).getByRole('button', { name: 'Save checked details' })).toBeVisible({ timeout: 60000 });
  await expect(screen(page).getByText(/report says it has 2 pages/)).toBeVisible();
  await expect(screen(page).locator('input[name=v-largestSize]')).toHaveValue(/41.*38/);
  await expect(screen(page).locator('select[name=u-largestSize]')).toHaveValue('mm');
  await expect(screen(page).locator('.original-wording textarea')).toHaveValue(/Largest fibroid measures/);
  await screen(page).locator('input[name=confirmed]').check();
  await screen(page).getByRole('button', { name: 'Save checked details' }).click();
  await expect(page).toHaveURL(/\/health\/report\/.*\/saved/);
  await page.goto('/tabs/health');
  await expect(screen(page).locator('.health-summary h2')).toHaveText('two fibroids');
  await page.goto('/health/details');
  await screen(page)
    .locator('article.report-detail')
    .filter({ hasText: 'Largest recorded size' })
    .locator('summary')
    .click();
  await expect(
    screen(page)
      .locator('article.report-detail')
      .filter({ hasText: 'Largest recorded size' })
      .getByText(/checked by me/),
  ).toBeVisible();
});
test('RPT-02 camera pages can be added, reordered, retaken and removed', async ({ page }, info) => {
  await page.goto('/health/report/new');
  const data = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 1100;
    const x = c.getContext('2d')!;
    x.fillStyle = 'white';
    x.fillRect(0, 0, 800, 1100);
    x.fillStyle = 'black';
    x.font = '28px Arial';
    x.fillText('Ultrasound report', 50, 100);
    x.fillText('Two fibroids. Largest fibroid measures 41 x 38 mm.', 50, 160);
    return c.toDataURL('image/png').split(',')[1];
  });
  const photo = { name: 'scan.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
  await screen(page).getByRole('button', { name: 'Take photos' }).click();
  await screen(page).locator('input[capture=environment]').first().setInputFiles(photo);
  await expect(page).toHaveURL(/report\/capture/);
  await shot(page, 'RPT-02', info);
  await screen(page).locator('input[capture=environment]').first().setInputFiles(photo);
  await expect(screen(page).locator('.camera-frame:has(img)')).toHaveCount(2);
  await screen(page).getByRole('button', { name: 'Move page 2 up' }).click();
  await screen(page).getByRole('button', { name: 'Retake', exact: true }).first().click({ noWaitAfter: true });
  await screen(page).locator('input[capture=environment]').last().setInputFiles(photo);
  await screen(page).getByRole('button', { name: 'Remove', exact: true }).last().click();
  await expect(screen(page).locator('.camera-frame:has(img)')).toHaveCount(1);
  await screen(page).getByRole('button', { name: 'Use 1 page' }).click();
  await expect(screen(page).getByRole('button', { name: 'Save checked details' })).toBeVisible({ timeout: 90000 });
  await expect(screen(page).locator('input[name=v-largestSize]')).toHaveValue(/41.*38/);
});

test('Report-review confirmation preserves dimensions, and dismissing suggestions returns to their report', async ({
  page,
}, info) => {
  await manualReport(page);
  await page.goto('/tabs/health');
  await screen(page).getByRole('button', { name: 'Check saved details' }).click();
  await expect(screen(page).locator('.extraction-review')).toContainText('41 × 38 mm');
  await shot(page, 'RPT-review-sheet', info);
  await screen(page).getByRole('checkbox').check();
  await screen(page).getByRole('button', { name: 'Save checked details', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/health/details');
  const location = screen(page)
    .locator('article.report-detail')
    .filter({ has: page.getByRole('link', { name: 'Edit Location', exact: true }) });
  await location.getByRole('button', { name: 'Add a question for my next doctor’s visit' }).click();
  await screen(page).getByRole('textbox').fill('Unsaved draft wording');
  await screen(page).getByRole('button', { name: 'Not now', exact: true }).click();
  await expect(page).toHaveURL(/\/health\/details/);
  await expect(screen(page).getByText('41 × 38 mm', { exact: true })).toBeVisible();
  await page.goto('/tabs/appointment');
  await expect(screen(page).getByText('No questions saved yet.')).toBeVisible();
  await expect(screen(page).getByText(/41 × 38 mm/)).toBeVisible();
});
