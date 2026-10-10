import { test, expect, screen, openApp } from './support/redesign';
import { addDays, localIsoDate } from '../src/app/shared/calendar-date';

test.beforeEach(async ({ page, account }) => openApp(page, account));

/** A check-in through the real sheet: heavy bleeding with pain that changed her plans, and a note. */
async function heavyDay(page: import('@playwright/test').Page, date: string, note: string) {
  await page.goto(`/health/check-in/${date}`);
  const sheet = page.locator('.sheet');
  for (const name of ['Bleeding', 'Pain']) {
    const b = sheet.getByRole('button', { name, exact: true });
    if (!(await b.getAttribute('class'))?.includes('selected')) await b.click();
  }
  await sheet.getByRole('button', { name: 'Heavy', exact: true }).click();
  await sheet.getByRole('button', { name: 'Changed my plans', exact: true }).click();
  await sheet.getByLabel('Anything else, in your own words? (optional)').fill(note);
  await sheet.getByRole('button', { name: 'Save today’s check-in' }).click();
  await expect(page).toHaveURL(/\/health\/symptoms(?:\?|$)/);
}

test('Patterns in her check-ins become editable questions, matched explanations and a visit draft', async ({
  page,
}) => {
  await heavyDay(page, addDays(localIsoDate(), -1), 'Felt dizzy on the stairs');
  await heavyDay(page, localIsoDate(), 'Flooding at night, had to change pads twice');

  await page.goto('/tabs/health?view=symptoms');
  const worth = screen(page).getByRole('region', { name: 'Worth bringing up' });
  await expect(worth).toBeVisible();
  await expect(worth).toContainText('Edit any wording; nothing is saved unless you add it.');
  // Each suggestion names its counts, with their denominators.
  await expect(worth).toContainText(
    'You recorded heavy or very heavy bleeding on 2 of the 2 check-ins with a bleeding answer.',
  );
  await expect(worth).toContainText(
    'You recorded pain on 2 of your 2 check-ins, and on 2 of those days it changed your plans or stopped usual activities.',
  );
  // Her own words are quoted beside the published explanation they match.
  await expect(worth).toContainText('You wrote: “Flooding at night, had to change pads twice”');
  await expect(worth.getByText('Bleeding categories aren’t millilitres', { exact: true })).toBeVisible();
  await expect(worth).toContainText('You wrote: “Felt dizzy on the stairs”');

  // Nothing is added until she chooses, and she can change the wording first.
  const first = worth.locator('.suggestion-card textarea').first();
  await first.fill('What could help with heavy bleeding that changes my plans?');
  await worth.getByRole('button', { name: 'Add to my questions' }).first().click();
  await expect(worth.getByRole('status')).toContainText('What could help with heavy bleeding that changes my plans?');
  await page.goto('/tabs/appointment');
  await expect(screen(page).getByText('What could help with heavy bleeding that changes my plans?')).toBeVisible();
  await expect(
    screen(page)
      .getByText(/Suggested from my check-ins\./)
      .first(),
  ).toBeVisible();

  // A visit draft from her records, which she edits before saving.
  await screen(page).getByText('Appointment date and main concern', { exact: true }).click();
  await screen(page).getByRole('button', { name: 'Draft my concern from my records' }).click();
  const concern = screen(page).locator('textarea[name="concern"]');
  await expect(concern).toHaveValue(/^My main concern: heavy bleeding, and how it disrupts my days\./);
  await expect(concern).toHaveValue(/Heavy or very heavy bleeding on 2 of 2 check-ins with a bleeding answer\./);
  await expect(concern).toHaveValue(/In my words \(.+\): “Flooding at night, had to change pads twice”/);
  await expect(screen(page).getByRole('status').filter({ hasText: 'Drafted from your own check-ins' })).toBeVisible();
  await concern.fill('My main concern: heavy bleeding that changes my plans.');
  await screen(page).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(screen(page).getByText('My main concern: heavy bleeding that changes my plans.')).toBeVisible();
});

test('Without check-ins there are no suggestions and no draft', async ({ page }) => {
  await page.goto('/tabs/health?view=symptoms');
  await expect(screen(page).getByRole('heading', { name: 'Notice what changes for you' })).toBeVisible();
  await expect(screen(page).getByRole('region', { name: 'Worth bringing up' })).toHaveCount(0);
  await page.goto('/tabs/appointment');
  await screen(page).getByText('Appointment date and main concern', { exact: true }).click();
  await expect(screen(page).getByRole('button', { name: 'Draft my concern from my records' })).toHaveCount(0);
});

test('Learn lists every published explanation by topic and returns to itself', async ({ page }) => {
  await page.goto('/tabs/health?view=symptoms');
  await screen(page).getByRole('link', { name: 'What the research says', exact: true }).click();
  await expect(page).toHaveURL(/\/learn$/);
  for (const topic of ['Diagnosis and reports', 'Symptoms and anaemia', 'Food and risk factors'])
    await expect(screen(page).getByRole('heading', { name: topic, exact: true })).toBeVisible();
  // Unpublished topics never appear.
  await expect(screen(page).getByRole('heading', { name: 'Treatment', exact: true })).toHaveCount(0);
  await screen(page)
    .getByRole('button', { name: /Missing days stay unknown/ })
    .click();
  await expect(page).toHaveURL(/\/learn\/C37\?from=learn/);
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Missing days stay unknown' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Done reading' }).click();
  await expect(page).toHaveURL(/\/learn$/);
});
