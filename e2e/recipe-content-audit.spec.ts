import { mkdir, writeFile } from 'node:fs/promises';
import { test, expect, screen, openApp } from './support/redesign';
import { API_URL } from './support/accounts';
import { MealResponse } from '../src/app/core/models/meal.model';

const examples = [
  {
    name: 'Baked Cod with Lemon and Greens',
    method: '200°C',
    check: 'Fish',
    endpoint: '63°C',
    input: 'fully thawed fish',
  },
  { name: 'Beef and Veggie Skillet', method: '6-8 minutes', check: 'Ground beef', endpoint: '71°C', input: null },
  {
    name: 'Chicken Rice Soup',
    method: 'fully cooked',
    check: 'Cooked rice',
    endpoint: '24 hours',
    input: 'already cooked',
  },
  {
    name: 'Turkey Chili with Kidney Beans, Bell Peppers, and Avocado',
    method: '20 minutes',
    check: 'Poultry',
    endpoint: '74°C',
    input: 'canned, drained',
  },
  {
    name: 'Lentil Soup with Turmeric and Ginger',
    method: '20-25 minutes',
    check: 'Keeping leftovers',
    endpoint: '48 hours',
    input: 'dried red split lentils',
  },
  {
    name: 'Overnight Oats with Chia and Berries',
    method: 'refrigerat',
    check: 'Keeping leftovers',
    endpoint: '48 hours',
    input: 'refrigeration time',
  },
];

test('reviewed database recipe methods, prerequisites and sources work in Prepare', async ({
  request,
  page,
  account,
}, info) => {
  test.setTimeout(120_000);
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: account.email, password: account.password },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const response = await request.get(`${API_URL}/meals`, { headers: { Authorization: `Bearer ${accessToken}` } });
  expect(response.ok()).toBeTruthy();
  const meals: MealResponse[] = await response.json();
  const reviewed = meals.filter((m) => m.recipeContent?.version === '2026-10-10.v1');
  expect(reviewed).toHaveLength(166);
  expect(reviewed.every((m) => m.recipeContent!.kitchenTested === false)).toBeTruthy();
  await mkdir('docs/validation/recipe-content-2026-10-10', { recursive: true });
  await writeFile(
    `docs/validation/recipe-content-2026-10-10/${info.project.name}-catalog-audit.json`,
    JSON.stringify(
      {
        count: meals.length,
        reviewed: reviewed.length,
        examples: reviewed.filter((m) => examples.some((e) => e.name === m.name)),
      },
      null,
      2,
    ) + '\n',
  );
  await openApp(page, account);
  for (const example of examples) {
    const meal = meals.find((m) => m.name === example.name)!;
    expect(meal, example.name).toBeTruthy();
    expect(meal.instructions.join(' ').toLowerCase()).toContain(example.method.toLowerCase());
    await page.goto(`/food/recipe/${meal.id}?stage=cook`);
    const ui = screen(page);
    await expect(ui.locator('.planner h2')).toHaveText(meal.name);
    await expect(ui.getByRole('list', { name: 'Cooking steps' }).locator('li')).toHaveText(meal.instructions);
    const check = ui.locator('.cooking-checks p').filter({ has: page.getByText(example.check + '.', { exact: true }) });
    await expect(check).toContainText(example.endpoint);
    await expect(check.getByRole('link', { name: 'Source' })).toHaveAttribute('href', /^https:\/\//);
    if (example.input) {
      await ui.locator('.ingredient-notes summary').click();
      await expect(ui.locator('.ingredient-notes')).toContainText(example.input);
    }
    await ui.locator('.recipe-sources summary').click();
    await expect(ui.locator('.recipe-sources')).toContainText('has not been kitchen-tested');
    await expect(ui.locator('.recipe-sources')).toContainText('approximate');
    await expect(ui.locator('.recipe-sources a')).toHaveCount(meal.recipeContent!.sourceUrls.length);
    if (example.name === examples[0].name) {
      await ui.getByRole('heading', { name: 'Check before serving' }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `docs/validation/recipe-content-2026-10-10/${info.project.name}-cod-checks.png` });
    }
  }
  for (const name of ['Oat Banana Pancakes', 'Golden Milk Smoothie Bowl']) {
    const meal = meals.find((m) => m.name === name)!;
    await page.goto(`/food/recipe/${meal.id}?stage=cook`);
    await expect(screen(page).locator('.planner h2')).toHaveText(name);
    const img = screen(page).locator('.planner-image img');
    await expect(img).toHaveAttribute('src', /assets\/meals\//);
    await expect.poll(() => img.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
});
