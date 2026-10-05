import { expect, type Locator } from '@playwright/test';
import { showOnScreen, type } from '../screen';
import { ScreenObject } from './screen-object';

export class SummaryScreen extends ScreenObject {
  /** From My health, the way she'd get there before a visit. */
  async open(): Promise<void> {
    await this.page.getByRole('tab', { name: 'My health' }).tap();
    const review = this.link('Review what I’ll bring', true);
    await this.arrive(review);
    await review.tap();
    await this.arrive(this.heading('My appointment summary'));
  }

  section(title: string): Locator {
    return this.page.locator('article.doc section.doc-section').filter({ has: this.heading(title) });
  }

  async setMainConcern(text: string): Promise<void> {
    const concern = this.section('My main concern for this visit');
    await concern.getByRole('button', { name: /^(Add|Edit)$/ }).tap();
    await type(this.page.getByRole('textbox', { name: /What would you like help with/ }), text);
    await this.button('Save concern').tap();
    await expect(concern.getByText(text)).toBeVisible();
  }

  async scrollTo(title: string): Promise<Locator> {
    const section = this.section(title);
    await showOnScreen(section);
    return section;
  }
}
