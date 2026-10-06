import { expect, type Locator } from '@playwright/test';
import { showOnScreen, type } from '../screen';
import { ScreenObject } from './screen-object';

export class LearnScreen extends ScreenObject {
  async open(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Learn' }).tap();
    await this.waitUntilShown();
  }

  async waitUntilShown(): Promise<void> {
    await this.arrive(this.heading('Learn', 1));
  }

  /** Saves the starter question attached to one of the NHS resources. */
  async saveQuestionAbout(resource: string): Promise<void> {
    const button = this.page
      .locator('article.resource')
      .filter({ hasText: resource })
      .getByRole('button', { name: 'Save a question about this for my visit' });
    await showOnScreen(button);
    await button.tap();
    await expect(
      this.page.getByRole('status').filter({ hasText: 'Saved to your next-visit questions.' }),
    ).toBeVisible();
  }

  /** Turns something read online into a question for the doctor. */
  async askAbout(claim: string): Promise<void> {
    const field = this.page.locator('input[name="claim"]');
    await showOnScreen(field);
    await type(field, claim);
    await this.button('Add to my questions', true).tap();
  }

  topic(title: string): Locator {
    return this.link(new RegExp(title.replace(/[?]/g, '\\?')));
  }

  async openTopic(title: string): Promise<FoodQuestionScreen> {
    await showOnScreen(this.topic(title));
    await this.topic(title).tap();
    const screen = new FoodQuestionScreen(this.page);
    await screen.waitFor(title);
    return screen;
  }
}

export class FoodQuestionScreen extends ScreenObject {
  async waitFor(title: string): Promise<void> {
    await this.arrive(this.heading(title, 1));
  }

  readonly shortAnswer = () => this.page.locator('section.answer');

  async expandOutcome(outcome: RegExp): Promise<void> {
    const row = this.button(outcome);
    await showOnScreen(row);
    await row.tap();
    await expect(row).toHaveAttribute('aria-expanded', 'true');
  }

  async openStudy(study: RegExp): Promise<Locator> {
    const head = this.button(study);
    await showOnScreen(head);
    await head.tap();
    await expect(head).toHaveAttribute('aria-expanded', 'true');
    return this.page.locator('dl.study-more');
  }

  async openSources(): Promise<Locator> {
    const toggle = this.button(/^Sources \(/);
    await showOnScreen(toggle);
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    return this.page.locator('.sources ol li');
  }
}
