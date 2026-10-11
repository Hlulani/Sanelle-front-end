import { test, expect, screen, signIn, manualReport, finishSetup } from './support/redesign';
import { figmaReference, compareFigma } from './support/figma-reference';
import { localIsoDate } from '../src/app/shared/calendar-date';
import type { Page } from '@playwright/test';

async function next(page: Page, step: number) {
  await screen(page)
    .getByRole('button', {
      name: step === 1 ? 'Start setting up Sanelle' : step === 5 ? 'Review setup' : 'Continue',
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(new RegExp('step=' + (step + 1)));
}
test('Welcome is the actual supplied Figma prototype, with working account navigation', async ({ page }, info) => {
  await page.setViewportSize({ width: 400, height: 874 });
  await page.goto('/welcome');
  const ref = await figmaReference(page);
  try {
    await compareFigma(page, ref, 'AUTH-01', info, [
      '.auth-header',
      '.auth-card',
      'h1',
      '.auth-primary',
      '.auth-secondary',
      '.auth-trust',
    ]);
    await screen(page).getByRole('link', { name: 'Create my account' }).click();
    await ref.getByRole('button', { name: 'Create my account' }).click();
    await compareFigma(page, ref, 'AUTH-02-empty', info, [
      '.auth-header',
      '.auth-card',
      'h1',
      '.auth-fields',
      '.auth-primary',
    ]);
    await page.goto('/login');
    await ref.getByRole('button', { name: 'Log in', exact: true }).click();
    // The production app authenticates real accounts; the prototype's fake-login note does not apply.
    await ref.locator('.prototype-note').evaluate((e) => e.remove());
    await compareFigma(page, ref, 'AUTH-04-empty', info, [
      '.auth-header',
      '.auth-card',
      'h1',
      '.auth-fields',
      '.auth-primary',
    ]);
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await ref.locator('.auth-fields label > span button').click();
    await compareFigma(page, ref, 'AUTH-05-empty', info, [
      '.auth-header',
      '.auth-card',
      'h1',
      '.auth-fields',
      '.auth-primary',
    ]);
  } finally {
    await ref.close();
  }
});

test('Review edits return directly to the summary and appointment starts with one useful action', async ({
  page,
  account,
}, info) => {
  await signIn(page, account);
  await page.goto('/onboarding');
  await screen(page).getByLabel('First name', { exact: true }).fill('Thandi');
  await next(page, 1);
  await screen(page).getByRole('button', { name: 'Prepare for appointments', exact: true }).click();
  await next(page, 2);
  await screen(page).getByLabel('Number of fibroids').fill('2');
  await screen(page).getByLabel('Largest recorded size').fill('41');
  await screen(page).getByLabel('Size unit').selectOption('mm');
  await next(page, 3);
  await screen(page).getByRole('button', { name: 'Pain or cramping', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Quick meals', exact: true }).click();
  await expect(screen(page).getByRole('button', { name: 'Cooking for others', exact: true })).toHaveCount(0);
  await next(page, 4);
  await screen(page).getByLabel('Appointment date').fill(localIsoDate());
  await next(page, 5);
  await expect(screen(page).locator('.setup-summary')).toContainText('41 mm');
  await expect(screen(page).locator('.setup-summary')).toContainText('Pain or cramping');
  await expect(screen(page).locator('.setup-summary')).toContainText('Quick meals');
  await page.screenshot({ path: info.outputPath('setup-review.png'), fullPage: true });
  await screen(page).getByRole('button', { name: 'Edit name', exact: true }).click();
  await screen(page).getByLabel('First name', { exact: true }).fill('T');
  await screen(page).getByRole('button', { name: 'Return to review', exact: true }).click();
  await expect(page).toHaveURL(/step=6/);
  await expect(screen(page).locator('.setup-summary')).toContainText('T');
  await screen(page).getByRole('button', { name: 'Edit priorities', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Track symptoms', exact: true }).click();
  await screen(page).getByRole('button', { name: 'Back', exact: true }).click();
  await expect(screen(page).locator('.setup-summary')).not.toContainText('Symptoms');
  await screen(page).getByRole('button', { name: 'Open Sanelle', exact: true }).click();
  await expect(page).toHaveURL(/tabs\/today/);
  await expect(
    screen(page).getByRole('heading', { name: 'Add your first appointment question', exact: true }),
  ).toBeVisible();
  await expect(screen(page).getByText('What brought you to Sanelle today?', { exact: true })).toHaveCount(0);
  await expect(screen(page).getByRole('button', { name: 'Start a check-in', exact: true })).toHaveCount(0);
  await expect(screen(page).getByRole('button', { name: 'Review my health', exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('first-action.png'), fullPage: true });
  await screen(page).getByRole('button', { name: 'Add a question', exact: true }).click();
  await expect(page).toHaveURL(/tabs\/appointment/);
  await expect(screen(page).getByRole('textbox', { name: 'New appointment question' })).toBeFocused();
  await screen(page).getByText('Appointment date and main concern', { exact: true }).click();
  await expect(screen(page).getByText('No appointment date saved.', { exact: true })).toHaveCount(0);
  await page.goto('/food/requirements');
  await expect(screen(page).getByRole('button', { name: 'Quick meals', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goto('/health/check-in/today?from=health');
  const choices = screen(page).locator('.choice-grid button');
  await expect(choices.first()).toHaveText('Pain');
  await expect(choices.filter({ hasText: 'Pain' })).not.toHaveClass(/selected/);
  await page.goto('/health/symptoms');
  await expect(screen(page).getByText('No check-ins yet.', { exact: true })).toBeVisible();
});

test('Ambiguous numbers stay unchanged and comma decimals preserve the chosen unit', async ({ page, account }) => {
  await signIn(page, account);
  await page.goto('/onboarding?step=3');
  for (const value of ['2–3', '2.5', '-2']) {
    await screen(page).getByLabel('Number of fibroids').fill(value);
    await screen(page).getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(screen(page).getByRole('alert')).toContainText('one whole number');
    await expect(screen(page).getByLabel('Number of fibroids')).toHaveValue(value);
  }
  await screen(page).getByLabel('Number of fibroids').fill('2');
  for (const value of ['4..1', '-4', '0']) {
    await screen(page).getByLabel('Largest recorded size').fill(value);
    await screen(page).getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(screen(page).getByRole('alert')).toContainText('positive size');
    await expect(screen(page).getByLabel('Largest recorded size')).toHaveValue(value);
  }
  await screen(page).getByLabel('Largest recorded size').fill('4,1');
  await screen(page).getByLabel('Size unit').selectOption('cm');
  await next(page, 3);
  await page.goto('/onboarding?step=3');
  await expect(screen(page).getByLabel('Largest recorded size')).toHaveValue('4.1');
  await expect(screen(page).getByLabel('Size unit')).toHaveValue('cm');
  await screen(page).getByLabel('Size unit').selectOption('mm');
  await next(page, 3);
  await next(page, 4);
  await next(page, 5);
  await expect(screen(page).locator('.setup-summary')).toContainText('4.1 mm');
  await screen(page).getByRole('button', { name: 'Open Sanelle', exact: true }).click();
  await page.goto('/health/details');
  await expect(screen(page).getByText('4.1 mm', { exact: true })).toBeVisible();
});

test('Temporary demo never changes personal setup or a checked report', async ({ page, account }) => {
  await signIn(page, account);
  if (page.url().includes('/onboarding')) await finishSetup(page);
  await manualReport(page);
  await page.goto('/onboarding');
  await screen(page).getByRole('button', { name: 'Preview with Thandi’s demo details', exact: true }).click();
  await expect(screen(page).getByRole('status')).toContainText('will not change your records');
  await next(page, 2);
  await expect(screen(page).getByLabel('Largest recorded size')).toHaveValue('4.1');
  await next(page, 3);
  await next(page, 4);
  await next(page, 5);
  await screen(page).getByRole('button', { name: 'End preview', exact: true }).click();
  await expect(screen(page).getByLabel('First name', { exact: true })).toHaveValue('Journey Tester');
  await page.goto('/onboarding?step=2');
  for (const button of await screen(page).locator('.onboarding-choices button').all())
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  await page.goto('/health/details');
  await expect(screen(page).getByText('41 × 38 mm', { exact: true })).toBeVisible();
  await expect(screen(page).getByText('4.1 cm', { exact: true })).toHaveCount(0);
});

test('Every question can be skipped, and setup remains complete after reload', async ({ page, account }) => {
  await signIn(page, account);
  await page.goto('/onboarding');
  await screen(page).getByRole('button', { name: 'Skip name for now', exact: true }).click();
  await next(page, 2);
  await next(page, 3);
  await next(page, 4);
  await next(page, 5);
  await expect(screen(page).locator('.setup-summary')).toContainText('Not added');
  await expect(screen(page).locator('.setup-summary')).toContainText('Number not recorded · Size not recorded');
  await screen(page).getByRole('button', { name: 'Open Sanelle', exact: true }).click();
  await page.reload();
  await expect(page).toHaveURL(/tabs\/today/);
});

test('Blank edits preserve checked report values and review shows what is actually saved', async ({
  page,
  account,
}) => {
  await signIn(page, account);
  if (page.url().includes('/onboarding')) await finishSetup(page);
  await manualReport(page);
  await page.goto('/onboarding?step=3');
  await expect(screen(page).getByLabel('Number of fibroids')).toHaveValue('2');
  await expect(screen(page).getByLabel('Largest recorded size')).toHaveValue('');
  await screen(page).getByLabel('Number of fibroids').fill('');
  await next(page, 3);
  await next(page, 4);
  await next(page, 5);
  await expect(screen(page).locator('.setup-summary')).toContainText('2 fibroids');
  await expect(screen(page).locator('.setup-summary')).toContainText('41 × 38 mm');
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await screen(page).evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(false);
  }
});

test('Preferred name can be changed later without repeating setup', async ({ page, account }) => {
  await signIn(page, account);
  if (page.url().includes('/onboarding')) await finishSetup(page);
  await page.goto('/account');
  await screen(page).getByLabel('Preferred name (optional)').fill('Nandi');
  await screen(page).getByRole('button', { name: 'Save name', exact: true }).click();
  await expect(screen(page).getByRole('status')).toHaveText('Name saved');
  await page.reload();
  await expect(screen(page).getByLabel('Preferred name (optional)')).toHaveValue('Nandi');
  await page.goto('/tabs/today');
  await expect(screen(page).getByRole('heading', { name: 'Good morning, Nandi', exact: true })).toBeVisible();
});

for (const journey of [
  { priority: 'Understand my diagnosis', action: 'Add my report', route: /health\/report\/new/ },
  { priority: 'Make food feel simpler', action: 'Plan my meals', route: /food\/requirements/ },
  { priority: 'Track symptoms', action: 'Start a check-in', route: /health\/check-in/ },
]) {
  test(`${journey.priority} leads straight to its action without repeating priorities`, async ({ page, account }) => {
    await signIn(page, account);
    await page.goto('/onboarding?step=2');
    await screen(page).getByRole('button', { name: journey.priority, exact: true }).click();
    for (const step of [2, 3, 4, 5]) await next(page, step);
    await screen(page).getByRole('button', { name: 'Open Sanelle', exact: true }).click();
    await expect(screen(page).locator('.intent-panel button')).toHaveCount(2);
    await expect(screen(page).getByRole('button', { name: journey.action, exact: true })).toHaveCount(1);
    await screen(page).getByRole('button', { name: journey.action, exact: true }).click();
    await expect(page).toHaveURL(journey.route);
  });
}

test('Several priorities: the first leads, and the others stay one tap away', async ({ page, account }, info) => {
  await signIn(page, account);
  await page.goto('/onboarding?step=2');
  for (const name of ['Understand my diagnosis', 'Track symptoms'])
    await screen(page).getByRole('button', { name, exact: true }).click();
  for (const step of [2, 3, 4, 5]) await next(page, step);
  await screen(page).getByRole('button', { name: 'Open Sanelle', exact: true }).click();
  await expect(screen(page).getByRole('heading', { name: 'Understand my scan', exact: true })).toBeVisible();
  const also = screen(page).getByRole('region', { name: 'Also on your list' });
  await expect(also.getByRole('button')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('also-on-your-list.png') });
  await also.getByRole('button', { name: /Log how I feel/ }).click();
  await expect(page).toHaveURL(/health\/check-in/);
});
