import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: /demo-main-flow\.spec\.ts$/,
  outputDir: './.output/demo-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 420_000,
  reporter: [['list'], ['html', { outputFolder: './.output/demo-report', open: 'never' }]],
  use: { ...base.use, trace: 'retain-on-failure' },
  projects: [
    { name: 'demo', use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
});
