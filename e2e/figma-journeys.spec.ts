import { test, expect, signIn, screen } from './support/redesign';
import { compareFigma, figmaReference } from './support/figma-reference';

test('Today first-use and returning empty match the actual Figma components', async ({ page, account }, info) => {
  await signIn(page, account);
  const ref = await figmaReference(page, true);
  try {
    // Unknown count and size are not silently presented as recorded information.
    await ref.locator('.diagnosis-copy strong').evaluate((e) => (e.textContent = '5 details are not recorded yet'));
    await compareFigma(page, ref, 'TOD-01-source', info, [
      '.topbar',
      '.page-heading',
      '.intent-panel',
      '.diagnosis-strip',
      '.mobile-nav',
    ]);
    await screen(page).getByRole('button', { name: 'I’d rather look around' }).click();
    await ref.getByRole('button', { name: 'I’d rather look around' }).click();
    await ref.locator('.diagnosis-copy strong').evaluate((e) => (e.textContent = '5 details are not recorded yet'));
    await compareFigma(page, ref, 'TOD-02E-source', info, [
      '.topbar',
      '.page-heading',
      '.today-next',
      '.activity-line',
      '.diagnosis-strip',
      '.mobile-nav',
    ]);
  } finally {
    await ref.close();
  }
});

test('Diagnosis and appointment empty states use the actual Figma screens', async ({ page, account }, info) => {
  await signIn(page, account);
  const ref = await figmaReference(page, true);
  try {
    await page.goto('/tabs/health');
    await ref.locator('.mobile-nav').getByRole('button', { name: 'My health' }).click();
    await ref.locator('.report-document em').evaluate((e) => (e.textContent = '5 fields not recorded'));
    await compareFigma(page, ref, 'HLT-01E-source', info, [
      '.topbar',
      '.page-heading',
      '.health-tabs',
      '.health-summary',
      '.report-library',
      '.mobile-nav',
    ]);
    await page.goto('/tabs/appointment');
    await ref.locator('.mobile-nav').getByRole('button', { name: 'Appointment' }).click();
    await ref
      .locator('.missing-inline span')
      .evaluate(
        (e) =>
          (e.textContent =
            'Number of fibroids, Largest fibroid size, Location, Uterine cavity, FIGO type are not recorded.'),
      );
    await ref
      .locator('.paper-section')
      .first()
      .evaluate((e) => {
        const details = document.createElement('details');
        details.className = 'paper-section';
        details.innerHTML = '<summary>Appointment date and main concern</summary>';
        e.before(details);
      });
    await compareFigma(page, ref, 'APT-01E-source', info, [
      '.topbar',
      '.page-heading',
      '.visit-intro',
      '.visit-paper',
      '.mobile-nav',
    ]);
  } finally {
    await ref.close();
  }
});

test('Report source picker matches the supplied report capture screen', async ({ page, account }, info) => {
  await signIn(page, account);
  const ref = await figmaReference(page, true);
  try {
    await page.goto('/health/report/new');
    await ref.locator('.mobile-nav').getByRole('button', { name: 'My health' }).click();
    await ref.getByRole('button', { name: 'Add a scan report' }).click();
    // Production privacy wording describes the actual on-device reader and storage.
    await ref
      .locator('.scan-privacy p')
      .evaluate(
        (e) =>
          (e.textContent =
            'Your report may contain identifying information. Reading happens on this device. Files aren’t uploaded or saved; only the details you check are kept.'),
      );
    await compareFigma(page, ref, 'RPT-01-source', info, [
      '.scan-header',
      '.scan-progress',
      '.scan-step',
      '.source-options',
    ]);
  } finally {
    await ref.close();
  }
});

test('Check saved details opens the original report-review sheet', async ({ page, account }, info) => {
  await signIn(page, account);
  const ref = await figmaReference(page, true);
  try {
    await page.goto('/tabs/health');
    await ref.locator('.mobile-nav').getByRole('button', { name: 'My health' }).click();
    await ref.locator('.report-document em').evaluate((el) => (el.textContent = '5 fields not recorded'));
    for (const p of [page, ref]) await p.getByRole('button', { name: 'Check saved details' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save checked details' })).toBeDisabled();
    await compareFigma(page, ref, 'RPT-review-sheet-source', info, [
      '.report-review-sheet',
      '.extraction-review',
      '.confirm-check',
    ]);
    await page.getByRole('button', { name: 'Go back without saving' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(screen(page).getByText('No report files saved yet.')).toBeVisible();
  } finally {
    await ref.close();
  }
});

test('Symptoms empty history and selected check-in match the source', async ({ page, account }, info) => {
  await signIn(page, account);
  const ref = await figmaReference(page, true);
  try {
    await page.goto('/health/symptoms');
    await ref.locator('.mobile-nav').getByRole('button', { name: 'My health' }).click();
    await ref.getByRole('tab', { name: 'Symptoms & daily life' }).click();
    await compareFigma(page, ref, 'SYM-02E-source', info, [
      '.topbar',
      '.page-heading',
      '.health-tabs',
      '.empty-chart',
      '.history-window',
      '.mobile-nav',
    ]);
    await screen(page)
      .getByRole('button', { name: /Log today/ })
      .click();
    await ref.getByRole('button', { name: /Log today/ }).click();
    for (const p of [page, ref]) {
      const modal = p.locator('.sheet');
      for (const name of ['Bleeding', 'Pain']) {
        const b = modal.getByRole('button', { name, exact: true });
        if (!(await b.getAttribute('class'))?.includes('selected')) await b.click();
      }
      await modal.getByRole('button', { name: 'Heavy', exact: true }).click();
      const impact = modal.getByRole('button', { name: 'Slowed me down', exact: true });
      if (!(await impact.getAttribute('class'))?.includes('selected')) await impact.click();
    }
    // Figma preselects Heavy; clicking its selected button does not clear it. Restore the matching chosen state.
    if (!(await page.locator('.bleeding-scale button.selected').count()))
      await page.locator('.sheet').getByRole('button', { name: 'Heavy', exact: true }).click();
    await compareFigma(page, ref, 'SYM-01I-source', info, [
      '.sheet',
      '.choice-grid',
      '.bleeding-scale',
      '.impact-list',
    ]);
  } finally {
    await ref.close();
  }
});

test('Suggested-question sheet matches the source without adding the question automatically', async ({
  page,
  account,
}, info) => {
  await signIn(page, account);
  const ref = await figmaReference(page, true);
  try {
    await page.goto('/health/question/location');
    await ref.locator('.mobile-nav').getByRole('button', { name: 'My health' }).click();
    await ref.locator('.report-document em').evaluate((e) => (e.textContent = '5 fields not recorded'));
    await ref
      .locator('.missing-report')
      .first()
      .getByRole('button', { name: 'Add a question for my next doctor’s visit' })
      .click();
    await compareFigma(page, ref, 'HLT-03-source', info, ['.suggestion-sheet', '.question-editor', '.sheet .primary']);
  } finally {
    await ref.close();
  }
});

test('Food landing and planner retain the source introduction and duration controls', async ({
  page,
  account,
}, info) => {
  await signIn(page, account);
  const ref = await figmaReference(page, true);
  try {
    await page.goto('/food/requirements');
    await screen(page).getByRole('button', { name: 'Confirm and plan meals' }).click();
    await ref.locator('.mobile-nav').getByRole('button', { name: 'Food', exact: true }).click();
    await ref.getByRole('button', { name: /Plan meals & groceries/ }).click();
    await expect(screen(page).locator('.plan-calendar > button')).toHaveCount(3);
    await expect(screen(page).getByText('Finding meals…', { exact: true })).toHaveCount(0);
    // The exported planner's three mock recipes are replaced by actual eligible meals; compare its shared geometry.
    for (const selector of [
      '.topbar',
      '.page-heading',
      '.food-intro',
      '.food-paths',
      '.meal-plan-head',
      '.horizon-tabs',
    ]) {
      const actual = await page
        .locator(selector + ':visible')
        .last()
        .boundingBox();
      const expected = await ref.locator(selector).boundingBox();
      for (const key of ['x', 'y', 'width', 'height'] as const)
        expect(Math.abs(actual![key] - expected![key]), `${selector} ${key}`).toBeLessThan(0.1);
    }
    for (const label of ['3 days', '1 week', '2 weeks', '1 month']) {
      await screen(page).getByRole('tab', { name: label, exact: true }).click();
      await ref.getByRole('tab', { name: label, exact: true }).click();
      await expect(screen(page).locator('.plan-calendar > button')).toHaveCount(
        await ref.locator('.plan-calendar > button').count(),
      );
    }
  } finally {
    await ref.close();
  }
});
