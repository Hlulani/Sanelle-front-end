import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, from, switchMap, throwError } from 'rxjs';

/** Calls made without a session, or to start or end one. Everything else carries the access token. */
const PUBLIC_AUTH_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/verification/resend',
  '/api/v1/auth/password-reset',
];

export function isPublicAuthRequest(url: string): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthRequest = isPublicAuthRequest(req.url);
  const token = auth.getAccessToken();

  const authReq = !isAuthRequest && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (isAuthRequest) return throwError(() => err);

      if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
        return from(auth.restoreSession()).pipe(
          switchMap((restored) => {
            if (!restored) {
              router.navigateByUrl('/login');
              return throwError(() => err);
            }

            const newToken = auth.getAccessToken();
            const retryReq = newToken ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }) : req;

            return next(retryReq);
          }),
        );
      }

      return throwError(() => err);
    }),
  );
};
