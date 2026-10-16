import { defineConfig, devices } from '@playwright/test';

/**
 * After every deploy: the main journey on the live site (npm run regression:live). Nothing
 * starts locally. It signs in with SANELLE_LIVE_EMAIL / SANELLE_LIVE_PASSWORD and only writes
 * to a throwaway browser, so the account's server data isn't changed.
 */
export default defineConfig({
  testDir: '.',
  testMatch: /live-smoke\.spec\.ts$/,
  outputDir: './.output/live-results',
  workers: 1,
  retries: 1,
  // The free API tier can take a couple of minutes to wake.
  timeout: 300_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: process.env['SANELLE_LIVE_URL'] ?? 'https://sanelle.netlify.app',
    timezoneId: 'Europe/Vienna',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'laptop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'iphone-safari', use: { ...devices['iPhone 13'] } },
  ],
});
