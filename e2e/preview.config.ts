import { defineConfig } from '@playwright/test';
import path from 'node:path';

const port = process.env['SANELLE_PREVIEW_PORT'] ?? '4301';
const previewUrl = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: '.',
  testMatch: /preview-startup\.spec\.ts$/,
  outputDir: './.output/preview-results',
  workers: 2,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: { baseURL: previewUrl, viewport: { width: 390, height: 844 }, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: [
    {
      command: 'node scripts/preview.mjs',
      cwd: path.resolve(__dirname, '..'),
      env: { SANELLE_PREVIEW_PORT: port },
      url: previewUrl,
      reuseExistingServer: true,
    },
  ],
});
