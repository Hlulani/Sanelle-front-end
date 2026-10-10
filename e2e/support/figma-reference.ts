import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page, type TestInfo } from '@playwright/test';

export const FIGMA_OUTPUT = path.resolve('docs/validation/figma-prototype-entry-2026-10-08');
export const JOURNEY_OUTPUT = path.resolve('docs/validation/figma-prototype-journeys-2026-10-08');
const RUNTIME = path.resolve('docs/design/figma-make-source-2026-10-08/runtime');

/** Independently run the supplied React prototype; do not generate reference pixels from Angular. */
export async function figmaReference(page: Page, patient = false): Promise<Page> {
  const reference = await page.context().newPage();
  await reference.setViewportSize(page.viewportSize()!);
  const html = (await readFile(path.join(RUNTIME, 'index.html'), 'utf8')).replaceAll(
    '/assets/index-',
    '/__figma-source/index-',
  );
  await reference.route('**/__figma-reference', (route) => route.fulfill({ contentType: 'text/html', body: html }));
  await reference.route('**/__figma-source/*', async (route) => {
    const file = path.basename(new URL(route.request().url()).pathname);
    let body: string | Buffer = await readFile(path.join(RUNTIME, 'assets', file));
    if (file.endsWith('.css')) {
      const fonts = (await readFile('src/assets/fonts/figma/fonts.css', 'utf8'))
        .replaceAll('Figma Fredoka', 'Fredoka')
        .replaceAll('Figma Nunito Sans', 'Nunito Sans');
      body = fonts + '\n' + body.toString().replace(/@import\s+"https:\/\/fonts.googleapis.com[^"]+";/, '');
    }
    await route.fulfill({ contentType: file.endsWith('.css') ? 'text/css' : 'application/javascript', body });
  });
  await reference.route('https://images.unsplash.com/**', async (route) => {
    const photos: Record<string, string> = {
      'photo-1749704647390-8f696a0be917': 'onboarding-reading',
      'photo-1547592180-85f173990554': 'meal',
      'photo-1714062105876-1756a22c4caf': 'quick-meal',
      'photo-1577594412936-01fbd0d88d2c': 'pantry-meal',
      'photo-1636647511729-6703539ba71f': 'cooking',
      'photo-1620275765334-4ed948bb4502': 'notes',
      'photo-1760445530338-d5cb6c5b2e74': 'groceries',
    };
    const name = Object.entries(photos).find(([id]) => route.request().url().includes(id))?.[1];
    if (name)
      await route.fulfill({ contentType: 'image/jpeg', body: await readFile(`src/assets/photos/figma-${name}.jpg`) });
    else await route.abort();
  });
  await reference.addInitScript((patient) => {
    for (const key of ['sanelle-auth', 'sanelle-profile', 'sanelle-today-intro-seen']) localStorage.removeItem(key);
    if (patient) {
      localStorage.setItem('sanelle-auth', 'true');
      localStorage.setItem(
        'sanelle-profile',
        JSON.stringify({
          name: 'Journey Tester',
          priorities: [],
          fibroidCount: '',
          largestSize: '',
          symptoms: [],
          foodNeeds: [],
          appointmentDate: '',
        }),
      );
    }
  }, patient);
  await reference.goto('/__figma-reference');
  await reference.locator(patient ? '.topbar' : '.auth-card').waitFor();
  if (patient)
    await reference.evaluate(() => {
      document.querySelectorAll('.comparison-link,.internal-link,.comparison-fab').forEach((e) => e.remove());
    });
  return reference;
}

export async function compareFigma(page: Page, reference: Page, id: string, info: TestInfo, selectors: string[]) {
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
  await reference.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
  );
  for (const p of [page, reference]) {
    await p.mouse.move(0, 0);
    await p.locator('h1:visible').last().waitFor();
    await p.evaluate(async () => {
      (document.activeElement as HTMLElement | null)?.blur();
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)));
    });
  }
  await page.evaluate(async () => {
    const content = [...document.querySelectorAll('ion-content')].find(
      (e) => !(e as HTMLElement).closest('.ion-page-hidden'),
    ) as HTMLElement & { scrollToTop(ms: number): Promise<void> };
    await content?.scrollToTop(0);
    document.querySelector('.report-scan')?.scrollTo(0, 0);
  });
  await reference.evaluate(() => window.scrollTo(0, 0));
  // iOS Ionic transitions can run in a shadow layer that WebKit omits from document.getAnimations().
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await expect
    .poll(
      async () =>
        (
          await page
            .locator('.auth-header:visible,.onboarding-header:visible,.topbar:visible,.scan-header:visible')
            .last()
            .boundingBox()
        )?.x,
    )
    .toBe(0);
  if (id === 'AUTH-04-empty') {
    selectors = [...selectors, '.auth-primary svg'];
    const icon = (svg: SVGElement) => ({
      path: svg.querySelector('path')?.getAttribute('d'),
      stroke: getComputedStyle(svg).stroke,
      strokeWidth: getComputedStyle(svg).strokeWidth,
      linecap: getComputedStyle(svg).strokeLinecap,
      linejoin: getComputedStyle(svg).strokeLinejoin,
    });
    expect(await page.locator('.auth-primary:visible svg').evaluate(icon)).toEqual(
      await reference.locator('.auth-primary svg').evaluate(icon),
    );
  }
  const measurements = [];
  for (const selector of selectors) {
    const actual = await page.locator(`${selector}:visible`).last().boundingBox();
    const expected = await reference.locator(selector).last().boundingBox();
    const typography = (el: Element) =>
      [...el.querySelectorAll('h2,h3,button,p')].slice(0, 8).map((e) => ({
        tag: e.tagName,
        text: e.textContent?.trim(),
        font: getComputedStyle(e).font,
        lineHeight: getComputedStyle(e).lineHeight,
      }));
    measurements.push({
      selector,
      actual,
      expected,
      actualType: await page.locator(`${selector}:visible`).last().evaluate(typography),
      referenceType: await reference.locator(selector).last().evaluate(typography),
    });
    for (const key of ['x', 'y', 'width', 'height'] as const)
      expect.soft(Math.abs(actual![key] - expected![key]), `${id}: ${selector} ${key}`).toBeLessThan(0.1);
  }
  const output = info.file.endsWith('figma-journeys.spec.ts') ? JOURNEY_OUTPUT : FIGMA_OUTPUT;
  await mkdir(path.join(output, 'measurements', info.project.name), { recursive: true });
  await writeFile(
    path.join(output, 'measurements', info.project.name, `${id}.json`),
    JSON.stringify(measurements, null, 2),
  );
  const expected = await reference.screenshot({ animations: 'disabled', scale: 'css' });
  const actual = await page.screenshot({ animations: 'disabled', scale: 'css' });
  const baseline = info.snapshotPath(`${id}.png`);
  await mkdir(path.dirname(baseline), { recursive: true });
  await writeFile(baseline, expected);
  await mkdir(path.join(output, 'reference-viewports', info.project.name), { recursive: true });
  await writeFile(path.join(output, 'reference-viewports', info.project.name, `${id}.png`), expected);
  await mkdir(path.join(output, 'screenshots', info.project.name), { recursive: true });
  await writeFile(path.join(output, 'screenshots', info.project.name, `${id}.png`), actual);
  expect.soft(actual, `${id}: original Figma prototype`).toMatchSnapshot(`${id}.png`, {
    threshold: 0.01,
    maxDiffPixels: allowedStrayPixels(info, id),
  });
}

/** Explicit user corrections to the exported prototype's outdated step counter and appointment flow. */
export async function correctedProgress(reference: Page, step: number) {
  await reference.evaluate((step) => {
    const header = document.querySelector('.onboarding-header')!;
    const counters = [...header.querySelectorAll(':scope > span')];
    counters.slice(0, -1).forEach((e) => e.remove());
    let counter = counters.at(-1);
    if (!counter) {
      counter = document.createElement('span');
      header.append(counter);
    }
    counter.textContent = `Step ${step} of 5`;
    if (step === 1)
      document.querySelector('.privacy-copy')!.textContent =
        'You can skip optional questions and update anything later. Your health details are stored only on this device.';
    if (step === 5) {
      document.querySelector('.setup-summary')?.remove();
      document.querySelector('.consent-note')?.remove();
      const date = document.querySelector('.date-field')!;
      if (!date.parentElement!.querySelector('.demo-link')) {
        const noDate = document.createElement('button');
        noDate.className = 'demo-link';
        noDate.textContent = "I don't have a date";
        date.after(noDate);
      }
      const next = document.querySelector('.step-actions .primary')!;
      next.childNodes[0].textContent = 'Finish setup ';
    }
  }, step);
}

/**
 * Differing pixels allowed when the app is compared with the prototype. Zero, except:
 *  - WebKit's Ionic scrolling layer rasterises one corner of the login arrow differently;
 *  - Linux WebKit (CI) anti-aliases a few glyph edges and the page's corner pixel differently
 *    from macOS WebKit, where the references were checked.
 * Layout is verified separately, element by element, to within 0.1 CSS pixels everywhere.
 */
function allowedStrayPixels(info: TestInfo, id: string): number {
  if (info.project.name !== 'iphone') return 0;
  if (process.platform === 'linux') return 50;
  return id === 'AUTH-04-empty' ? 25 : 0;
}
