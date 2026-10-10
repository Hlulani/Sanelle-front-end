import { Injectable } from '@angular/core';

/**
 * The details just used to register, held in memory only (never stored), so "Continue to
 * Sanelle" can sign in once the email address is confirmed. Cleared after use.
 */
@Injectable({ providedIn: 'root' })
export class PendingSignIn {
  private details: { email: string; password: string } | null = null;

  remember(email: string, password: string): void {
    this.details = { email, password };
  }

  get(): { email: string; password: string } | null {
    return this.details;
  }

  clear(): void {
    this.details = null;
  }
}
