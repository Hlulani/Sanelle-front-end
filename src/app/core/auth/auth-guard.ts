import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

async function signedIn(auth: AuthService): Promise<boolean> {
  // A short-lived access token expiring between navigations isn't a logout: try the refresh token.
  return auth.hasValidToken() || (await auth.restoreSession());
}

/** Health screens need a session, and a new account finishes setup first. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  if (!(await signedIn(auth))) return router.parseUrl('/login');
  const url = state?.url || '';
  if (!auth.hasCompletedOnboarding() && !url.startsWith('/onboarding')) return router.parseUrl('/onboarding');
  return true;
};

/** Welcome, registration and log-in are for people who aren't signed in. */
export const signedOutGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  if (!(await signedIn(auth))) return true;
  return router.parseUrl(auth.hasCompletedOnboarding() ? '/tabs/today' : '/onboarding');
};

/** The evidence catalogue is a separate, role-gated workspace. */
export const evidenceEditorGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  if (!(await signedIn(auth))) return router.parseUrl('/login');
  return (await auth.verifyEvidenceEditor()) ? true : router.parseUrl('/tabs/today');
};
