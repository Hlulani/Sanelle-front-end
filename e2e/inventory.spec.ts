import { test, expect, screen, shot, openApp } from './support/redesign';

test('AUTH-04L keeps credentials visible and prevents duplicate login', async ({ page, account }, info) => {
  await page.goto('/login');
  await screen(page).getByLabel('Email', { exact: true }).fill(account.email);
  await screen(page).getByLabel('Password', { exact: true }).fill(account.password);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let calls = 0;
  await page.route('**/api/v1/auth/login', async (route) => {
    calls++;
    await gate;
    await route.continue();
  });
  await screen(page).getByRole('button', { name: 'Log in', exact: true }).click();
  try {
    await expect(screen(page).getByRole('button', { name: 'Logging in…' })).toBeDisabled();
    await expect(screen(page).getByLabel('Email', { exact: true })).toHaveValue(account.email);
    await shot(page, 'AUTH-04L', info);
    expect(calls).toBe(1);
  } finally {
    release();
  }
  await expect(page).toHaveURL(/onboarding|tabs\/today/);
});

test('TOD-02A saved appointment becomes the returning priority and opens its summary', async ({
  page,
  account,
}, info) => {
  await openApp(page, account);
  await page.goto('/tabs/appointment');
  await screen(page).getByText('Appointment date and main concern', { exact: true }).click();
  await screen(page).getByRole('button', { name: 'Add date and concern' }).click();
  const tomorrow = await page.evaluate(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  await screen(page).locator('input[name=visitDate]').fill(tomorrow);
  await screen(page).locator('textarea[name=concern]').fill('Discuss my report and the bleeding');
  await screen(page).getByRole('button', { name: 'Save', exact: true }).click();
  await page.goto('/tabs/today');
  await expect(screen(page).locator('.today-next')).toContainText('Prepare for your appointment');
  await shot(page, 'TOD-02A', info);
  await screen(page).getByRole('button', { name: 'Review appointment summary', exact: true }).click();
  await expect(page).toHaveURL(/tabs\/appointment/);
  await screen(page).getByText('Appointment date and main concern', { exact: true }).click();
  await expect(screen(page).getByText('Discuss my report and the bleeding', { exact: true })).toBeVisible();
});

test('RPT-02G/02B/02C photo warnings allow retake and removal without inventing findings', async ({
  page,
  account,
}, info) => {
  await openApp(page, account);
  await page.goto('/health/report/new');
  await screen(page).getByRole('button', { name: 'Take photos' }).click();
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 480, 480);
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(20, 20, 440, 440);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 210, 5, 50);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await screen(page)
    .locator('input[capture=environment]')
    .first()
    .setInputFiles({
      name: 'quality-warning-fixture.png',
      mimeType: 'image/png',
      buffer: Buffer.from(png, 'base64'),
    });
  await expect(screen(page).getByText(/may be blurry/)).toBeVisible();
  await expect(screen(page).getByText(/may be glare/)).toBeVisible();
  await expect(screen(page).getByText(/may be cut off/)).toBeVisible();
  await shot(page, 'RPT-02-quality-warnings', info);
  await expect(screen(page).getByRole('button', { name: 'Retake', exact: true })).toBeEnabled();
  await screen(page).getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(screen(page).getByText(/may be blurry|may be glare|may be cut off/)).toHaveCount(0);
  await expect(screen(page).getByRole('button', { name: 'Use 0 pages' })).toBeDisabled();
  await page.goto('/tabs/health');
  await expect(screen(page).getByText('No report files saved yet.')).toBeVisible();
});

test('HLT-02F/02C unknown FIGO and cavity details become explicit next-visit questions', async ({
  page,
  account,
}, info) => {
  await openApp(page, account);
  for (const field of ['FIGO type', 'Uterine cavity']) {
    await page.goto('/health/details');
    const row = screen(page)
      .locator('article.report-detail')
      .filter({ has: page.getByRole('link', { name: `Edit ${field}`, exact: true }) });
    await expect(row).toContainText('Not recorded');
    await row.getByRole('button', { name: 'Add a question for my next doctor’s visit' }).click();
    await screen(page).getByRole('button', { name: 'Add to my next doctor’s visit' }).click();
    await expect(page).toHaveURL(/tabs\/appointment/);
  }
  await page.reload();
  await expect(screen(page).locator('ol.questions > li')).toHaveCount(2);
  await expect(screen(page).locator('ol.questions')).toContainText('FIGO');
  await expect(screen(page).locator('ol.questions')).toContainText('cavity');
  await shot(page, 'HLT-02F-02C-questions', info);
});

test('SYM-03R personal statistics explain missing data and remain separate from research', async ({
  page,
  account,
}, info) => {
  await openApp(page, account);
  await page.goto('/health/symptoms');
  await screen(page).getByText('How this statistic is calculated', { exact: true }).click();
  const disclosure = screen(page)
    .locator('details.evidence-disclosure')
    .filter({ hasText: 'How this statistic is calculated' });
  await expect(disclosure).toContainText('Missing days and unanswered fields are excluded');
  await expect(disclosure).toContainText('Personal history is not combined with research statistics');
  await expect(disclosure).toContainText('not a validated clinical score');
  await disclosure.scrollIntoViewIfNeeded();
  await shot(page, 'SYM-03R', info, false);
});
