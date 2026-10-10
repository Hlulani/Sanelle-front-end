import { test as base, expect, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { registerAccount, deleteAccount, TestAccount } from './accounts';
export { expect } from '@playwright/test';
export const screen = (page: Page) => page.locator('.sheet:visible, main:visible').last();
export async function shot(page: Page, id: string, info: TestInfo, scrollToTop = true) {
  if (info.project.name !== 'chromium') return;
  const dir = path.resolve('docs/validation/redesign-2026-10-08/screenshots');
  await mkdir(dir, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    [...document.querySelectorAll('ion-router-outlet')].every(
      (outlet) =>
        [...outlet.children].filter(
          (child) => child.classList.contains('ion-page') && !child.classList.contains('ion-page-hidden'),
        ).length <= 1,
    ),
  );
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
  );
  if (scrollToTop)
    await page.evaluate(async () => {
      const active = [...document.querySelectorAll('ion-content')].filter(
        (content) => !(content as HTMLElement).closest('.ion-page-hidden') && (content as HTMLElement).offsetHeight > 0,
      );
      await Promise.all(
        active.map((content) =>
          (content as unknown as { scrollToTop: (duration: number) => Promise<void> }).scrollToTop(0),
        ),
      );
    });
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images]
        .filter((img) => {
          const rect = img.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
        })
        .map((img) => img.decode().catch(() => undefined)),
    );
  });
  await page.screenshot({ path: path.join(dir, `${id}.png`), fullPage: true, animations: 'disabled' });
}
export async function signIn(page: Page, account: TestAccount) {
  await page.goto('/login');
  await screen(page).getByLabel('Email', { exact: true }).fill(account.email);
  await screen(page).getByLabel('Password', { exact: true }).fill(account.password);
  await screen(page).getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/tabs\/today|\/onboarding/);
}
export async function finishSetup(page: Page) {
  await expect(page).toHaveURL(/\/onboarding/);
  await screen(page).locator('input[name=name]').fill('Journey Tester');
  for (const [i, name] of [
    'Start setting up Sanelle',
    'Continue',
    'Continue',
    'Continue',
    'Finish setup',
    'Open Sanelle',
  ].entries()) {
    await screen(page).getByRole('button', { name, exact: true }).click();
    if (i < 4) await expect(page.locator('.onboarding-header > span')).toContainText(`Step ${i + 2} of 5`);
  }
  await expect(page).toHaveURL(/\/tabs\/today/);
}
export async function settleToday(page: Page) {
  await expect(screen(page).getByRole('button', { name: 'I’d rather look around' })).toBeVisible();
  await screen(page).getByRole('button', { name: 'I’d rather look around' }).click();
  await expect(screen(page).getByRole('button', { name: 'I’d rather look around' })).toHaveCount(0);
}
export const test = base.extend<{ account: TestAccount; runtimeErrors: void }>({
  runtimeErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error' && /\bNG\d{4,5}\b/.test(message.text())) errors.push(message.text());
      });
      await use();
      expect(errors, 'Uncaught browser errors or Angular runtime errors').toEqual([]);
    },
    { auto: true },
  ],
  account: async ({ request }, use) => {
    const account = await registerAccount(request);
    try {
      await use(account);
    } finally {
      await deleteAccount(request, account);
    }
  },
});
export async function openApp(page: Page, account: TestAccount) {
  await signIn(page, account);
  if (page.url().includes('/onboarding')) await finishSetup(page);
  await settleToday(page);
}
export async function manualReport(page: Page, checked = true) {
  await page.goto('/health/report/new');
  await screen(page).getByRole('button', { name: 'Enter details manually' }).click();
  await expect(screen(page).getByRole('heading', { name: 'Compare what was captured with your report' })).toBeVisible();
  await screen(page).getByText('Report name and date', { exact: true }).click();
  await screen(page).locator('input[name=title]').fill('October scan');
  await screen(page).locator('input[name=v-count]').fill('2');
  await screen(page).locator('input[name=v-largestSize]').fill('41 × 38');
  await screen(page).locator('select[name=u-largestSize]').selectOption('mm');
  if (checked) {
    await screen(page).locator('input[name=confirmed]').check();
    await screen(page).getByRole('button', { name: 'Save checked details' }).click();
  } else {
    await screen(page).getByRole('button', { name: 'Save and finish later' }).click();
  }
  await expect(page).toHaveURL(/\/health\/report\/.*\/saved/);
}
export async function saveCheckin(
  page: Page,
  { bleeding, pain, date = 'today' }: { bleeding?: string; pain?: number; date?: string } = {},
) {
  await page.goto(`/health/check-in/${date}`);
  await expect(screen(page).getByRole('button', { name: 'Save today’s check-in' })).toBeVisible();
  if (bleeding) {
    const choice = screen(page).getByRole('button', { name: 'Bleeding', exact: true });
    if (!(await choice.getAttribute('class'))?.includes('selected')) await choice.click();
    await screen(page).getByRole('button', { name: bleeding, exact: true }).click();
  }
  if (pain !== undefined) {
    const answer = screen(page).getByRole('button', { name: 'Pain', exact: true });
    if (!(await answer.getAttribute('class'))?.includes('selected')) await answer.click();
  }
  await screen(page).getByRole('button', { name: 'Save today’s check-in' }).click();
  await expect(page).toHaveURL(/\/health\/symptoms(?:\?|$)/);
}
export function reportPdf() {
  const body =
    'BT /F1 16 Tf 50 740 Td (Ultrasound report: two fibroids.) Tj 0 -30 Td (Largest fibroid measures 41 x 38 mm.) Tj 0 -30 Td (Page 1 of 2.) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((o) => String(o).padStart(10, '0') + ' 00000 n ')
    .join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
