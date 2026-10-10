import { mkdir, writeFile } from 'node:fs/promises';
import { test, expect, screen, openApp } from './support/redesign';
import { API_URL } from './support/accounts';
import { MealResponse } from '../src/app/core/models/meal.model';

test('database recipes supply the cooking instructions displayed in Prepare', async ({
  page,
  request,
  account,
}, info) => {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: account.email, password: account.password },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const response = await request.get(`${API_URL}/meals`, { headers: { Authorization: `Bearer ${accessToken}` } });
  expect(response.ok()).toBeTruthy();
  const meals: MealResponse[] = await response.json();
  expect(meals.length).toBeGreaterThan(0);
  const missing = meals.filter((m) => !m.instructions?.some((s) => s?.trim()));
  const summary = {
    mealCount: meals.length,
    recipesWithInstructions: meals.length - missing.length,
    missingInstructions: missing.map((m) => ({ id: m.id, name: m.name })),
    example: meals.find((m) => m.name === 'Baked Cod with Lemon and Greens'),
  };
  await mkdir('docs/validation/recipe-instructions-2026-10-10', { recursive: true });
  await writeFile(
    `docs/validation/recipe-instructions-2026-10-10/${info.project.name}-catalog-audit.json`,
    JSON.stringify(summary, null, 2) + '\n',
  );
  console.log(`Meal API audit: ${meals.length} recipes; ${missing.length} missing cooking instructions.`);
  const meal = summary.example ?? meals.find((m) => m.instructions?.length)!;
  await openApp(page, account);
  await page.goto(`/food/recipe/${meal.id}?stage=cook`);
  await expect(screen(page).locator('.planner h2')).toHaveText(meal.name);
  await expect(screen(page).locator('.prep-note ol li')).toHaveText(meal.instructions);
  await expect(screen(page).getByRole('heading', { name: 'How to cook', exact: true })).toBeInViewport();
  await expect(screen(page).locator('.prep-note ol li').first()).toBeInViewport();
  await expect(screen(page).locator('.prep-note ol')).toHaveCSS('list-style-type', 'decimal');
  await page.screenshot({ path: `docs/validation/recipe-instructions-2026-10-10/${info.project.name}-cooking.png` });
});
