import { test, expect, type Page } from '@playwright/test';

/**
 * The live site, signed in to a live account. Runs only through e2e/live.config.ts.
 * Set SANELLE_LIVE_EMAIL and SANELLE_LIVE_PASSWORD to an account that has finished onboarding.
 * Set SANELLE_LIVE_AI=1 to also make one real Sanelle AI request (it uses API credit).
 */
const API = process.env['SANELLE_LIVE_API'] ?? 'https://sanelle-api.onrender.com/api/v1';
const shown = (page: Page) => page.locator('main:visible, .sheet:visible').last();

function liveAccount() {
  const email = process.env['SANELLE_LIVE_EMAIL'];
  const password = process.env['SANELLE_LIVE_PASSWORD'];
  if (!email || !password) throw new Error('Set SANELLE_LIVE_EMAIL and SANELLE_LIVE_PASSWORD for the live check.');
  return { email, password };
}

test('the API is up and Sanelle AI is switched on', async ({ request }) => {
  const login = await request.post(`${API}/auth/login`, { data: liveAccount(), timeout: 240_000 });
  expect(login.ok(), 'live account signs in').toBeTruthy();
  const { accessToken } = await login.json();
  const status = await request.get(`${API}/ai/status`, { headers: { Authorization: `Bearer ${accessToken}` } });
  expect(await status.json(), 'Sanelle AI available').toMatchObject({ available: true });
});

test('sign in, log a check-in and see it on Today', async ({ page }) => {
  const { email, password } = liveAccount();
  await page.goto('/');
  await page.getByRole('link', { name: 'I already have an account' }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/tabs\/today/, { timeout: 240_000 });
  await page.goto('/health/check-in/today');
  const sheet = page.locator('.sheet:visible').first();
  for (const name of ['Bleeding', 'Pain']) {
    const b = sheet.getByRole('button', { name, exact: true });
    if (!(await b.getAttribute('class'))?.includes('selected')) await b.click();
  }
  await sheet.getByRole('button', { name: 'Heavy', exact: true }).click();
  await sheet.getByRole('button', { name: 'Changed my plans', exact: true }).click();
  await sheet
    .getByLabel('Anything else, in your own words? (optional)')
    .fill('Flooding at night, had to change pads twice');
  await sheet.getByRole('button', { name: 'Save today’s check-in' }).click();
  await expect(page).toHaveURL(/\/health\/symptoms/);

  await page.goto('/tabs/today');
  await expect(shown(page).getByText('Here’s what you recorded', { exact: true })).toBeVisible();

  // Her note is matched to a published explanation, and Sanelle AI is offered.
  await page.goto('/tabs/health?view=symptoms');
  const worth = shown(page).getByRole('region', { name: 'Worth bringing up' });
  await expect(worth).toContainText('You wrote: “Flooding at night, had to change pads twice”');
  await expect(worth.getByRole('button', { name: 'Suggest with AI' })).toBeVisible();
  if (process.env['SANELLE_LIVE_AI'] === '1') {
    await worth.getByRole('button', { name: 'Suggest with AI' }).click();
    await worth.getByRole('button', { name: 'Send and draft' }).click();
    await expect(
      worth.getByRole('status').filter({ hasText: /Drafted by Sanelle AI|Nothing from AI met/ }),
    ).toBeVisible({
      timeout: 90_000,
    });
  }

  await page.goto('/tabs/appointment');
  await shown(page).getByText('Appointment date and main concern', { exact: true }).click();
  await expect(shown(page).getByRole('button', { name: 'Draft with AI' })).toBeVisible();

  await page.goto('/health/report/new');
  await expect(shown(page).getByRole('button', { name: /Preview with Thandi’s sample report/ })).toBeVisible();
  await page.goto('/tabs/food');
  await expect(shown(page).getByRole('heading', { level: 1 })).toBeVisible();
});
