import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /demo-ai-deployed\.spec\.ts$/,
  outputDir: './.output/demo-ai-results',
  workers: 1,
  retries: 0,
  timeout: 900_000,
  expect: { timeout: 30_000 },
  reporter: [['list']],
  use: {
    baseURL: 'https://sanelle.netlify.app',
    browserName: 'chromium',
    viewport: { width: 1280, height: 1040 },
    deviceScaleFactor: 1,
    timezoneId: 'Europe/Vienna',
    actionTimeout: 30_000,
    video: { mode: 'on', size: { width: 1280, height: 1040 } },
    screenshot: 'only-on-failure',
  },
});
