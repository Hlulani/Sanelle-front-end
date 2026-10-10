import { test, expect, screen, openApp } from './support/redesign';

test.beforeEach(async ({ page, account }) => openApp(page, account));

test('a selected planned meal opens its own cooking steps and saves preparation for that day', async ({ page }) => {
  await page.goto('/food/requirements');
  await screen(page).getByRole('button', { name: 'More people', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
  const days = screen(page).locator('.plan-calendar > .plan-day > button');
  await expect(days).toHaveCount(3);
  await days.nth(2).click();
  const choices = screen(page)
    .locator('.meal-choice-list > button')
    .filter({ has: page.locator('app-meal-image') });
  await choices.nth(2).click();
  const mealName = await days.nth(2).locator('strong').innerText();
  const otherMealName = await days.first().locator('strong').innerText();
  expect(mealName).not.toBe(otherMealName);
  await expect(screen(page).locator('.planner h2')).toHaveText(mealName);
  await screen(page).getByRole('button', { name: 'Save 3-day plan', exact: true }).click();
  await expect(page).toHaveURL(/\/food\/plan/);
  await expect(screen(page).getByRole('status').filter({ hasText: 'Meal plan saved.' })).toBeInViewport();
  await screen(page).getByRole('button', { name: 'Edit Day 3', exact: true }).click();
  await expect(screen(page).locator('.day-editor h3')).toHaveText(mealName);
  await expect(screen(page).getByRole('button', { name: 'Cook this meal', exact: true })).toBeInViewport();
  await screen(page)
    .getByRole('link', { name: 'Cook Day 3: ' + mealName, exact: true })
    .click();
  const query = new URL(page.url()).searchParams;
  expect(query.get('stage')).toBe('cook');
  const date = query.get('date');
  expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await expect(screen(page).locator('.planner h2')).toHaveText(mealName);
  await expect(screen(page).getByRole('button', { name: '2. Prepare', exact: true })).toHaveClass(/selected/);
  await expect(screen(page).getByRole('heading', { name: 'How to cook', exact: true })).toBeInViewport();
  await expect(screen(page).locator('.prep-note ol li').first()).toBeVisible();
  await expect(screen(page).locator('.stepper strong')).toHaveText('2');
  await screen(page).getByRole('button', { name: 'Mark prep done', exact: true }).click();
  await expect(screen(page).getByRole('button', { name: 'Undo prep', exact: true })).toBeVisible();
  await page.reload();
  await expect(screen(page).locator('.planner h2')).toHaveText(mealName);
  await expect(screen(page).getByRole('button', { name: 'Undo prep', exact: true })).toBeVisible();
  await screen(page).getByRole('link', { name: 'Back to my meal plan', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/food/plan\\?date=${date}`));
  await expect(days.nth(2)).toHaveClass(/selected/);
  await expect(days.nth(2)).toHaveClass(/prepared/);
  await expect(days.first()).not.toHaveClass(/prepared/);
  await expect(screen(page).locator('.day-editor h3')).toHaveText(mealName);
  // Reuse the recipe route for another meal. The name and preparation state must update.
  await days.first().click();
  await expect(screen(page).locator('.planner h2')).toHaveText(otherMealName);
  await expect(screen(page).getByRole('button', { name: 'Mark prep done', exact: true })).toBeVisible();
  await screen(page).getByRole('link', { name: 'Back to my meal plan', exact: true }).click();
  await days.nth(2).click();
  await screen(page).getByRole('button', { name: 'Undo prep', exact: true }).click();
  await screen(page).getByRole('link', { name: 'Back to my meal plan', exact: true }).click();
  await expect(days.nth(2)).not.toHaveClass(/prepared/);
});

test('an open day has no stale recipe or cooking action', async ({ page }) => {
  await page.goto('/food/requirements');
  await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
  const days = screen(page).locator('.plan-calendar > .plan-day > button');
  await expect(days).toHaveCount(3);
  await days.nth(1).click();
  await screen(page).getByRole('button', { name: 'Leave this day open', exact: false }).click();
  await expect(screen(page).locator('.day-editor h3')).toHaveText('Choose a meal');
  await expect(screen(page).getByRole('button', { name: 'Cook this meal', exact: true })).toHaveCount(0);
  await expect(screen(page).locator('app-flexible-recipe')).toHaveCount(0);
});

test('Today cooks the actual saved meal and shopping is a separate persistent task', async ({ page }, info) => {
  await page.goto('/food/requirements');
  await screen(page).getByRole('button', { name: 'More people', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
  const mealName = await screen(page)
    .locator('.plan-calendar > .plan-day > button')
    .first()
    .locator('strong')
    .innerText();
  await screen(page).getByRole('button', { name: 'Save 3-day plan', exact: true }).click();
  await expect(page).toHaveURL(/\/food\/plan/);
  const navigation = page.locator('.mobile-nav:visible');
  await expect(navigation).toHaveCount(1);
  await navigation.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(page).toHaveURL(/\/tabs\/today/);
  await expect(screen(page).locator('.meal-feature h2')).toHaveText(mealName);
  await expect(screen(page).locator('.meal-feature app-meal-image img')).toBeVisible();
  await screen(page).getByRole('button', { name: 'Cook today’s meal', exact: true }).click();
  await expect(page).toHaveURL(/food\/recipe\/.+stage=cook/);
  await expect(screen(page).locator('.planner h2')).toHaveText(mealName);
  await expect(screen(page).getByRole('heading', { name: 'How to cook', exact: true })).toBeInViewport();
  await screen(page).getByRole('button', { name: '1. Plan', exact: true }).click();
  await screen(page).getByRole('link', { name: 'Back to my meal plan', exact: true }).click();
  await screen(page).locator('.plan-calendar > .plan-day > button').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `docs/validation/meal-navigation-2026-10-10/${info.project.name}-meal-cards.png` });
  await screen(page).locator('.plan-calendar > .plan-day > button').first().click();
  await expect(screen(page).locator('.planner h2')).toHaveText(mealName);
  await expect(screen(page).getByRole('heading', { name: 'How to cook', exact: true })).toBeInViewport();
  await screen(page).getByRole('link', { name: 'Back to my meal plan', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Shopping list', exact: true }).click();
  await expect(page).toHaveURL(/view=shopping/);
  const shopping = screen(page).locator('.shopping-section');
  await expect(shopping.getByRole('heading')).toBeInViewport();
  await expect(
    screen(page).locator('.meal-plan-builder, app-flexible-recipe, app-food-paths, .plan-groceries'),
  ).toHaveCount(0);
  const first = shopping.getByRole('checkbox').first();
  const itemLabel = await first.getAttribute('aria-label');
  await expect(shopping.locator('.shopping-row').first().locator('small')).not.toHaveText('');
  const removedLabel = await shopping.getByRole('checkbox').nth(1).getAttribute('aria-label');
  await first.check();
  await shopping.getByRole('button', { name: removedLabel!.replace('Already have ', 'Remove '), exact: true }).click();
  await shopping.getByLabel('Add another item').fill('Test apples');
  await shopping.getByLabel('Quantity for added item (optional)').fill('6');
  await shopping.getByRole('button', { name: 'Add grocery item', exact: true }).click();
  await expect(shopping.getByText('Test apples', { exact: true })).toBeVisible();
  await expect(shopping.locator('.shopping-row').filter({ hasText: 'Test apples' }).locator('small')).toHaveText('6');
  await page.reload();
  await expect(shopping.getByRole('checkbox', { name: itemLabel!, exact: true })).toBeChecked();
  await expect(shopping.getByRole('checkbox', { name: removedLabel!, exact: true })).toHaveCount(0);
  await expect(shopping.getByText('Test apples', { exact: true })).toBeVisible();
  await expect(shopping.locator('.shopping-row').filter({ hasText: 'Test apples' }).locator('small')).toHaveText('6');
  await shopping.getByText('Removed items', { exact: true }).click();
  await shopping.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(shopping.getByRole('checkbox', { name: removedLabel!, exact: true })).not.toBeChecked();
  await screen(page).getByRole('button', { name: 'Meal plan', exact: true }).click();
  await expect(screen(page).locator('.plan-calendar > .plan-day > button').first().locator('strong')).toHaveText(
    mealName,
  );
  await page.goBack();
  await expect(shopping.getByRole('heading')).toBeVisible();
  await expect(shopping.getByRole('checkbox', { name: itemLabel!, exact: true })).toBeChecked();
  await shopping.getByRole('heading').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `docs/validation/meal-navigation-2026-10-10/${info.project.name}-shopping.png` });
});
