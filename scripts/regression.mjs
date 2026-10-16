#!/usr/bin/env node
/**
 * Regression runner. See docs/regression.md for which tier to run and what each journey covers.
 *
 *   npm run regression                       full: any change to logic, data, routes, storage or the API
 *   npm run regression:ui -- e2e/<spec>.ts   small UI change: styles or copy on one screen
 *   npm run regression:live                  after every deploy: the main journey on the live site
 *
 * Steps run in order and the run stops at the first failure, so the failing step is the last one printed.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = process.env['SANELLE_BACKEND_DIR'] ?? path.resolve(root, '../sanelle-back-end');
const [tier = 'full', ...specs] = process.argv.slice(2);

const e2e = (...args) => ['npx', 'playwright', 'test', '--config', 'e2e/playwright.config.ts', ...args];
const steps = {
  full: [
    ['Lint', ['npm', 'run', 'lint']],
    ['Formatting', ['npm', 'run', 'format:check']],
    ['Unit tests', ['npx', 'ng', 'test', '--watch=false']],
    ['Every journey, Android-size Chrome and iPhone-size Safari', e2e()],
    ...(existsSync(path.join(backend, 'mvnw'))
      ? [
          ['Back-end tests', ['./mvnw', '-q', 'test'], backend],
          ['Sanelle AI workflow tests', ['npm', 'test'], path.join(backend, 'workflow')],
        ]
      : []),
  ],
  ui: [
    ['Lint', ['npm', 'run', 'lint']],
    ['Formatting', ['npm', 'run', 'format:check']],
    ['Unit tests', ['npx', 'ng', 'test', '--watch=false']],
    // The design comparisons and the small-phone layout check catch most visual regressions;
    // the specs passed in cover the screen that changed.
    ['Design comparisons', e2e('figma-journeys')],
    ['Small and wide screens', e2e('resilience', '-g', 'fit a small phone')],
    ...(specs.length ? [['The changed journey', e2e(...specs)]] : []),
  ],
  live: [['Live site, main journey', ['npx', 'playwright', 'test', '--config', 'e2e/live.config.ts']]],
}[tier];

if (!steps) {
  console.error(`Unknown tier "${tier}". Use full, ui or live.`);
  process.exit(2);
}
if (tier === 'ui' && !specs.length)
  console.warn('Tip: pass the spec for the screen you changed, e.g. npm run regression:ui -- e2e/insights.spec.ts\n');
if (tier === 'full' && !existsSync(path.join(backend, 'mvnw')))
  console.warn(`Back-end not found at ${backend}; set SANELLE_BACKEND_DIR to include its tests.\n`);

const started = Date.now();
for (const [name, [cmd, ...args], cwd = root] of steps) {
  console.log(`\n▶ ${name}`);
  const t = Date.now();
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env });
  const secs = Math.round((Date.now() - t) / 1000);
  if (result.status !== 0) {
    console.error(`\n✘ ${name} failed after ${secs}s. Fix it before committing or pushing.`);
    process.exit(result.status ?? 1);
  }
  console.log(`✔ ${name} (${secs}s)`);
}
console.log(`\n✔ Regression (${tier}) passed in ${Math.round((Date.now() - started) / 60000)} min.`);
