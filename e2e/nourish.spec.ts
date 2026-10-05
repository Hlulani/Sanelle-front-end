import { expect, test } from './support/fixtures';

test.describe('Planning, cooking and shopping', () => {
  test('a pescatarian plan is previewed, one meal swapped, then saved', async ({ app }) => {
    await app.today.planMeals();
    await app.nourish.waitUntilShown();
    await app.nourish.previewPlan('Pescatarian');

    await expect(app.nourish.groceriesButton()).toBeDisabled(); // nothing to shop for until it's saved
    await expect(app.nourish.mealCards().first()).toContainText('No meat, as you chose');

    const second = (await app.nourish.mealName(1).innerText()).trim();
    const swap = await app.nourish.swapMeal(0);
    expect(swap.after).not.toBe(swap.before);
    await expect(app.nourish.mealName(1)).toHaveText(second); // only the swapped slot changes

    await app.nourish.usePlan();
    await expect(app.nourish.groceriesButton()).toBeEnabled();
    await expect(app.nourish.mealName(0)).toHaveText(swap.after);
  });

  test('cooking a recipe step by step marks it cooked in the plan', async ({ app }) => {
    await app.nourish.open();
    await app.nourish.previewPlan('Any');
    await app.nourish.usePlan();

    const recipe = await app.nourish.openRecipe(0);
    await expect(recipe.servings()).toContainText('1 person');
    await recipe.addPerson();
    await expect(recipe.servings()).toContainText('2 people');

    expect(await recipe.cookToTheEnd()).toBeGreaterThan(0);
    await expect(recipe.cookedBadge()).toBeVisible();

    await recipe.back();
    await app.nourish.waitUntilShown();
    await expect(app.nourish.cookedCount()).toHaveText(/^1 of \d+ meals cooked$/);
  });

  test('the shopping list follows the plan by aisle or by meal', async ({ app }) => {
    await app.nourish.open();
    await app.nourish.previewPlan('Any');
    await app.nourish.usePlan();
    const groceries = await app.nourish.openGroceries();

    const week = await groceries.progress();
    expect(week.total).toBeGreaterThan(0);

    await groceries.shopFor('Next 3 days');
    const threeDays = await groceries.progress();
    expect(threeDays.total).toBeLessThanOrEqual(week.total);

    await groceries.show('By meal');
    await expect(groceries.mealTitles().first()).toBeVisible();
    await groceries.tick(0);
    await groceries.tick(1);
    await expect.poll(async () => (await groceries.progress()).got).toBe(2);

    await groceries.show('By aisle'); // ticks are shared between views
    expect((await groceries.progress()).got).toBe(2);
  });
});
