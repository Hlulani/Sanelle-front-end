import { test, expect, openApp } from './support/redesign';

/** The reviewers' page: one tap signs the phone in, and each step opens its screen inside the phone. */
test.use({ viewport: { width: 1400, height: 1000 }, isMobile: false, hasTouch: false });

test('Open as Thandi signs the phone in, and Show me opens each feature inside it', async ({ page, account }, info) => {
  // Set up the account as a returning user, then sign out, so the page's own sign-in is what's tested.
  await openApp(page, account);
  await page.evaluate(() => {
    localStorage.removeItem('CapacitorStorage.access_token');
    localStorage.removeItem('CapacitorStorage.refresh_token');
  });

  await page.goto('/phone/index.html');
  await expect(page.getByRole('heading', { name: 'A companion for living with fibroids' })).toBeVisible();
  // The page carries the deployed demo account; this test signs in with a throwaway one instead.
  await page.evaluate(({ email, password }) => {
    document.getElementById('email')!.textContent = email;
    document.getElementById('password')!.textContent = password;
  }, account);

  const phone = page.frameLocator('iframe.screen');
  await page.getByRole('button', { name: 'Show me' }).last().click();
  await expect(page.getByRole('status')).toHaveText('Tap “Open as Thandi” first.');

  await page.getByRole('button', { name: 'Open as Thandi' }).click();
  await expect(page.getByRole('status')).toHaveText('Signed in as Thandi. Pick a step below.', { timeout: 30_000 });
  await expect(phone.getByRole('heading', { name: /^Good (morning|afternoon|evening)/ })).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.screenshot({ path: info.outputPath('reviewers-page.png') });
  await page.locator('[data-go="/learn"]').click();
  await expect(phone.getByRole('heading', { name: 'Diagnosis and reports', exact: true })).toBeVisible();
  await page.locator('[data-go="/tabs/appointment"]').click();
  await expect(
    phone.getByText('Appointment date and main concern', { exact: true }).locator('visible=true'),
  ).toBeVisible();
  await page.locator('[data-go="/health/check-in/today"]').click();
  await expect(phone.getByRole('button', { name: 'Save today’s check-in' })).toBeVisible();

  // The fictional sample report is downloadable for the report-reading step.
  expect((await page.request.get('/phone/sample-report.png')).status()).toBe(200);
});
