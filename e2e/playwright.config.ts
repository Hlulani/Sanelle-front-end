import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { APP_URL } from './support/accounts';

/**
 * End-to-end tests of the real app against the real backend. Each test signs up its own
 * throwaway account, confirmed through the backend's development outbox, and deletes it
 * afterwards. Draft food topics only exist in the development build, so the app is served
 * with ng serve.
 */
const PHONE = { width: 390, height: 844 };
const BACKEND_DIR = process.env['SANELLE_BACKEND_DIR'] ?? path.resolve(__dirname, '../../sanelle-back-end');

export default defineConfig({
  testDir: '.',
  // Every spec except local presentation captures, which run only through their own config.
  testMatch: /(^|[\\/])(?!presentation-)[^\\/]+\.spec\.ts$/,
  outputDir: './.output/results',
  fullyParallel: true,
  workers: 2,
  retries: process.env['CI'] ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  snapshotPathTemplate:
    '{testDir}/../docs/validation/figma-prototype-entry-2026-10-08/reference-viewports/{projectName}/{arg}{ext}',

  reporter: [['list'], ['html', { outputFolder: './.output/report', open: 'never' }]],
  use: {
    baseURL: APP_URL,
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    timezoneId: 'Europe/Vienna',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Pixel 7'], viewport: PHONE },
    },
    {
      name: 'iphone',
      // WebKit with touch and an iPhone user agent, so Ionic renders the app's iOS look.
      use: { ...devices['iPhone 13'], viewport: PHONE },
    },
  ],
  webServer: [
    {
      command: './mvnw spring-boot:run',
      cwd: BACKEND_DIR,
      // Account tests confirm email through the development outbox, which is off unless asked for.
      env: { ...(process.env as Record<string, string>), MAIL_OUTBOX_ENABLED: 'true' },
      url: 'http://localhost:8080/v3/api-docs',
      reuseExistingServer: true,
      timeout: 3 * 60_000,
    },
    {
      command: 'npx ng serve --port 4200',
      cwd: path.resolve(__dirname, '..'),
      url: APP_URL,
      reuseExistingServer: true,
      timeout: 3 * 60_000,
    },
  ],
});
