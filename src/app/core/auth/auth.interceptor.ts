import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, from, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthRequest = req.url.includes('/api/v1/auth/');
  const token = auth.getAccessToken();

  const authReq = !isAuthRequest && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (isAuthRequest) return throwError(() => err);

      if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
        return from(auth.restoreSession()).pipe(
          switchMap((restored) => {
            if (!restored) {
              router.navigateByUrl('/auth');
              return throwError(() => err);
            }

            const newToken = auth.getAccessToken();
            const retryReq = newToken
              ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
              : req;

            return next(retryReq);
          })
        );
      }

      return throwError(() => err);
    })
  );
};
