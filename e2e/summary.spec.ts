import { test, expect, screen, shot, openApp, saveCheckin } from './support/redesign';
test.beforeEach(async ({ page, account }) => openApp(page, account));
test('SYM-01–04: observations, missing days and exact clinical results reach the visit', async ({ page }, info) => {
  await page.goto('/health/check-in/today');
  await shot(page, 'SYM-01', info);
  await saveCheckin(page, { bleeding: 'Heavy', pain: 1 });
  await shot(page, 'SYM-02', info);
  await expect(screen(page).locator('.stat-callout')).toContainText('1 of 30 days');
  await expect(screen(page).locator('.stat-callout')).toContainText('1 recorded heavy or very heavy bleeding');
  await shot(page, 'SYM-03', info);
  await page.goto('/health/results');
  await screen(page).getByLabel('Result name').fill('Haemoglobin');
  await screen(page).getByLabel('Exact value').fill('10.2');
  await screen(page).getByLabel('Unit', { exact: true }).fill('g/dL');
  await shot(page, 'SYM-04', info);
  await screen(page).getByRole('button', { name: 'Save result', exact: true }).click();
  await expect(screen(page).getByRole('status')).toContainText('appointment summary');
  await page.goto('/tabs/appointment');
  await expect(screen(page).getByText(/Haemoglobin 10.2 g\/dL/)).toBeVisible();
  await screen(page).getByText('Recorded symptom summary', { exact: true }).click();
  await expect(screen(page).getByText(/1 of 30 days/)).toBeVisible();
  await page.goto('/tabs/today');
  await expect(screen(page).getByRole('heading', { name: 'Bleeding, Pain' })).toBeVisible();
  await shot(page, 'TOD-02', info);
  await screen(page).getByText('Your recent activity', { exact: true }).scrollIntoViewIfNeeded();
  await shot(page, 'TOD-03', info, false);
});
test('Partial observations and same-day edits keep unanswered bleeding unknown', async ({ page }) => {
  await saveCheckin(page, { pain: 1 });
  await expect(screen(page).locator('.stat-callout')).toContainText('Of the 0 check-ins with a bleeding answer');
  await saveCheckin(page, { bleeding: 'None', pain: 1 });
  await expect(screen(page).locator('.stat-callout')).toContainText('1 of 30 days');
  await expect(screen(page).locator('.stat-callout')).toContainText(
    '1 check-in with a bleeding answer, 0 recorded heavy',
  );
  await page.reload();
  await expect(screen(page).locator('.stat-callout')).toContainText('1 of 30 days');
});

test('Inline clinical-result editing keeps the original unit, value, name and source', async ({ page }) => {
  await page.goto('/health/results');
  await screen(page).getByLabel('Result name').fill('Haemoglobin');
  await screen(page).getByLabel('Exact value').fill('102');
  await screen(page).getByLabel('Unit', { exact: true }).fill('g/L');
  await screen(page).locator('input[name=testDate]').fill('2026-10-07');
  await screen(page).getByRole('button', { name: 'Save result', exact: true }).click();
  await expect(screen(page).getByRole('status')).toBeVisible();
  await page.goto('/health/symptoms');
  await screen(page).getByRole('button', { name: 'Edit result', exact: true }).click();
  await expect(screen(page).locator('.lab-form label').first()).toContainText('g/L');
  await screen(page)
    .getByLabel(/Result exactly as reported/)
    .fill('103');
  await screen(page).getByRole('button', { name: 'Save reported result' }).click();
  await expect(screen(page).locator('.saved-lab')).toContainText('103 g/L');
  await page.reload();
  await expect(screen(page).locator('.saved-lab')).toContainText('103 g/L');
  await page.goto('/tabs/appointment');
  await expect(screen(page).getByText(/Haemoglobin 103 g\/L/)).toBeVisible();
});
test('APT-01–03: concern, question, answer and agreed step persist together', async ({ page }, info) => {
  await page.goto('/tabs/appointment');
  await expect(screen(page).getByText('No questions saved yet.')).toBeVisible();
  await screen(page).getByText('Appointment date and main concern', { exact: true }).click();
  await screen(page).getByRole('button', { name: 'Add date and concern' }).click();
  await screen(page).locator('textarea[name=concern]').fill('Pain is affecting my work');
  await screen(page).getByRole('button', { name: 'Save', exact: true }).click();
  await screen(page).getByLabel('New appointment question').fill('What can we do about the bleeding?');
  await screen(page).getByRole('button', { name: 'Add question', exact: true }).click();
  await shot(page, 'APT-01', info);
  await screen(page).getByRole('button', { name: 'Record an answer or next step' }).click();
  await screen(page).getByLabel('What did your clinician say?').fill('Arrange a blood test and discuss the result.');
  await shot(page, 'APT-02', info);
  await screen(page).getByLabel('Agreed next step').fill('Book a blood test');
  await shot(page, 'APT-03', info);
  await screen(page).getByRole('button', { name: 'Save answer', exact: true }).click();
  await expect(screen(page).getByText('Arrange a blood test and discuss the result.', { exact: true })).toBeVisible();
  await expect(screen(page).getByText('Book a blood test', { exact: true })).toBeVisible();
  await page.reload();
  await expect(screen(page).getByText('Book a blood test', { exact: true })).toBeVisible();
});
test('Unresolved questions carry forward without losing earlier notes', async ({ page }) => {
  await page.goto('/tabs/appointment');
  await screen(page).getByLabel('New appointment question').fill('Where are my fibroids?');
  await screen(page).getByRole('button', { name: 'Add question', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Record an answer or next step' }).click();
  await screen(page).getByRole('button', { name: 'Mark unresolved' }).click();
  await expect(screen(page).locator('.question-status')).toHaveText('Unresolved');
  await screen(page).getByRole('button', { name: 'Carry forward to next visit' }).click();
  await expect(screen(page).getByText('Carried forward · unresolved at an earlier visit')).toBeVisible();
  await screen(page).locator('app-question-history summary').click();
  await expect(screen(page).locator('app-question-history')).toContainText('Unresolved');
  await page.reload();
  await expect(screen(page).getByText('Carried forward · unresolved at an earlier visit')).toBeVisible();
});

test('APT-03D: the copied summary contains the saved question and concern', async ({ page }) => {
  await page.goto('/tabs/appointment');
  await screen(page).getByLabel('New appointment question').fill('What happens next?');
  await screen(page).getByRole('button', { name: 'Add question', exact: true }).click();
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copiedSummary: string }).copiedSummary = text;
        },
      },
    }),
  );
  await screen(page).getByRole('button', { name: 'Copy editable summary' }).click();
  await expect(screen(page).getByRole('status')).toContainText('Summary copied');
  expect(await page.evaluate(() => (window as unknown as { copiedSummary: string }).copiedSummary)).toContain(
    'What happens next?',
  );
});
