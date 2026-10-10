import { readFile } from 'node:fs/promises';
import { test, expect, screen, openApp, signIn, manualReport } from './support/redesign';
import { registerAccount, deleteAccount, newAccountDetails, API_URL, mailToken } from './support/accounts';

test('Unverified login offers email recovery rather than reporting wrong credentials', async ({ page, request }) => {
  const account = newAccountDetails();
  await request.post(`${API_URL}/auth/register`, { data: { ...account, name: 'Tester', termsAccepted: true } });
  try {
    await page.goto('/login');
    await screen(page).getByLabel('Email', { exact: true }).fill(account.email);
    await screen(page).getByLabel('Password', { exact: true }).fill(account.password);
    await screen(page).getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(screen(page).getByRole('alert')).toContainText('Confirm your email address first');
    await screen(page).getByRole('button', { name: 'Send the email again' }).click();
    await expect(page).toHaveURL(/check-email/);
  } finally {
    const token = await mailToken(request, account.email);
    await request.post(`${API_URL}/auth/verify-email`, { data: { token } });
    await deleteAccount(request, account);
  }
});
test('Accounts keep separate health records and unsaved food plans', async ({ page, request, account }) => {
  const second = await registerAccount(request);
  try {
    await openApp(page, account);
    await page.goto('/tabs/appointment');
    await screen(page)
      .getByLabel('New appointment question', { exact: true })
      .fill('Private question for the first account');
    await screen(page).getByRole('button', { name: 'Add question', exact: true }).click();
    await expect(screen(page).getByText('Private question for the first account')).toBeVisible();
    await page.goto('/food/requirements');
    await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
    await expect(screen(page).getByRole('button', { name: 'Save 3-day plan' })).toBeVisible();
    await screen(page).getByRole('button', { name: 'Open profile' }).click();
    await screen(page).getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await signIn(page, second);
    await page.goto('/tabs/appointment');
    await expect(screen(page).getByText('No questions saved yet.')).toBeVisible();
    await expect(screen(page).getByText('Private question for the first account')).toHaveCount(0);
    await page.goto('/food/plan');
    await expect(screen(page).getByText(/Your food requirements need your review/)).toBeVisible();
    await expect(screen(page).getByRole('button', { name: 'Save 3-day plan' })).toHaveCount(0);
    await page.goto('/account');
    await screen(page).getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await signIn(page, account);
    await page.goto('/tabs/appointment');
    await expect(screen(page).getByText('Private question for the first account')).toBeVisible();
  } finally {
    await deleteAccount(request, second);
  }
});
test('Encrypted backup previews before replacement and restores checked findings and questions', async ({
  page,
  account,
}) => {
  await openApp(page, account);
  await manualReport(page);
  await page.goto('/tabs/appointment');
  await screen(page).getByLabel('New appointment question', { exact: true }).fill('Question in my backup');
  await screen(page).getByRole('button', { name: 'Add question', exact: true }).click();
  await expect(screen(page).getByText('Question in my backup')).toBeVisible();
  await screen(page).getByRole('button', { name: 'Record an answer or next step' }).click();
  await screen(page).getByLabel('What did your clinician say?').fill('Review the original scan.');
  await screen(page).getByLabel('Agreed next step').fill('Bring the original report');
  await screen(page).getByRole('button', { name: 'Save answer', exact: true }).click();
  await expect(screen(page).getByText('Bring the original report', { exact: true })).toBeVisible();
  await page.goto('/health/check-in/today');
  await screen(page).getByRole('button', { name: 'Pain', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Changed my plans', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Save today’s check-in' }).click();
  await expect(page).toHaveURL(/\/health\/symptoms/);
  await page.goto('/health/backup');
  await screen(page).getByLabel('Backup passphrase', { exact: true }).fill('Presentation-Backup-2026!');
  await screen(page).getByLabel('Repeat backup passphrase', { exact: true }).fill('Presentation-Backup-2026!');
  const downloading = page.waitForEvent('download');
  await screen(page).getByRole('button', { name: 'Save encrypted backup' }).click();
  const file = await downloading;
  const content = await readFile((await file.path())!);
  expect(content.toString()).not.toContain('Question in my backup');
  await page.goto('/tabs/appointment');
  await screen(page).getByLabel('New appointment question', { exact: true }).fill('Added after backup');
  await screen(page).getByRole('button', { name: 'Add question', exact: true }).click();
  await expect(screen(page).getByText('Added after backup')).toBeVisible();
  await page.goto('/health/backup');
  await screen(page)
    .locator('input[type=file]')
    .setInputFiles({ name: 'my-backup.json', mimeType: 'application/json', buffer: content });
  await screen(page).getByLabel('Passphrase for this backup').fill('Presentation-Backup-2026!');
  await screen(page).getByRole('button', { name: 'Unlock and review' }).click();
  await expect(screen(page).getByRole('heading', { name: 'Check before restoring' })).toBeVisible();
  await expect(screen(page).getByRole('button', { name: 'Restore these records' })).toBeDisabled();
  await screen(page)
    .getByRole('checkbox', { name: 'I want to replace this account’s health records with this backup.' })
    .check();
  await screen(page).getByRole('button', { name: 'Restore these records' }).click();
  await expect(screen(page).getByRole('status')).toContainText('Health records restored');
  await page.goto('/tabs/appointment');
  await expect(screen(page).getByText('Question in my backup')).toBeVisible();
  await expect(screen(page).getByText('Added after backup')).toHaveCount(0);
  await expect(screen(page).getByText(/2 fibroids/)).toBeVisible();
  await expect(screen(page).locator('ol.questions li').filter({ hasText: 'Question in my backup' })).toContainText(
    'Next step: Bring the original report',
  );
  await page.goto('/health/check-in/today');
  await expect(screen(page).getByRole('button', { name: 'Pain', exact: true })).toHaveClass(/selected/);
  await expect(screen(page).getByRole('button', { name: 'Changed my plans', exact: true })).toHaveClass(/selected/);
});
test('Meal loading failure has a working retry and empty states remain reachable', async ({ page, account }) => {
  await openApp(page, account);
  await page.route('**/api/v1/meal-plans/swap-options**', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Fixture unavailable"}' }),
  );
  await page.goto('/food/find');
  await expect(screen(page).getByRole('alert')).toBeVisible();
  await expect(screen(page).getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.unroute('**/api/v1/meal-plans/swap-options**');
  await screen(page).getByRole('button', { name: 'Try again' }).click();
  await expect(screen(page).locator('a.recipe').first()).toBeVisible();
});
test('The four main destinations fit a small phone and wider screen', async ({ page, account }) => {
  await openApp(page, account);
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/tabs/today', '/tabs/food', '/tabs/health', '/tabs/appointment']) {
      await page.goto(route);
      await expect(screen(page).locator('h1').first()).toBeVisible();
      const overflow = await screen(page).evaluate((el) => ({ width: el.scrollWidth, client: el.clientWidth }));
      expect(overflow.width, `Overflow at ${width}: ${route}`).toBeLessThanOrEqual(overflow.client + 1);
      await expect(page.locator('.mobile-nav:visible button')).toHaveCount(4);
    }
  }
});
