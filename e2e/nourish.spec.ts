import { test, expect, screen, shot, openApp } from './support/redesign';
test.beforeEach(async ({ page, account }) => openApp(page, account));
async function requirements(page: import('@playwright/test').Page) {
  await page.goto('/food/requirements');
  await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
  await expect(page).toHaveURL(/food\/plan/);
  await expect(screen(page).locator('.plan-calendar > button')).not.toHaveCount(0);
}
async function saveAndReturn(page: import('@playwright/test').Page, count: number) {
  await screen(page)
    .getByRole('button', { name: `Save ${count === 30 ? 'monthly' : count + '-day'} plan`, exact: true })
    .click();
  await expect(page).toHaveURL(/tabs\/today/);
  await screen(page).getByRole('button', { name: 'Open meal plan', exact: true }).click();
  await expect(page).toHaveURL(/food\/plan/);
}
test('FOOD-01/01A/02: pictured recipe, servings and favourites', async ({ page }, info) => {
  await page.goto('/tabs/food');
  await expect(screen(page).locator('.planner app-meal-image img')).toBeVisible();
  await shot(page, 'FOOD-01', info);
  await page.goto('/food/requirements');
  await shot(page, 'FOOD-01A', info);
  await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
  await expect(page).toHaveURL(/food\/plan/);
  await page.goto('/tabs/food');
  await screen(page)
    .getByRole('button', { name: /Find something to cook/ })
    .click();
  await expect(page).toHaveURL(/food\/find/);
  await expect(screen(page).locator('a.recipe').first()).toBeVisible();
  await screen(page).getByRole('button', { name: '15 minutes', exact: true }).click();
  await screen(page).locator('a.recipe').first().click();
  await expect(screen(page).locator('.swap').first()).toBeVisible();
  await expect(screen(page).locator('app-meal-image img')).toBeVisible();
  await screen(page).getByRole('button', { name: 'More servings' }).click();
  await expect(screen(page).locator('.stepper strong')).toHaveText('2');
  await screen(page).getByRole('button', { name: 'Save as favourite' }).click();
  await expect(screen(page).getByRole('button', { name: 'Remove favourite' })).toBeVisible();
  await shot(page, 'FOOD-02', info);
  await screen(page).getByRole('button', { name: 'Save this meal and shopping list' }).click();
  await screen(page).getByText('Planning preferences', { exact: true }).click();
  await expect(screen(page).locator('input[name=servings]')).toHaveValue('2');
});
test('Recipe shopping edits persist and follow the meal into the plan', async ({ page }, info) => {
  await requirements(page);
  await page.goto('/food/find');
  await screen(page).locator('a.recipe').first().click();
  const list = screen(page).locator('app-recipe-shopping');
  await expect(list.getByRole('heading', { name: 'Shopping for this meal' })).toBeVisible();
  const checks = list.getByRole('checkbox');
  await expect(checks.first()).toBeVisible();
  const firstName = await checks.first().getAttribute('aria-label');
  const removedName = await checks.nth(1).getAttribute('aria-label');
  await checks.first().check();
  await expect(checks.first()).toBeEnabled();
  await list.getByRole('button', { name: removedName!.replace('Already have ', 'Remove '), exact: true }).click();
  await list.getByLabel('Add another item').fill('Presentation apples');
  await list.getByRole('button', { name: 'Add grocery item' }).click();
  await expect(list.getByText('Presentation apples', { exact: true })).toBeVisible();
  await page.reload();
  await expect(list.getByRole('checkbox', { name: firstName!, exact: true })).toBeChecked();
  await expect(list.getByRole('checkbox', { name: removedName!, exact: true })).toHaveCount(0);
  await expect(list.getByText('Presentation apples', { exact: true })).toBeVisible();
  await expect(screen(page).getByRole('button', { name: 'Save this meal and shopping list' })).toBeEnabled();
  await list.scrollIntoViewIfNeeded();
  await shot(page, 'FOOD-02-shopping', info, false);
  await screen(page).getByRole('button', { name: 'Save this meal and shopping list' }).click();
  await expect(page).toHaveURL(/food\/plan/);
  await expect(
    screen(page).getByRole('checkbox', { name: 'Already have Presentation apples', exact: true }),
  ).toBeVisible();
  await expect(screen(page).getByRole('checkbox', { name: firstName!, exact: true })).toBeChecked();
  await expect(screen(page).getByRole('checkbox', { name: removedName!, exact: true })).toHaveCount(0);
  await saveAndReturn(page, 3);
  await page.reload();
  await expect(
    screen(page).getByRole('checkbox', { name: 'Already have Presentation apples', exact: true }),
  ).toBeVisible();
});
for (const [label, count] of [
  ['3 days', 3],
  ['1 week', 7],
  ['2 weeks', 14],
  ['1 month', 30],
] as const) {
  test(`FOOD-03 ${label}: duration, groceries and preparation persist`, async ({ page }, info) => {
    await requirements(page);
    await screen(page).getByRole('tab', { name: label, exact: true }).click();
    await expect(screen(page).locator('.plan-calendar > button')).toHaveCount(count);
    await saveAndReturn(page, count);
    await screen(page).getByRole('button', { name: 'Mark prep done', exact: true }).click();
    await expect(screen(page).getByRole('button', { name: 'Undo prep', exact: true })).toBeVisible();
    await page.reload();
    await expect(screen(page).getByRole('button', { name: 'Undo prep', exact: true })).toBeVisible();
    await expect(screen(page).getByRole('tab', { name: label, exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(screen(page).getByText('Finding meals…', { exact: true })).toHaveCount(0);
    await expect(screen(page).locator('.meal-choice-list button:has(app-meal-image)')).toHaveCount(3);
    await shot(page, `FOOD-03-${count}-days`, info);
    await screen(page).locator('.plan-calendar').scrollIntoViewIfNeeded();
    await shot(page, `FOOD-03-calendar-${count}`, info, false);
    if (count === 30) await expect(screen(page).getByRole('button', { name: 'Week 5', exact: true })).toBeVisible();
    if (count === 14) await expect(screen(page).getByRole('button', { name: 'Week 2', exact: true })).toBeVisible();
    await screen(page).getByLabel('Add another item').fill('Extra apples');
    await screen(page).getByRole('button', { name: 'Add grocery item' }).click();
    await expect(screen(page).getByText('Extra apples', { exact: true }).first()).toBeVisible();
    await screen(page).getByRole('checkbox', { name: 'Already have Extra apples' }).check();
    await expect(screen(page).getByRole('checkbox', { name: 'Already have Extra apples' })).toBeChecked();
    await page.reload();
    await expect(screen(page).getByRole('checkbox', { name: 'Already have Extra apples' })).toBeChecked();
    await expect(screen(page).getByText('Finding meals…', { exact: true })).toHaveCount(0);
    await expect(screen(page).locator('.meal-choice-list button:has(app-meal-image)')).toHaveCount(3);
    await screen(page).locator('.shopping-section .section-title').scrollIntoViewIfNeeded();
    await shot(page, `FOOD-03-shopping-start-${count}`, info, false);
    await screen(page).getByLabel('Add another item').scrollIntoViewIfNeeded();
    await shot(page, `FOOD-03-shopping-${count}`, info, false);
  });
}
test('FOOD-03A–03C: swap scope, grocery differences, open days and duration edits', async ({ page }, info) => {
  await requirements(page);
  await screen(page).getByRole('tab', { name: '1 month', exact: true }).click();
  await saveAndReturn(page, 30);
  await screen(page).getByRole('button', { name: 'Swap this meal', exact: true }).click();
  await expect(screen(page).getByRole('button', { name: 'Choose this meal' }).first()).toBeVisible();
  await shot(page, 'FOOD-03A', info);
  await screen(page).getByRole('button', { name: 'Choose this meal' }).nth(1).click();
  await screen(page)
    .getByRole('button', { name: /Every occurrence in this plan/ })
    .click();
  await shot(page, 'FOOD-03B', info);
  await screen(page).getByRole('button', { name: 'Review shopping changes' }).click();
  await expect(screen(page).getByText('Added:', { exact: true }).first()).toBeVisible();
  await shot(page, 'FOOD-03C', info);
  await screen(page).getByRole('button', { name: 'Confirm swap and shopping changes' }).click();
  await expect(page).toHaveURL(/food\/plan/);
  await expect(screen(page).locator('.prep-note[role=status]')).toContainText('Meal swapped');
  await screen(page).getByRole('button', { name: 'Undo swap', exact: true }).click();
  await expect(screen(page).locator('.prep-note[role=status]')).toContainText('Swap undone');
  await screen(page)
    .getByRole('button', { name: /Leave this day open/ })
    .click();
  await expect(screen(page).getByRole('heading', { name: 'Choose a meal', exact: true })).toBeVisible();
  await screen(page).getByRole('tab', { name: '3 days', exact: true }).click();
  await screen(page).getByRole('tab', { name: '1 month', exact: true }).click();
  await expect(screen(page).getByRole('heading', { name: 'Choose a meal', exact: true })).toBeVisible();
  await saveAndReturn(page, 30);
  await page.reload();
  await expect(screen(page).getByRole('heading', { name: 'Choose a meal', exact: true })).toBeVisible();
});
test('Strict allergies override preferences', async ({ page }) => {
  await page.goto('/food/requirements');
  await screen(page).getByRole('button', { name: 'Peanut', exact: true }).click();
  await screen(page).getByRole('radio', { name: 'Vegetarian', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
  await expect(page).toHaveURL(/food\/plan/);
  await page.goto('/food/find');
  await screen(page).getByLabel('What do you have or feel like?').fill('peanut');
  await expect(screen(page).getByText('No meals match these choices.')).toBeVisible();
});

test('FOOD-03V/03N swap flags ingredient preferences and recovers from no compatible choices', async ({
  page,
}, info) => {
  await requirements(page);
  await saveAndReturn(page, 3);
  await screen(page).getByRole('button', { name: 'Not this ingredient', exact: true }).first().click();
  await expect(screen(page).getByText('Preference saved. Future suggestions will flag this ingredient.')).toBeVisible();
  await screen(page).getByRole('button', { name: 'Swap this meal', exact: true }).click();
  const flagged = screen(page).locator('article.option').filter({ hasText: 'You like this meal but not' }).first();
  await expect(flagged.locator('.status-chip')).toHaveText('Needs your review');
  await flagged.scrollIntoViewIfNeeded();
  await shot(page, 'FOOD-03V', info, false);
  await flagged.getByText('My preferences for this meal', { exact: true }).click();
  await expect(flagged.getByRole('link', { name: 'Like this meal but not an ingredient?' })).toHaveCount(1);
  await page.route('**/api/v1/meal-plans/swap-options**', (route) => route.fulfill({ json: [] }));
  await page.reload();
  await expect(screen(page).getByText('No meals match this search and your requirements.')).toBeVisible();
  await shot(page, 'FOOD-03N', info);
  await screen(page).getByRole('link', { name: 'Review requirements', exact: true }).click();
  await expect(page).toHaveURL(/food\/requirements/);
});

test('FOOD-03G1/G2 weekly shopping edits stay in their own week', async ({ page }, info) => {
  await requirements(page);
  await screen(page).getByRole('tab', { name: '2 weeks', exact: true }).click();
  await saveAndReturn(page, 14);
  const shopping = screen(page).locator('.shopping-section');
  await screen(page).getByLabel('Add another item').fill('Week one apples');
  await screen(page).getByRole('button', { name: 'Add grocery item' }).click();
  await expect(shopping.getByText('Week one apples', { exact: true })).toBeVisible();
  await screen(page).getByRole('button', { name: 'Week 2', exact: true }).click();
  await expect(shopping.getByText('Week one apples', { exact: true })).toHaveCount(0);
  await screen(page).getByLabel('Add another item').fill('Week two pears');
  await screen(page).getByRole('button', { name: 'Add grocery item' }).click();
  await expect(shopping.getByText('Week two pears', { exact: true })).toBeVisible();
  await screen(page).locator('.shopping-section').scrollIntoViewIfNeeded();
  await shot(page, 'FOOD-03G2', info, false);
  await page.reload();
  await expect(shopping.getByText('Week one apples', { exact: true })).toBeVisible();
  await expect(shopping.getByText('Week two pears', { exact: true })).toHaveCount(0);
  await screen(page).getByRole('button', { name: 'Week 2', exact: true }).click();
  await expect(shopping.getByText('Week two pears', { exact: true })).toBeVisible();
});

test('FOOD-01AA–01AR: strict rules, preferences and household remain distinct after reload', async ({ page }, info) => {
  await page.goto('/food/requirements');
  await screen(page).getByRole('button', { name: 'Peanut', exact: true }).click();
  await shot(page, 'FOOD-01AA', info);
  const intolerance = screen(page)
    .locator('app-word-list')
    .filter({ has: page.getByLabel('Add an intolerance') });
  await intolerance.getByRole('textbox').fill('rice');
  await intolerance.getByRole('button', { name: 'Add', exact: true }).click();
  await shot(page, 'FOOD-01AI', info);
  await screen(page).getByRole('radio', { name: 'Vegetarian', exact: true }).click();
  await shot(page, 'FOOD-01AD', info);
  await screen(page).getByRole('button', { name: 'No alcohol in cooking', exact: true }).click();
  await shot(page, 'FOOD-01AC', info);
  await screen(page).getByRole('button', { name: 'More people' }).click();
  await shot(page, 'FOOD-01AH', info);
  await screen(page).getByRole('button', { name: 'Cook once, eat twice', exact: true }).click();
  await shot(page, 'FOOD-01AR', info);
  await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
  await expect(page).toHaveURL(/food\/plan/);
  await page.goto('/food/requirements');
  await expect(screen(page).getByRole('button', { name: 'Peanut', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(screen(page).getByRole('radio', { name: 'Vegetarian', exact: true })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(screen(page).getByRole('button', { name: 'Remove rice' })).toBeVisible();
  await expect(screen(page).getByRole('button', { name: 'No alcohol in cooking', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(screen(page).locator('.stepper strong')).toHaveText('2');
});

test('FOOD-03N: no compatible recipes keeps the requirements recovery path', async ({ page }) => {
  await page.route('**/api/v1/meal-plans/swap-options**', (route) => route.fulfill({ json: [] }));
  await page.goto('/food/requirements');
  await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
  await expect(page).toHaveURL(/food\/plan/);
  await expect(screen(page).getByRole('alert')).toContainText('No meals meet all your requirements');
  await page.goto('/food/find');
  await expect(screen(page).getByText('No meals match these choices.')).toBeVisible();
  await screen(page).getByRole('link', { name: 'Review my requirements', exact: true }).click();
  await expect(page).toHaveURL(/food\/requirements/);
});
