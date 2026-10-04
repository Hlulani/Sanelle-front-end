import { expect, test, type Locator, type Page } from '@playwright/test';
import { rename } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { API_URL, DIAGNOSIS, FOOD_QUESTION, THANDI } from './thandi';

/**
 * One happy-path recording of Sanelle with Thandi, a fictional demo user.
 * Any failed step fails the run, and the saved recording is only replaced after a full journey.
 */
const RECORDINGS = path.join(__dirname, 'recordings');
const OUTPUT = path.join(RECORDINGS, 'sanelle-demo-thandi.webm');

// Pauses sized for narration: a beat after an action, longer on screens worth explaining.
const BEAT = 900;
const READ = 2500;
const LINGER = 4000;

/** Setup, outside the recording: Thandi's account exists on the local backend. */
test.beforeAll(async ({ playwright }) => {
  const api = await playwright.request.newContext();
  try {
    const login = await api.post(`${API_URL}/auth/login`, { data: { email: THANDI.email, password: THANDI.password } });
    if (!login.ok()) {
      const register = await api.post(`${API_URL}/auth/register`, { data: THANDI });
      expect(register.ok(), `Could not create Thandi's demo account (HTTP ${register.status()}). Is the backend running on ${API_URL}?`).toBe(true);
    }
  } finally {
    await api.dispose();
  }
});

test('Thandi: diagnosis, food question, meal plan, appointment summary', async ({ page }) => {
  // 1. Sign in as Thandi.
  await page.goto('/welcome');
  await arrive(page, page.getByRole('heading', { name: /Diagnosed with fibroids/ }));
  await hold(page, READ);
  await page.getByRole('button', { name: 'I already have an account' }).tap();

  await arrive(page, page.getByRole('heading', { name: 'Welcome back' }));
  await page.locator('input[name="email"]').pressSequentially(THANDI.email, { delay: 45 });
  await page.locator('input[name="password"]').pressSequentially(THANDI.password, { delay: 30 });
  await hold(page, BEAT);
  await page.locator('ion-button.main-submit-btn').tap();

  await arrive(page, page.getByRole('heading', { name: 'Hi Thandi' }));
  await arrive(page, page.getByRole('heading', { name: 'Start with what you know' }));
  await hold(page, LINGER);

  // 2. Record her diagnosis, leave one detail unknown and save its suggested question.
  await page.getByRole('button', { name: 'Enter details myself' }).tap();
  await answer(page, 'How many fibroids does your report mention?', DIAGNOSIS.count);
  await answer(page, 'How big is the largest one?', DIAGNOSIS.largestSize);
  await answer(page, 'Where are they, in your report’s words?', DIAGNOSIS.location);

  await arrive(page, page.getByRole('heading', { name: 'Does your report say whether the uterine cavity is affected?' }));
  await hold(page, BEAT);
  await page.getByRole('radio', { name: 'I don’t know' }).tap();
  await expect(page.getByText(`“${DIAGNOSIS.unknownQuestion}”`)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Add to my questions' })).toBeChecked();
  await hold(page, LINGER);
  await page.getByRole('button', { name: 'Save and continue' }).tap();

  await answer(page, 'Does your report give a FIGO type?', DIAGNOSIS.figo, 'Save');

  await arrive(page, page.getByRole('heading', { name: 'Here’s what you have so far' }));
  await expect(page.getByText('Uterine cavity', { exact: true })).toBeVisible();
  await hold(page, LINGER);
  await page.getByRole('link', { name: 'See my questions' }).tap();

  await arrive(page, page.getByRole('heading', { name: 'Your questions' }));
  await expect(page.getByText(DIAGNOSIS.unknownQuestion).first()).toBeVisible();
  await hold(page, READ);

  // 3. Explore a food question and open its evidence and sources.
  await page.getByRole('button', { name: 'My health' }).tap();
  await expect(page.getByRole('tab', { name: 'Learn' })).toBeVisible();
  await page.getByRole('tab', { name: 'Learn' }).tap();

  await arrive(page, page.getByRole('heading', { name: 'Learn', level: 1 }));
  await hold(page, BEAT);
  const topic = page.getByRole('link', { name: new RegExp(FOOD_QUESTION.title.replace('?', '\\?')) });
  await showOnScreen(page, topic);
  await hold(page, READ);
  await topic.tap();

  await arrive(page, page.getByRole('heading', { name: FOOD_QUESTION.title, level: 1 }));
  await expect(page.getByText('Short answer')).toBeVisible();
  await hold(page, LINGER);

  const outcome = page.getByRole('button', { name: FOOD_QUESTION.outcome });
  await showOnScreen(page, outcome);
  await outcome.tap();
  await expect(outcome).toHaveAttribute('aria-expanded', 'true');
  await hold(page, READ);

  const study = page.getByRole('button', { name: FOOD_QUESTION.study });
  await showOnScreen(page, study);
  await study.tap();
  await expect(page.getByText('Limits')).toBeVisible();
  await hold(page, LINGER);

  const sources = page.getByRole('button', { name: /^Sources \(/ });
  await showOnScreen(page, sources);
  await sources.tap();
  await expect(sources).toHaveAttribute('aria-expanded', 'true');
  await showOnScreen(page, page.locator('.sources ol li').first());
  await hold(page, LINGER);

  // 4. Generate a meal plan, swap a meal and open groceries.
  await page.getByRole('button', { name: 'Learn', exact: true }).tap();
  await arrive(page, page.getByRole('heading', { name: 'Learn', level: 1 }));
  await page.getByRole('tab', { name: 'Nourish' }).tap();

  await arrive(page, page.getByRole('heading', { name: 'Nourish', level: 1 }));
  await hold(page, READ);
  const nextFood = page.getByRole('button', { name: 'Next: food choices' });
  await showOnScreen(page, nextFood);
  await expect(nextFood).toBeEnabled();
  await hold(page, BEAT);
  await nextFood.tap();

  const nextCheck = page.getByRole('button', { name: 'Next: check my choices' });
  await expect(nextCheck).toBeVisible();
  await hold(page, READ);
  await showOnScreen(page, nextCheck);
  await nextCheck.tap();

  const preview = page.getByRole('button', { name: 'Preview my meals' });
  await arrive(page, page.getByRole('heading', { name: 'Ready to preview?' }));
  await showOnScreen(page, preview);
  await hold(page, READ);
  await preview.tap();

  await arrive(page, page.getByRole('heading', { name: 'Check your new plan' }));
  await arrive(page, page.getByRole('heading', { name: 'Preview meals' }));
  await hold(page, READ);

  const firstMeal = page.locator('.meal-card').first();
  const swappedName = (await firstMeal.locator('.meal-name').innerText()).trim();
  await showOnScreen(page, firstMeal);
  await hold(page, READ);
  await firstMeal.getByRole('button', { name: 'Swap' }).tap();

  await expect(page.getByText('Pick a replacement')).toBeVisible();
  const useMeal = page.getByRole('button', { name: 'Use this meal' }).first();
  await expect(useMeal).toBeVisible();
  await hold(page, READ);
  await useMeal.tap();

  await expect(page.getByRole('status').filter({ hasText: 'Replaced only this meal' })).toBeVisible();
  await expect(firstMeal.locator('.meal-name')).not.toHaveText(swappedName);
  await showOnScreen(page, firstMeal);
  await hold(page, READ);

  const usePlan = page.getByRole('button', { name: 'Use this plan' });
  await showOnScreen(page, usePlan);
  await hold(page, BEAT);
  await usePlan.tap();
  await expect(page.getByRole('status').filter({ hasText: 'Your plan is saved' })).toBeVisible();
  await hold(page, READ);

  const groceries = page.getByRole('button', { name: 'Groceries' });
  await showOnScreen(page, groceries);
  await expect(groceries).toBeEnabled();
  await groceries.tap();

  await arrive(page, page.getByRole('heading', { name: 'Shopping list' }));
  await expect(page.getByText('items collected')).toBeVisible();
  await hold(page, LINGER);

  // 5. Open her appointment summary.
  await page.getByRole('tab', { name: 'My health' }).tap();
  const review = page.getByRole('link', { name: 'Review what I’ll bring' });
  await arrive(page, review);
  await hold(page, BEAT);
  await review.tap();

  await arrive(page, page.getByRole('heading', { name: 'My appointment summary' }));
  await hold(page, READ);
  const questions = page.getByRole('heading', { name: 'Questions I still want to ask' });
  await showOnScreen(page, questions);
  await expect(page.locator('article.doc').getByText(DIAGNOSIS.unknownQuestion)).toBeVisible();
  await hold(page, LINGER);

  // Only a complete journey replaces the saved recording.
  const video = page.video();
  if (!video) throw new Error('Video recording is not enabled.');
  await page.context().close();
  mkdirSync(RECORDINGS, { recursive: true });
  const partial = `${OUTPUT}.part`;
  await video.saveAs(partial);
  await rename(partial, OUTPUT);
  console.log(`Recording saved: ${OUTPUT}`);
});

/** Answers one diagnosis step with "I have this information" and moves on. */
async function answer(page: Page, question: string, detail: { field: string; value: string }, save = 'Save and continue') {
  await arrive(page, page.getByRole('heading', { name: question }));
  await hold(page, BEAT);
  await page.getByRole('radio', { name: 'I have this information' }).tap();
  const field = page.getByRole('textbox', { name: detail.field });
  await expect(field).toBeEnabled();
  await field.pressSequentially(detail.value, { delay: 70 });
  await hold(page, BEAT);
  await page.getByRole('button', { name: save, exact: true }).tap();
}

/** Waits for a screen to finish loading and for its slide-in transition to stop moving. */
async function arrive(page: Page, landmark: Locator) {
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

/** A deliberate pause so viewers can follow what just happened. */
async function hold(page: Page, ms: number) {
  await page.waitForTimeout(ms);
}

/** Scrolls smoothly inside Ionic's scroll area so the element is in view, then lets it settle. */
async function showOnScreen(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  await locator.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await page.waitForTimeout(800);
}
