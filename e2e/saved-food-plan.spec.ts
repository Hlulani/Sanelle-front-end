import { mkdir } from 'node:fs/promises';
import { test, expect, screen, openApp, signIn } from './support/redesign';
import { deleteAccount, registerAccount } from './support/accounts';
import { addDays, localIsoDate } from '../src/app/shared/calendar-date';

test.beforeEach(async ({ page, account }) => openApp(page, account));

const savedPlan = (page: import('@playwright/test').Page) =>
  screen(page).getByRole('region', { name: 'My saved meal plan' });
async function openFood(page: import('@playwright/test').Page) {
  const nav = page.locator('.mobile-nav:visible');
  await expect(nav).toHaveCount(1);
  await nav.getByRole('button', { name: 'Food', exact: true }).click();
  await expect(page).toHaveURL(/\/tabs\/food/);
}

test('Save stays in Food and exposes the exact saved meals, cooking, prep and shopping', async ({ page }, info) => {
  await page.goto('/food/requirements');
  await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
  const draftDays = screen(page).locator('.plan-calendar > .plan-day > button');
  await expect(draftDays).toHaveCount(3);
  await draftDays.nth(2).click();
  await screen(page).locator('.meal-choice-list > button:has(app-meal-image)').nth(2).click();
  const name = await draftDays.nth(2).locator('strong').innerText();
  await draftDays.nth(1).click();
  await screen(page).getByRole('button', { name: 'Leave this day open', exact: false }).click();
  await screen(page).getByRole('button', { name: 'Save 3-day plan', exact: true }).click();
  await expect(page).toHaveURL(/\/food\/plan/);
  await expect(screen(page).getByRole('status').filter({ hasText: 'Meal plan saved.' })).toBeInViewport();
  await screen(page)
    .getByRole('link', { name: `Cook Day 3: ${name}`, exact: true })
    .click();
  await expect(screen(page).locator('.planner h2')).toHaveText(name);
  await expect(screen(page).getByRole('heading', { name: 'How to cook', exact: true })).toBeInViewport();
  await openFood(page);
  const saved = savedPlan(page);
  await expect(saved.getByRole('heading', { name: 'My saved meal plan', exact: true })).toBeInViewport();
  const days = saved.locator('.plan-day > button');
  await expect(days).toHaveCount(3);
  await expect(days.nth(2).locator('strong')).toHaveText(name);
  await expect(days.nth(1)).toContainText('No meal planned');
  await expect(saved.getByRole('link', { name: /^Cook Day/ })).toHaveCount(2);
  await expect(saved.locator('app-meal-image img').first()).toBeVisible();
  await mkdir('docs/validation/saved-food-plan-2026-10-10', { recursive: true });
  await page.screenshot({
    path: `docs/validation/saved-food-plan-2026-10-10/${info.project.name}-food-saved-plan.png`,
  });
  await saved.getByRole('link', { name: `Cook Day 3: ${name}`, exact: true }).click();
  const date = new URL(page.url()).searchParams.get('date');
  expect(date).toBe(addDays(localIsoDate(), 2));
  expect(new URL(page.url()).searchParams.get('stage')).toBe('cook');
  await expect(screen(page).locator('.planner h2')).toHaveText(name);
  await expect(screen(page).getByRole('heading', { name: 'How to cook', exact: true })).toBeInViewport();
  await screen(page).getByRole('button', { name: 'I made this', exact: true }).click();
  await expect(screen(page).getByRole('status').filter({ hasText: 'Made ·' })).toBeVisible();
  await openFood(page);
  await expect(days.nth(2)).toHaveClass(/prepared/);
  await expect(days.first()).not.toHaveClass(/prepared/);
  await page.reload();
  await expect(days.nth(2)).toHaveClass(/prepared/);
  await expect(days.nth(2).locator('strong')).toHaveText(name);
  await saved.getByRole('button', { name: 'Open shopping list', exact: true }).click();
  await expect(page).toHaveURL(/\/food\/plan\?view=shopping&week=0/);
  await expect(screen(page).locator('.shopping-section').getByRole('heading')).toBeInViewport();
  await openFood(page);
  await days.nth(1).click();
  await expect(page).toHaveURL(new RegExp(`/food/plan\\?date=${addDays(localIsoDate(), 1)}`));
  await expect(screen(page).locator('.day-editor h3')).toHaveText('Choose a meal');
  await expect(screen(page).getByRole('button', { name: 'Cook this meal', exact: true })).toHaveCount(0);
});

test('Food exposes future monthly plans by week and keeps the saved plan when suggestions fail or a replacement is unsaved', async ({
  page,
}) => {
  await page.goto('/food/requirements');
  await screen(page).getByRole('button', { name: 'More people', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
  await screen(page).getByRole('tab', { name: '1 month', exact: true }).click();
  await screen(page).getByText('Planning preferences', { exact: true }).click();
  const start = addDays(localIsoDate(), 10);
  await screen(page).getByLabel('Start date', { exact: true }).fill(start);
  await screen(page).getByRole('button', { name: 'Update planning preferences', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Save monthly plan', exact: true }).click();
  await expect(page).toHaveURL(/\/food\/plan/);
  await expect(screen(page).getByRole('status').filter({ hasText: 'Meal plan saved.' })).toBeInViewport();
  await openFood(page);
  const saved = savedPlan(page);
  await expect(saved).toContainText('2 people');
  await expect(saved.locator('.plan-count strong')).toHaveText('30');
  await saved.getByRole('button', { name: 'Week 5', exact: true }).click();
  await expect(saved.locator('.plan-day > button')).toHaveCount(2);
  const day30 = saved.getByRole('link', { name: /^Cook Day 30:/ });
  const mealName = await saved.locator('.plan-day > button').nth(1).locator('strong').innerText();
  await day30.click();
  expect(new URL(page.url()).searchParams.get('date')).toBe(addDays(start, 29));
  await expect(screen(page).locator('.planner h2')).toHaveText(mealName);
  await expect(screen(page).locator('.stepper strong')).toHaveText('2');
  await openFood(page);
  await saved.getByRole('button', { name: 'Week 5', exact: true }).click();
  await saved.getByRole('button', { name: 'Open shopping list', exact: true }).click();
  await expect(screen(page).locator('.shopping-section h2')).toHaveText('Week 5 shopping');
  await screen(page).getByRole('button', { name: 'Meal plan', exact: true }).click();
  await screen(page).getByRole('tab', { name: '3 days', exact: true }).click();
  // Resizing creates a replacement draft, which must not replace the saved Food overview before Save.
  await expect(screen(page).locator('.plan-day > button')).toHaveCount(3);
  await openFood(page);
  await expect(saved.locator('.plan-count strong')).toHaveText('30');
  await expect(saved.getByRole('button', { name: 'Week 5', exact: true })).toBeVisible();
  await page.route('**/api/v1/meal-plans/swap-options**', (route) =>
    route.fulfill({ status: 503, json: { message: 'Fictional test outage' } }),
  );
  await page.reload();
  await expect(screen(page).getByRole('alert')).toBeVisible();
  await expect(saved.locator('.plan-count strong')).toHaveText('30');
  await expect(saved.getByRole('link', { name: /^Cook Day/ })).toHaveCount(7);
});

test('cached Food only shows the signed-in account’s saved plan', async ({ page, request, account }) => {
  await page.goto('/food/requirements');
  await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
  await screen(page).getByRole('button', { name: 'Save 3-day plan', exact: true }).click();
  await openFood(page);
  await expect(savedPlan(page)).toBeVisible();
  const second = await registerAccount(request, 'Fictional second planner');
  try {
    await screen(page).getByRole('button', { name: 'Open profile', exact: true }).click();
    await screen(page).getByRole('button', { name: 'Log out', exact: true }).click();
    await signIn(page, second);
    await openFood(page);
    await expect(savedPlan(page)).toHaveCount(0);
    await screen(page).getByRole('button', { name: 'Open profile', exact: true }).click();
    await screen(page).getByRole('button', { name: 'Log out', exact: true }).click();
    await signIn(page, account);
    await openFood(page);
    await expect(savedPlan(page).locator('.plan-count strong')).toHaveText('3');
  } finally {
    await deleteAccount(request, second);
  }
});
