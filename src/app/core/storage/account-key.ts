/** One spelling per account, so "Thandi@Example.com " and "thandi@example.com" share their data. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** A storage key scoped to one account, so another person on the same device never reads it. */
export function accountKey(prefix: string, email: string): string {
  return prefix + normalizeEmail(email);
}
