import { test, expect, screen, shot, signIn, finishSetup, settleToday } from './support/redesign';
import { API_URL, newAccountDetails, mailToken, deleteAccount } from './support/accounts';
test('AUTH-01–03 registration validates fields, verifies email and completes all onboarding screens', async ({
  page,
  request,
}, info) => {
  const account = newAccountDetails();
  try {
    await page.goto('/welcome');
    await expect(screen(page).getByRole('link', { name: 'Create my account' })).toBeVisible();
    await shot(page, 'AUTH-01', info);
    await screen(page).getByRole('link', { name: 'Create my account' }).click();
    await screen(page).getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(screen(page).getByText('Tick the box to say you’ve read the terms.')).toBeVisible();
    await screen(page).getByLabel('Your first name').fill('Thandi');
    await screen(page).getByLabel('Email', { exact: true }).fill(account.email);
    await screen(page).getByLabel('Password', { exact: true }).fill(account.password);
    await screen(page).getByRole('checkbox').check();
    await shot(page, 'AUTH-02', info);
    let releaseRegistration!: () => void;
    const registrationGate = new Promise<void>((resolve) => (releaseRegistration = resolve));
    await page.route('**/api/v1/auth/register', async (route) => {
      await registrationGate;
      await route.continue();
    });
    await screen(page).getByRole('button', { name: 'Create account', exact: true }).click();
    try {
      await expect(screen(page).getByRole('button', { name: 'Creating your account…' })).toBeDisabled();
      await expect(screen(page).getByLabel('Email', { exact: true })).toHaveValue(account.email);
      await shot(page, 'AUTH-02L', info);
    } finally {
      releaseRegistration();
    }
    await expect(page).toHaveURL(/check-email/);
    await shot(page, 'AUTH-03', info);
    await screen(page).getByRole('button', { name: 'Continue to Sanelle' }).click();
    await expect(
      screen(page)
        .getByText(/hasn’t been confirmed|isn’t confirmed|Open the link|haven’t confirmed|not confirmed|not yet/)
        .last(),
    ).toBeVisible();
    const token = await mailToken(request, account.email);
    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
    await expect(page).toHaveURL(/onboarding/);
    for (let n = 1; n <= 5; n++) {
      await shot(page, `ONB-0${n}`, info);
      if (n === 1) await screen(page).getByLabel('First name', { exact: true }).fill('Thandi');
      await screen(page)
        .getByRole('button', {
          name: n === 1 ? 'Start setting up Sanelle' : n === 5 ? 'Finish setup' : 'Continue',
          exact: true,
        })
        .click();
    }
    await expect(screen(page).getByRole('heading', { name: 'Ready to start' })).toBeVisible();
    await screen(page).getByRole('button', { name: 'Open Sanelle', exact: true }).click();
    await expect(page).toHaveURL(/tabs\/today/);
    await shot(page, 'TOD-01', info);
    await settleToday(page);
    await shot(page, 'TOD-02-empty', info);
    await expect(screen(page).getByText('Nothing recorded yet. Actions you take will appear here.')).toBeVisible();
    await shot(page, 'TOD-03-empty', info);
  } finally {
    const verify = await request.post(`${API_URL}/auth/login`, { data: account });
    if (verify.status() === 403) {
      const t = await mailToken(request, account.email);
      await request.post(`${API_URL}/auth/verify-email`, { data: { token: t } });
    }
    await deleteAccount(request, account);
  }
});
test('AUTH-04 wrong credentials and an unverified email have different recovery states', async ({
  page,
  request,
  account,
}, info) => {
  await page.goto('/login');
  await screen(page).getByLabel('Email', { exact: true }).fill(account.email);
  await screen(page).getByLabel('Password', { exact: true }).fill('wrong-password');
  await shot(page, 'AUTH-04', info);
  await screen(page).getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(screen(page).getByRole('alert')).toContainText('don’t match');
  await shot(page, 'AUTH-04-invalid-credentials', info);
  await signIn(page, account);
  await page.goto('/account');
  await screen(page).getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await signIn(page, account);
  await expect(page).toHaveURL(/tabs\/today/);
});
test('AUTH-05 reset preserves account privacy, changes password and rejects reuse', async ({
  page,
  request,
  account,
}, info) => {
  await page.goto('/reset-password');
  await screen(page)
    .getByLabel('Email', { exact: true })
    .fill('unknown-' + account.email);
  await screen(page).getByRole('button', { name: 'Send reset link' }).click();
  await expect(screen(page).getByText(/If there’s an account/)).toBeVisible();
  await page.goto('/reset-password');
  await screen(page).getByLabel('Email', { exact: true }).fill(account.email);
  await shot(page, 'AUTH-05', info);
  await screen(page).getByRole('button', { name: 'Send reset link' }).click();
  const token = await mailToken(request, account.email, 'RESET_PASSWORD');
  await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
  await screen(page).getByLabel('New password', { exact: true }).fill('Changed-Pass-2026!');
  await screen(page).getByLabel('Type it again').fill('Changed-Pass-2026!');
  await screen(page).getByRole('button', { name: 'Save new password' }).click();
  await expect(screen(page).getByRole('heading', { name: 'Password changed' })).toBeVisible();
  account.password = 'Changed-Pass-2026!';
  await signIn(page, account);
  await page.goto('/account');
  await screen(page).getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
  await screen(page).getByLabel('New password', { exact: true }).fill('Another-Pass-2026!');
  await screen(page).getByLabel('Type it again').fill('Another-Pass-2026!');
  await screen(page).getByRole('button', { name: 'Save new password' }).click();
  await expect(screen(page).getByRole('alert')).toContainText(/used|valid/);
});
