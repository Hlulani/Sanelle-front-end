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

/** The backend's error reply: its HTTP status and, when it sent one, its message. */
export interface ApiError {
  status: number;
  message: string | null;
}

/** Reads the backend's error reply ({ status, message, ... }); null for anything that isn't one. */
export function apiError(error: unknown): ApiError | null {
  if (!(error instanceof HttpErrorResponse)) return null;
  const body: unknown = error.error;
  const message =
    body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string'
      ? (body as { message: string }).message
      : null;
  return { status: error.status, message };
}
