import { expect, type APIRequestContext } from '@playwright/test';
export const APP_URL = process.env['SANELLE_APP_URL'] ?? 'http://localhost:4200';
export const API_URL = process.env['SANELLE_API_URL'] ?? 'http://localhost:8080/api/v1';
export interface TestAccount {
  email: string;
  username: string;
  password: string;
}
export function newAccountDetails(): TestAccount {
  const id = Math.random().toString(36).slice(2, 12);
  return { email: `e2e-${id}@example.test`, username: `e2e_${id}`, password: 'E2e-Pass-2026!' };
}
export async function mailToken(api: APIRequestContext, email: string, purpose = 'VERIFY_EMAIL'): Promise<string> {
  let token = '';
  await expect
    .poll(async () => {
      const r = await api.get(`${API_URL}/dev/outbox`, { params: { email } });
      expect(r.ok(), 'The local development outbox must be enabled for account tests').toBeTruthy();
      const messages = await r.json();
      token = messages.find((m: { purpose: string; token: string }) => m.purpose === purpose)?.token ?? '';
      return token;
    })
    .not.toBe('');
  return token;
}
export async function registerAccount(api: APIRequestContext, name = 'Journey Tester'): Promise<TestAccount> {
  const account = newAccountDetails();
  const r = await api.post(`${API_URL}/auth/register`, {
    data: { ...account, name, termsAccepted: true },
  });
  expect(r.ok(), `Registration failed: HTTP ${r.status()}`).toBeTruthy();
  const token = await mailToken(api, account.email);
  const v = await api.post(`${API_URL}/auth/verify-email`, { data: { token } });
  expect(v.ok()).toBeTruthy();
  return account;
}
export async function deleteAccount(api: APIRequestContext, account: TestAccount): Promise<void> {
  const r = await api.post(`${API_URL}/auth/login`, { data: { email: account.email, password: account.password } });
  if (!r.ok()) return;
  const { accessToken } = await r.json();
  const d = await api.delete(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
  expect(d.status()).toBe(204);
}
export async function canSignIn(api: APIRequestContext, account: TestAccount): Promise<boolean> {
  return (await api.post(`${API_URL}/auth/login`, { data: { email: account.email, password: account.password } })).ok();
}
