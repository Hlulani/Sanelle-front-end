import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { test, expect, screen, signIn, manualReport } from './support/redesign';
import { figmaReference, compareFigma, correctedProgress, FIGMA_OUTPUT } from './support/figma-reference';
import type { Page, TestInfo } from '@playwright/test';

async function next(page: Page, step: number) {
  await screen(page)
    .getByRole('button', {
      name: step === 1 ? 'Start setting up Sanelle' : step === 5 ? 'Finish setup' : 'Continue',
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(new RegExp('step=' + (step + 1)));
}
async function state(page: Page, ref: Page, id: string, step: number, info: TestInfo) {
  await correctedProgress(ref, step);
  await compareFigma(page, ref, id, info, [
    '.onboarding-header',
    '.onboarding-progress',
    '.onboarding-main',
    'h1',
    '.primary',
  ]);
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

test('Five onboarding steps reproduce the actual prototype and persist each selected field', async ({
  page,
  account,
}, info) => {
  await signIn(page, account);
  await page.goto('/onboarding');
  await screen(page).getByLabel('First name', { exact: true }).fill('');
  const ref = await figmaReference(page);
  try {
    await ref.getByRole('button', { name: 'I already have an account' }).click();
    await ref.getByPlaceholder('you@example.com').fill('reference@example.test');
    await ref.getByPlaceholder('Your password').fill('reference-password');
    await ref.getByRole('button', { name: 'Log in', exact: true }).click();
    await state(page, ref, 'ONB-01E', 1, info);
    await expect(screen(page).getByRole('button', { name: 'Start setting up Sanelle' })).toBeDisabled();
    await screen(page).getByLabel('First name', { exact: true }).fill('Thandi');
    await ref.getByLabel('What should we call you?').fill('Thandi');
    await state(page, ref, 'ONB-01', 1, info);
    await next(page, 1);
    await ref.getByRole('button', { name: 'Start setting up Sanelle' }).click();
    await state(page, ref, 'ONB-02E', 2, info);
    for (const label of ['Understand my diagnosis', 'Make food feel simpler']) {
      await screen(page).getByRole('button', { name: label, exact: true }).click();
      await ref.getByRole('button', { name: label, exact: true }).click();
    }
    await state(page, ref, 'ONB-02', 2, info);
    await next(page, 2);
    await ref.getByRole('button', { name: 'Continue', exact: true }).click();
    await state(page, ref, 'ONB-03E', 3, info);
    for (const [label, value] of [
      ['Number of fibroids', '2'],
      ['Largest recorded size', '4.1'],
    ]) {
      await screen(page).getByLabel(label).fill(value);
      await ref.getByLabel(label).fill(value);
    }
    await state(page, ref, 'ONB-03', 3, info);
    await next(page, 3);
    await ref.getByRole('button', { name: 'Continue', exact: true }).click();
    await state(page, ref, 'ONB-04E', 4, info);
    for (const label of [
      'Heavy bleeding',
      'Pain or cramping',
      'Quick meals',
      'Cooking for others',
      'Ingredient substitutions',
      'Understanding food claims',
    ]) {
      await screen(page).getByRole('button', { name: label, exact: true }).click();
      await ref.getByRole('button', { name: label, exact: true }).click();
    }
    await state(page, ref, 'ONB-04', 4, info);
    await next(page, 4);
    await ref.getByRole('button', { name: 'Continue', exact: true }).click();
    await state(page, ref, 'ONB-05E', 5, info);
    await screen(page).getByLabel('Appointment date').fill('2026-10-24');
    await ref.getByLabel('Appointment date').fill('2026-10-24');
    await state(page, ref, 'ONB-05', 5, info);
    await next(page, 5);
    await expect(page.locator('.onboarding-header > span')).toHaveText('Ready to start');
    await expect(screen(page).locator('.setup-summary')).toContainText('Diagnosis · Food');
    await expect(screen(page).locator('.setup-summary')).toContainText('2 fibroids · Largest recorded size: 4.1 cm');
    await expect(screen(page).locator('.setup-summary')).toContainText('24 October 2026');
    await mkdir(path.join(FIGMA_OUTPUT, 'screenshots', info.project.name), { recursive: true });
    await page.screenshot({
      path: path.join(FIGMA_OUTPUT, 'screenshots', info.project.name, 'ONB-06.png'),
      animations: 'disabled',
      scale: 'css',
    });
    await screen(page).getByRole('button', { name: 'Back', exact: true }).click();
    await expect(screen(page).getByLabel('Appointment date')).toHaveValue('2026-10-24');
    await screen(page).getByRole('button', { name: "I don't have a date" }).click();
    await expect(screen(page).locator('.setup-summary')).toContainText('No date added');
    await screen(page).getByRole('button', { name: 'Open Sanelle', exact: true }).click();
    await expect(page).toHaveURL(/tabs\/today/);
    await page.goto('/health/details');
    await expect(screen(page).getByText('4.1 cm', { exact: true })).toBeVisible();
    await page.goto('/onboarding?step=4');
    await page.reload();
    for (const label of ['Cooking for others', 'Understanding food claims', 'Ingredient substitutions'])
      await expect(screen(page).getByRole('button', { name: label, exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    await page.goto('/food/requirements');
    await expect(screen(page).getByRole('button', { name: 'Ingredient swaps' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  } finally {
    await ref.close();
  }
});

test('The source demo advances to priorities and blank optional fields remain unrecorded', async ({
  page,
  account,
}) => {
  await signIn(page, account);
  await page.goto('/onboarding');
  await screen(page).getByRole('button', { name: 'Preview with Thandi’s demo details' }).click();
  await expect(page).toHaveURL(/step=2/);
  for (const label of ['Understand my diagnosis', 'Make food feel simpler', 'Prepare for appointments'])
    await expect(screen(page).getByRole('button', { name: label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  await next(page, 2);
  await expect(screen(page).getByLabel('Number of fibroids')).toHaveValue('2');
  await expect(screen(page).getByLabel('Largest recorded size')).toHaveValue('4.1');
  await screen(page).getByLabel('Number of fibroids').fill('');
  await screen(page).getByLabel('Largest recorded size').fill('');
  await next(page, 3);
  await next(page, 4);
  await screen(page).getByRole('button', { name: "I don't have a date" }).click();
  await expect(screen(page).locator('.setup-summary')).toContainText('Number not recorded · Size not recorded');
  await expect(screen(page).locator('.setup-summary')).toContainText('No date added');
  await screen(page).getByRole('button', { name: 'Open Sanelle' }).click();
  await page.reload();
  await expect(page).toHaveURL(/tabs\/today/);
  await expect(screen(page).getByRole('heading', { name: 'Good morning, Thandi' })).toBeVisible();
  await page.goto('/health/details');
  await expect(screen(page).getByText('4.1 cm', { exact: true })).toHaveCount(0);
});

test('Diagnosis values are independent, units are explicit, and narrow screens do not overflow', async ({
  page,
  account,
}) => {
  await signIn(page, account);
  await page.goto('/onboarding');
  await next(page, 1);
  await next(page, 2);
  await screen(page).getByLabel('Number of fibroids').fill('2');
  await next(page, 3);
  await page.goto('/onboarding?step=3');
  await expect(screen(page).getByLabel('Number of fibroids')).toHaveValue('2');
  await expect(screen(page).getByLabel('Largest recorded size')).toHaveValue('');
  await screen(page).getByLabel('Number of fibroids').fill('');
  await screen(page).getByLabel('Largest recorded size').fill('4.1');
  await next(page, 3);
  await page.goto('/onboarding?step=3');
  await expect(screen(page).getByLabel('Number of fibroids')).toHaveValue('');
  await expect(screen(page).getByLabel('Largest recorded size')).toHaveValue('4.1');
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await screen(page).evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(false);
  }
  await next(page, 3);
  await next(page, 4);
  await next(page, 5);
  await expect(screen(page).locator('.setup-summary')).toContainText(
    'Number not recorded · Largest recorded size: 4.1 cm',
  );
  await screen(page).getByRole('button', { name: 'Open Sanelle' }).click();
  await page.goto('/health/details');
  await expect(screen(page).getByText('4.1 cm', { exact: true })).toBeVisible();
});

test('Skipping setup diagnosis never overwrites an existing checked report or its units', async ({ page, account }) => {
  await signIn(page, account);
  await manualReport(page);
  await page.goto('/onboarding?step=3');
  await expect(screen(page).getByLabel('Number of fibroids')).toHaveValue('2');
  // A multidimensional report measurement is preserved; the scalar cm field must not reinterpret it.
  await expect(screen(page).getByLabel('Largest recorded size')).toHaveValue('');
  await next(page, 3);
  await next(page, 4);
  await next(page, 5);
  await expect(screen(page).locator('.setup-summary')).toContainText('41 × 38 mm');
  await page.goto('/health/details');
  await expect(screen(page).getByText('41 × 38 mm', { exact: true })).toBeVisible();
  await screen(page)
    .locator('article.report-detail')
    .filter({ has: page.getByRole('link', { name: 'Edit Number of fibroids', exact: true }) })
    .locator('summary')
    .click();
  await expect(
    screen(page)
      .locator('article.report-detail')
      .filter({ has: page.getByRole('link', { name: 'Edit Number of fibroids', exact: true }) }),
  ).toContainText('Typed from the report by me');
});

test('All context choices persist without generating a symptom check-in', async ({ page, account }) => {
  await signIn(page, account);
  await page.goto('/onboarding');
  await next(page, 1);
  await next(page, 2);
  await next(page, 3);
  for (const label of [
    'No symptoms right now',
    'Budget-friendly ideas',
    'Cooking for others',
    'Understanding food claims',
  ])
    await screen(page).getByRole('button', { name: label, exact: true }).click();
  await next(page, 4);
  await page.goto('/onboarding?step=4');
  await page.reload();
  for (const label of [
    'No symptoms right now',
    'Budget-friendly ideas',
    'Cooking for others',
    'Understanding food claims',
  ])
    await expect(screen(page).getByRole('button', { name: label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  await next(page, 4);
  await next(page, 5);
  await screen(page).getByRole('button', { name: 'Open Sanelle' }).click();
  await page.goto('/health/symptoms');
  await expect(screen(page).getByText('No check-ins yet.', { exact: true })).toBeVisible();
});
