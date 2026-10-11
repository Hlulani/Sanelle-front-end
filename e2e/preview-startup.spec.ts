import { mkdir } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import { API_URL, deleteAccount, registerAccount, TestAccount } from './support/accounts';

const test = base.extend<{ account: TestAccount }>({
  account: async ({ request }, use) => {
    const account = await registerAccount(request, 'Thandi');
    try {
      await use(account);
    } finally {
      await deleteAccount(request, account);
    }
  },
});

function fixtureToken(expiresInSeconds: number): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none' })}.${encode({ sub: 'startup-fixture@example.test', exp: Math.floor(Date.now() / 1000) + expiresInSeconds })}.fixture`;
}

test('the phone frame signs into the real backend and loads database recipes', async ({
  page,
  request,
  account,
}, info) => {
  await page.goto('/phone');
  const app = page.frameLocator('iframe[title="Sanelle app"]');
  await app.getByRole('link', { name: 'I already have an account' }).click();
  await app.getByLabel('Email', { exact: true }).fill(account.email);
  await app.getByLabel('Password', { exact: true }).fill(account.password);
  const response = page.waitForResponse((r) => r.url().endsWith('/auth/login') && r.request().method() === 'POST', {
    timeout: 10_000,
  });
  await app.getByRole('button', { name: 'Log in', exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect.poll(() => page.frames().some((f) => /\/onboarding|\/tabs\/today/.test(f.url()))).toBe(true);
  const setup = app.getByLabel('First name', { exact: true });
  if (await setup.isVisible()) {
    await setup.fill('Thandi');
    for (const name of [
      'Start setting up Sanelle',
      'Continue',
      'Continue',
      'Continue',
      'Review setup',
      'Open Sanelle',
    ]) {
      await app.getByRole('button', { name, exact: true }).click();
    }
  }
  await expect(app.getByRole('heading', { name: 'Good morning, Thandi' })).toBeVisible();
  await mkdir('docs/validation/startup-recovery-2026-10-10', { recursive: true });
  await page.screenshot({ path: `docs/validation/startup-recovery-2026-10-10/${info.project.name}-signed-in.png` });
  const frame = page.frames().find((f) => /\/tabs\/today/.test(f.url()))!;
  await frame.goto(new URL('/food/requirements', page.url()).href);
  await app.getByRole('button', { name: 'Confirm and plan meals', exact: true }).click();
  await app.getByRole('button', { name: 'Save 3-day plan', exact: true }).click();
  await expect.poll(() => frame.url()).toContain('/food/plan');
  await expect(app.getByRole('status').filter({ hasText: 'Meal plan saved.' })).toBeInViewport();
  const navigation = app.locator('.mobile-nav:visible');
  await expect(navigation).toHaveCount(1);
  await navigation.getByRole('button', { name: 'Food', exact: true }).click();
  const saved = app.getByRole('region', { name: 'My saved meal plan' });
  await expect(saved.getByRole('heading')).toBeInViewport();
  await expect(saved.getByRole('link', { name: /^Cook Day/ })).toHaveCount(3);
  await mkdir('docs/validation/saved-food-plan-2026-10-10', { recursive: true });
  await page.screenshot({
    path: `docs/validation/saved-food-plan-2026-10-10/${info.project.name}-phone-saved-plan.png`,
  });
  const cook = saved.getByRole('link', { name: /^Cook Day 1:/ });
  const mealId = new URL((await cook.getAttribute('href'))!, page.url()).pathname.split('/').pop();
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: account.email, password: account.password },
  });
  expect(login.ok()).toBe(true);
  const { accessToken } = await login.json();
  const catalogue = await request.get(`${API_URL}/meals`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const meals = await catalogue.json();
  const meal = meals.find((m: { id: string }) => m.id === mealId);
  expect(meal).toBeTruthy();
  await cook.click();
  await expect(app.getByRole('heading', { name: 'How to cook', exact: true })).toBeVisible();
  await expect(app.getByRole('list', { name: 'Cooking steps' }).locator('li')).toHaveText(meal.instructions);
  await expect(app.locator('.recipe-cooking-name')).toHaveText(meal.name);
  await page.screenshot({
    path: `docs/validation/startup-recovery-2026-10-10/${info.project.name}-database-recipe.png`,
  });
});

test('the real phone frame opens Welcome and reaches sign-in', async ({ page }, info) => {
  await page.goto('/phone');
  const app = page.frameLocator('iframe[title="Sanelle app"]');
  await expect(app.getByRole('heading', { name: 'Your health information, finally in one place.' })).toBeVisible();
  await expect(app.locator('#splash')).toHaveCount(0);
  await mkdir('docs/validation/startup-recovery-2026-10-10', { recursive: true });
  await page.screenshot({ path: `docs/validation/startup-recovery-2026-10-10/${info.project.name}-phone-welcome.png` });
  await app.getByRole('link', { name: 'I already have an account' }).click();
  await expect(app.getByLabel('Email', { exact: true })).toBeVisible();
});

test('a stalled saved-session refresh cannot trap the phone on its splash', async ({ page }) => {
  const refresh = fixtureToken(3600);
  await page.addInitScript(
    ({ access, refresh }) => {
      localStorage.setItem('CapacitorStorage.access_token', access);
      localStorage.setItem('CapacitorStorage.refresh_token', refresh);
      localStorage.setItem('startup-fixture-record', 'Fictional saved information');
    },
    { access: fixtureToken(-3600), refresh },
  );
  let requested = false;
  await page.route('**/auth/refresh', () => {
    requested = true;
  });
  await page.goto('/phone');
  await expect.poll(() => requested).toBe(true);
  const app = page.frameLocator('iframe[title="Sanelle app"]');
  await expect(app.getByRole('link', { name: 'I already have an account' })).toBeVisible({ timeout: 25_000 });
  await expect(app.locator('#splash')).toHaveCount(0);
  await app.getByRole('link', { name: 'I already have an account' }).click();
  await expect(app.getByLabel('Email', { exact: true })).toBeVisible({ timeout: 3000 });
  const frame = page.frames().find((frame) => frame.url().endsWith('/login'))!;
  const saved = await frame.evaluate(() => ({
    refresh: localStorage.getItem('CapacitorStorage.refresh_token'),
    record: localStorage.getItem('startup-fixture-record'),
  }));
  expect(saved).toEqual({ refresh, record: 'Fictional saved information' });
});

test('a missing application script offers recovery and reload opens the app', async ({ page }, info) => {
  const main = /\/main(?:-[^/]+)?\.js(?:\?.*)?$/;
  await page.route(main, (route) => route.abort());
  await page.goto('/phone');
  const app = page.frameLocator('iframe[title="Sanelle app"]');
  await expect(app.getByRole('button', { name: 'Reload Sanelle' })).toBeVisible({ timeout: 25_000 });
  await expect(app.locator('#startup-recovery')).toContainText('taking longer to open');
  await mkdir('docs/validation/startup-recovery-2026-10-10', { recursive: true });
  await page.screenshot({ path: `docs/validation/startup-recovery-2026-10-10/${info.project.name}-recovery.png` });
  await page.unroute(main);
  await app.getByRole('button', { name: 'Reload Sanelle' }).click();
  await expect(app.getByRole('link', { name: 'I already have an account' })).toBeVisible();
  await expect(app.locator('#splash')).toHaveCount(0);
});

test('missing preview assets return 404 instead of app HTML', async ({ request }) => {
  const home = await request.get('/');
  expect(home.status()).toBe(200);
  expect(home.headers()['content-type']).toContain('text/html');
  const response = await request.get('/chunk-old-build-missing.js');
  expect(response.status()).toBe(404);
  expect(response.headers()['content-type'] ?? '').not.toContain('text/html');
});
