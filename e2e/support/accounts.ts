import { expect, type APIRequestContext } from '@playwright/test';

export const APP_URL = process.env['SANELLE_APP_URL'] ?? 'http://localhost:4200';
export const API_URL = process.env['SANELLE_API_URL'] ?? 'http://localhost:8080/api/v1';

export interface TestAccount {
  email: string;
  username: string;
  password: string;
}

/** A fresh, unique account details; nothing is created until it's registered. */
export function newAccountDetails(): TestAccount {
  const id = Math.random().toString(36).slice(2, 12);
  return { email: `e2e-${id}@example.test`, username: `e2e_${id}`, password: 'E2e-Pass-2026!' };
}

/** Registers an account through the real API, so a test can start by signing in. */
export async function registerAccount(api: APIRequestContext): Promise<TestAccount> {
  const account = newAccountDetails();
  const response = await api.post(`${API_URL}/auth/register`, { data: account });
  expect(response.ok(), `Registering a test account failed (HTTP ${response.status()}). Is the backend running?`).toBe(
    true,
  );
  return account;
}

/** Deletes the account if it still exists, so test runs don't pile up users. */
export async function deleteAccount(api: APIRequestContext, account: TestAccount): Promise<void> {
  const login = await api.post(`${API_URL}/auth/login`, { data: { email: account.email, password: account.password } });
  if (!login.ok()) return; // already deleted, for example by the test itself
  const { accessToken } = await login.json();
  const response = await api.delete(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
  expect(response.status(), 'Deleting the test account failed').toBe(204);
}

export async function canSignIn(api: APIRequestContext, account: TestAccount): Promise<boolean> {
  const login = await api.post(`${API_URL}/auth/login`, { data: { email: account.email, password: account.password } });
  return login.ok();
}
