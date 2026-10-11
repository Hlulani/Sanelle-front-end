import type { Page } from '@playwright/test';
import { test, expect, screen, openApp } from './support/redesign';
import { localIsoDate } from '../src/app/shared/calendar-date';

/** The AI endpoints are mocked here: the real server only offers them when it has an API key. */
async function mockAi(page: Page, answer: object) {
  const sent: unknown[] = [];
  await page.route('**/api/v1/ai/status', (r) => r.fulfill({ json: { available: true } }));
  await page.route('**/api/v1/ai/insights', (r) => {
    sent.push(r.request().postDataJSON());
    return r.fulfill({ json: answer });
  });
  return sent;
}

async function heavyDay(page: Page, note: string) {
  await page.goto(`/health/check-in/${localIsoDate()}`);
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

test('With her consent, AI drafts her concern and questions; anything unsupported is dropped', async ({
  page,
  account,
}) => {
  const sent = await mockAi(page, {
    brief: 'My main concern: heavy bleeding with pain that changed my plans on 1 of 1 check-ins.',
    questions: [
      { text: 'What could help when heavy bleeding changes my plans?', why: 'Heavy bleeding on 1 of 1 check-ins.' },
      { text: 'Why have I bled for 12 days?', why: 'Made up.' },
    ],
    matches: [
      { claimId: 'C36', quote: 'Flooding at night' },
      { claimId: 'C36', quote: 'words she never wrote' },
    ],
  });
  await openApp(page, account);
  await heavyDay(page, 'Flooding at night, had to change pads twice');

  await page.goto('/tabs/health?view=symptoms');
  const worth = screen(page).getByRole('region', { name: 'Worth bringing up' });
  await worth.getByRole('button', { name: 'Suggest with AI' }).click();
  // Nothing is sent until she agrees, and she's told what goes.
  await expect(worth.getByRole('group', { name: 'Draft with Sanelle AI?' })).toContainText(
    'Not your name, email, reports',
  );
  expect(sent).toHaveLength(0);
  await worth.getByRole('button', { name: 'Send and draft' }).click();
  await expect(worth.getByRole('status').filter({ hasText: 'Drafted by Sanelle AI' })).toBeVisible();
  await expect(worth.locator('.suggestion-card textarea')).toHaveValue(
    'What could help when heavy bleeding changes my plans?',
  );
  await expect(worth).not.toContainText('12 days');
  await expect(worth).toContainText('You wrote: “Flooding at night”');
  await expect(worth).not.toContainText('words she never wrote');
  // Only check-ins went out: no account details.
  expect(JSON.stringify(sent[0])).not.toContain(account.email);
  expect((sent[0] as { checkins: unknown[] }).checkins).toHaveLength(1);

  // After the app reloads she's asked again; then the visit draft fills in, and she edits before saving.
  await page.goto('/tabs/appointment');
  await screen(page).getByText('Appointment date and main concern', { exact: true }).click();
  await screen(page).getByRole('button', { name: 'Draft with AI' }).click();
  await screen(page).getByRole('button', { name: 'Send and draft' }).click();
  const concern = screen(page).locator('textarea[name="concern"]');
  await expect(concern).toHaveValue(
    'My main concern: heavy bleeding with pain that changed my plans on 1 of 1 check-ins.',
  );
  await expect(screen(page).getByRole('status').filter({ hasText: 'Drafted by Sanelle AI' })).toBeVisible();
  await screen(page).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    screen(page).getByText('My main concern: heavy bleeding with pain that changed my plans on 1 of 1 check-ins.'),
  ).toBeVisible();
});

test('An AI answer with unsupported numbers leaves her own text alone', async ({ page, account }) => {
  await mockAi(page, { brief: 'Heavy bleeding on 9 of 10 days.', questions: [], matches: [] });
  await openApp(page, account);
  await heavyDay(page, 'Tired today');
  await page.goto('/tabs/appointment');
  await screen(page).getByText('Appointment date and main concern', { exact: true }).click();
  await screen(page).getByRole('button', { name: 'Draft with AI' }).click();
  await screen(page).getByRole('button', { name: 'Send and draft' }).click();
  await expect(
    screen(page).getByRole('status').filter({ hasText: 'Nothing from AI met Sanelle’s checks' }),
  ).toBeVisible();
  await expect(screen(page).locator('textarea[name="concern"]')).toHaveCount(0);
});

test('Without an API key on the server, no AI option is offered', async ({ page, account }) => {
  await openApp(page, account);
  await heavyDay(page, 'Flooding at night');
  await page.goto('/tabs/health?view=symptoms');
  await expect(screen(page).getByRole('region', { name: 'Worth bringing up' })).toBeVisible();
  await expect(screen(page).getByRole('button', { name: 'Suggest with AI' })).toHaveCount(0);
  await page.goto('/tabs/appointment');
  await screen(page).getByText('Appointment date and main concern', { exact: true }).click();
  await expect(screen(page).getByRole('button', { name: 'Draft with AI' })).toHaveCount(0);
});
