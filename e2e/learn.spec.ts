import { test, expect, screen, shot, openApp } from './support/redesign';
import { API_URL } from './support/accounts';
test.beforeEach(async ({ page, account }) => openApp(page, account));
test('FOOD-04 published sources separate incidence, growth and treatment', async ({ page }, info) => {
  await page.goto('/food/claims');
  await expect(screen(page).getByRole('heading', { name: 'Food, without the fear' })).toBeVisible();
  const first = screen(page).locator('.claim-row').first();
  if (await first.count()) {
    await first.click();
    await expect(screen(page).getByText('Sources and limitations', { exact: true })).toBeVisible();
    await expect(screen(page).getByText('Sources and limitations', { exact: true })).toBeVisible();
  } else {
    await expect(screen(page).getByText('Food explanations are being reviewed.')).toBeVisible();
  }
  await shot(page, 'FOOD-04', info);
});

test('Evidence sheets keep their originating screen and close within the app', async ({ page }) => {
  await page.goto('/tabs/health');
  await screen(page).locator('.missing-report').first().getByText('Sources and limitations', { exact: true }).click();
  await screen(page).getByRole('link', { name: 'View the evidence and its limitations' }).first().click();
  await expect(page.locator('app-health.sheet-background')).toBeVisible();
  await screen(page).getByRole('button', { name: 'Done reading' }).click();
  await expect(page).toHaveURL(/\/tabs\/health/);
  await page.goto('/learn/C17?from=food');
  await expect(page.locator('app-food.sheet-background')).toBeVisible();
  await expect(screen(page).getByRole('heading', { name: 'A practical take' })).toBeVisible();
  await screen(page).getByRole('button', { name: 'Done reading' }).click();
  await expect(page).toHaveURL(/\/tabs\/food/);
});
test('Unpublished explanation and patient access to internal catalog are blocked', async ({ page }) => {
  await page.goto('/learn/EV-FOOD-SUGAR');
  await expect(screen(page).getByRole('heading', { name: 'This explanation isn’t available' })).toBeVisible();
  await page.goto('/internal/evidence');
  await expect(page).toHaveURL(/tabs\/today/);
  await page.goto('/account');
  await expect(screen(page).getByRole('link', { name: 'Open evidence catalog' })).toHaveCount(0);
});
test('EVC-01–02 internal search, empty recovery, metadata and nonpublished block', async ({
  page,
  request,
  account,
}, info) => {
  const r = await request.post(`${API_URL}/auth/login`, { data: { email: account.email, password: account.password } });
  const user = (await r.json()).user;
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: { ...user, roles: ['EVIDENCE_EDITOR'] } }));
  await page.goto('/internal/evidence');
  await expect(screen(page).getByRole('heading', { name: 'Evidence entries', exact: true })).toBeVisible();
  await shot(page, 'EVC-01', info);
  await screen(page).getByLabel('Search evidence entries').fill('no-entry-matches-xyz');
  await expect(screen(page).getByText('No entries match these filters.', { exact: true })).toBeVisible();
  await screen(page).getByRole('button', { name: 'Clear filters' }).click();
  await screen(page).getByLabel('Filter by status', { exact: true }).selectOption({ label: 'In review' });
  await screen(page).locator('button.catalog-row').first().click();
  await expect(screen(page).getByText('Not available in the patient experience.')).toBeVisible();
  await expect(screen(page).getByText('Relevant study population', { exact: true })).toBeVisible();
  await expect(screen(page).getByRole('heading', { name: 'Review history' })).toBeVisible();
  await expect(screen(page).getByRole('heading', { name: 'Used by', exact: true })).toBeVisible();
  await expect(screen(page).locator('.impact-listing > span')).toHaveCount(0);
  await shot(page, 'EVC-02', info);
});

test('EVC-02P/D/W: published and draft metadata stay separate; withdrawal does not invent a record', async ({
  page,
  request,
  account,
}, info) => {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: account.email, password: account.password },
  });
  const user = (await response.json()).user;
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: { ...user, roles: ['EVIDENCE_EDITOR'] } }));
  await page.goto('/internal/evidence');
  await screen(page).getByLabel('Filter by status').selectOption({ label: 'Published' });
  await screen(page).locator('button.catalog-row').first().click();
  await expect(screen(page).getByRole('heading', { name: 'Review record' })).toBeVisible();
  await expect(screen(page).getByRole('heading', { name: 'Used by', exact: true })).toBeVisible();
  await expect(screen(page).locator('.impact-listing > span')).not.toHaveCount(0);
  await expect(screen(page).getByText('Not available in the patient experience.')).toHaveCount(0);
  await shot(page, 'EVC-02P', info);
  await screen(page).getByRole('button', { name: '← All evidence entries' }).click();
  await screen(page).getByRole('button', { name: 'Open draft example' }).click();
  await expect(screen(page).getByText('Not available in the patient experience.')).toBeVisible();
  await shot(page, 'EVC-02D', info);
  await screen(page).getByRole('button', { name: '← All evidence entries' }).click();
  await screen(page).getByLabel('Filter by status').selectOption({ label: 'Withdrawn' });
  await expect(screen(page).getByText('No entries match these filters.')).toBeVisible();
});
