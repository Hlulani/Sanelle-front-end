import type { Locator, Page } from '@playwright/test';
import { arrive } from '../screen';

/** Base for page objects: one screen of the app and how to wait for it. */
export abstract class ScreenObject {
  constructor(protected readonly page: Page) {}

  protected heading(name: string | RegExp, level?: number): Locator {
    return this.page.getByRole('heading', { name, level });
  }

  protected button(name: string | RegExp, exact = false): Locator {
    return this.page.getByRole('button', { name, exact });
  }

  protected link(name: string | RegExp, exact = false): Locator {
    return this.page.getByRole('link', { name, exact });
  }

  /** A named form field. On short screens Ionic clones the focused input to keep it above the keyboard. */
  protected field(name: string): Locator {
    return this.page.locator(`input[name="${name}"]:not(.cloned-input)`);
  }

  protected arrive(landmark: Locator): Promise<void> {
    return arrive(this.page, landmark);
  }
}
