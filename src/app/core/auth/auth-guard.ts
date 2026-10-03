import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  // A short-lived access token expiring between navigations isn't a real
  // logout — fall back to the refresh token (restoreSession) before giving
  // up, the same way the HTTP interceptor already does for API calls.
  const authenticated = auth.hasValidToken() || (await auth.restoreSession());

  if (authenticated) {
    const url = state?.url || '';
    if (!auth.hasCompletedOnboarding() && !url.startsWith('/onboarding')) {
      return router.parseUrl('/onboarding');
    }
    return true;
  }

  return router.parseUrl('/auth?mode=login');
};
