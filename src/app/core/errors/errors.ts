import { HttpErrorResponse } from '@angular/common/http';

/**
 * An error whose message was written for the person using Sanelle, so it can be shown as it is:
 * "This backup format is not supported." Anything else is treated as a fault, never shown raw.
 */
export class UserFacingError extends Error {
  override readonly name = 'UserFacingError';
}

/**
 * What to tell the person when something fails: Sanelle's own message as written, otherwise the
 * fallback for that action. A library's or browser's message ("Failed to fetch", a TypeError)
 * is never shown, because it doesn't help and can expose internals.
 */
export function messageFor(error: unknown, fallback: string): string {
  return error instanceof UserFacingError ? error.message : fallback;
}

/** The backend's error reply: its HTTP status and, when it sent them, its code and message. */
export interface ApiError {
  status: number;
  /** A stable reason such as "EMAIL_TAKEN" or "EMAIL_NOT_VERIFIED". */
  code: string | null;
  message: string | null;
}

/** Reads the backend's error reply ({ status, code, message, ... }); null for anything that isn't one. */
export function apiError(error: unknown): ApiError | null {
  if (!(error instanceof HttpErrorResponse)) return null;
  const body = (error.error && typeof error.error === 'object' ? error.error : {}) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === 'string' ? value : null);
  return { status: error.status, code: text(body['code']), message: text(body['message']) };
}
