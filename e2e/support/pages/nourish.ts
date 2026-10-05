import { expect, type Locator } from '@playwright/test';
import { showOnScreen } from '../screen';
import { ScreenObject } from './screen-object';

export class NourishScreen extends ScreenObject {
  async open(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Nourish' }).tap();
    await this.waitUntilShown();
  }

  async waitUntilShown(): Promise<void> {
    await this.arrive(this.heading('Nourish', 1));
  }

  /** Steps through plan setup with the defaults except what someone eats, then previews. */
  async previewPlan(eats: 'Any' | 'Pescatarian' | 'Vegetarian' | 'Vegan'): Promise<void> {
    await this.tapInView(this.button('Next: food choices'));
    const choice = this.page.locator('.chip-row')
      .filter({ has: this.button('Pescatarian', true) })
      .getByRole('button', { name: eats, exact: true });
    await this.tapInView(choice);
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
    await this.tapInView(this.button('Next: check my choices'));
    await this.tapInView(this.button('Preview my meals'));
    await this.arrive(this.heading('Check your new plan'));
  }

  mealCards(): Locator {
    return this.page.locator('.meal-card');
  }

  mealName(index: number): Locator {
    return this.mealCards().nth(index).locator('.meal-name');
  }

  groceriesButton(): Locator {
    return this.button('Groceries');
  }

  status(text: string | RegExp): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }

  /** Swaps one meal for the first alternative offered; returns the meal it replaced and its replacement. */
  async swapMeal(index: number): Promise<{ before: string; after: string }> {
    const before = (await this.mealName(index).innerText()).trim();
    await this.tapInView(this.mealCards().nth(index).getByRole('button', { name: 'Swap' }));
    await expect(this.page.getByText('Pick a replacement')).toBeVisible();
    await this.button('Use this meal').first().tap();
    await expect(this.status('Replaced only this meal')).toBeVisible();
    await expect(this.mealName(index)).not.toHaveText(before);
    return { before, after: (await this.mealName(index).innerText()).trim() };
  }

  async usePlan(): Promise<void> {
    await this.tapInView(this.button('Use this plan'));
    await expect(this.status('Your plan is saved')).toBeVisible();
  }

  async openRecipe(index: number): Promise<RecipeScreen> {
    const name = (await this.mealName(index).innerText()).trim();
    await this.tapInView(this.mealCards().nth(index).getByRole('button', { name: 'View recipe' }));
    const recipe = new RecipeScreen(this.page);
    await recipe.waitFor(name);
    return recipe;
  }

  async openGroceries(): Promise<GroceriesScreen> {
    await this.tapInView(this.groceriesButton());
    const groceries = new GroceriesScreen(this.page);
    await groceries.waitUntilShown();
    return groceries;
  }

  cookedCount(): Locator {
    return this.page.getByText(/^\d+ of \d+ meals cooked$/);
  }

  private async tapInView(target: Locator): Promise<void> {
    await showOnScreen(target);
    await target.tap();
  }
}

export class RecipeScreen extends ScreenObject {
  async waitFor(name: string): Promise<void> {
    await this.arrive(this.heading(name, 1));
  }

  servings(): Locator {
    return this.page.locator('.servings-value');
  }

  async addPerson(): Promise<void> {
    const more = this.button('More people');
    await showOnScreen(more);
    await more.tap();
  }

  /** Opens cook mode and steps through to the end; returns how many steps it had. */
  async cookToTheEnd(): Promise<number> {
    const start = this.button(/^(Start cooking|Cook it again)$/);
    await showOnScreen(start);
    await start.tap();
    const title = this.page.getByText(/^Step 1 of (\d+)$/);
    await expect(title).toBeVisible();
    const steps = Number((await title.innerText()).match(/of (\d+)/)![1]);
    for (let i = 1; i < steps; i++) {
      await this.button('Next step').tap();
      await expect(this.page.getByText(`Step ${i + 1} of ${steps}`)).toBeVisible();
    }
    await this.button('Done cooking').tap();
    return steps;
  }

  cookedBadge(): Locator {
    return this.page.getByText('Marked as cooked');
  }

  async back(): Promise<void> {
    await this.page.locator('.topbar').getByRole('button', { name: 'Back', exact: true }).tap();
  }
}

export class GroceriesScreen extends ScreenObject {
  async waitUntilShown(): Promise<void> {
    await this.arrive(this.heading('Shopping list'));
    await expect(this.page.getByText('items collected')).toBeVisible();
  }

  /** "0 of 41" from the progress ring. */
  async progress(): Promise<{ got: number; total: number }> {
    const [got, total] = (await this.page.locator('.progress-value').innerText()).match(/\d+/g)!.map(Number);
    return { got, total };
  }

  async shopFor(window: 'Next 3 days' | 'This week' | 'Whole plan'): Promise<void> {
    await this.button(window, true).tap();
    await expect(this.button(window, true)).toHaveAttribute('aria-pressed', 'true');
  }

  async show(view: 'By aisle' | 'By meal'): Promise<void> {
    await this.button(view, true).tap();
    await expect(this.button(view, true)).toHaveAttribute('aria-pressed', 'true');
  }

  mealTitles(): Locator {
    return this.page.locator('.meal-title');
  }

  async tick(index: number): Promise<void> {
    const item = this.page.locator('ion-checkbox.item-check').nth(index);
    await showOnScreen(item);
    await item.tap();
  }
}
