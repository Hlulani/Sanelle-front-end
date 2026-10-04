import { defineConfig, devices } from '@playwright/test';
import { APP_URL } from './thandi';

/**
 * Records one Sanelle demo journey in portrait phone mode. Development tooling only:
 * nothing here is imported by the app, and it lives outside src/.
 */
const PHONE = { width: 390, height: 844 };

export default defineConfig({
  testDir: '.',
  testMatch: 'record-demo.spec.ts',
  outputDir: './.output',
  timeout: 5 * 60_000,
  expect: { timeout: 20_000 },
  retries: 0,
  workers: 1,
  reporter: [['list']],
  webServer: {
    // Draft food topics only exist in the development build, so record against ng serve.
    command: 'npx ng serve --port 4200',
    cwd: '..',
    url: APP_URL,
    reuseExistingServer: true,
    timeout: 3 * 60_000,
  },
  projects: [
    {
      name: 'iphone-portrait',
      use: {
        ...devices['iPhone 13'], // WebKit, touch, mobile user agent, so Ionic renders its iOS look
        viewport: PHONE,
        screen: PHONE,
        baseURL: APP_URL,
        video: { mode: 'on', size: PHONE },
        actionTimeout: 20_000,
        navigationTimeout: 30_000,
      },
    },
  ],
});
