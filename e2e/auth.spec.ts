import { expect, test } from './support/fixtures';
import { canSignIn, deleteAccount, newAccountDetails } from './support/accounts';
import { SanelleApp } from './support/sanelle-app';

test.describe('Accounts', () => {
  test('a new account starts with what she wants help with, and can be deleted', async ({ page, request }) => {
    const account = newAccountDetails();
    const app = new SanelleApp(page);
    try {
      await app.register.open();
      await app.register.register(account);
      await app.register.chooseHelpWith('Understanding my diagnosis');

      await expect(page.getByRole('heading', { name: `Hi ${account.username}` })).toBeVisible();
      await expect(app.today.lead()).toContainText('You wanted help understanding your diagnosis.');

      await app.account.open();
      await app.account.deleteAccount();
      await expect(app.register.isShown()).toBeVisible();
      expect(await canSignIn(request, account)).toBe(false);
    } finally {
      await deleteAccount(request, account); // only if the test stopped before deleting it
    }
  });

  test('signing out returns to sign-in and protects the app', async ({ app, page }) => {
    await app.account.open();
    await app.account.logOut();
    await expect(app.signIn.isShown()).toBeVisible();

    await page.goto('/tabs/today');
    await expect(page).not.toHaveURL(/\/tabs\//);
  });
});
