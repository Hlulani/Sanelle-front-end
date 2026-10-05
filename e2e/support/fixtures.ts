import { test as base } from '@playwright/test';
import { deleteAccount, registerAccount, type TestAccount } from './accounts';
import { SanelleApp } from './sanelle-app';

/**
 * - account: a new account for this test only, deleted afterwards.
 * - app:     the app, signed in as that account and showing Today.
 * Every test also gets a fresh browser, so health records and plans start empty.
 */
export const test = base.extend<{ account: TestAccount; app: SanelleApp }>({
  account: async ({ request }, use) => {
    const account = await registerAccount(request);
    await use(account);
    await deleteAccount(request, account);
  },
  app: async ({ page, account }, use) => {
    const app = new SanelleApp(page);
    await app.signIn.open();
    await app.signIn.as(account);
    await use(app);
  },
});

export { expect } from '@playwright/test';
