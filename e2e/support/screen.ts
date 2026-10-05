import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Waits until a screen has loaded and its slide-in transition has stopped, judged by a
 * landmark on it (usually its heading). Ionic keeps the outgoing page in the DOM while
 * the new one slides in, so acting before this can hit the wrong page.
 */
export async function arrive(page: Page, landmark: Locator): Promise<void> {
  await expect(landmark).toBeVisible();
  await expect
    .poll(() => landmark.evaluate((el) => new Promise<boolean>((resolve) => {
      const start = el.getBoundingClientRect().left;
      setTimeout(() => {
        const end = el.getBoundingClientRect().left;
        resolve(Math.abs(end - start) < 0.5 && end >= 0 && end < 100);
      }, 250);
    })))
    .toBe(true);
  await page.evaluate(() => document.fonts.ready);
}

/** Scrolls inside Ionic's scroll area until the element is in view. */
export async function showOnScreen(locator: Locator, behavior: ScrollBehavior = 'instant'): Promise<void> {
  await expect(locator).toBeVisible();
  await locator.evaluate((el, b) => el.scrollIntoView({ behavior: b, block: 'center' }), behavior);
}

/** Taps a field, then types into it the way a person would. */
export async function type(field: Locator, text: string, delay = 0): Promise<void> {
  await field.tap();
  await field.pressSequentially(text, { delay });
}
