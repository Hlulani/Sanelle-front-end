import { HttpErrorResponse } from '@angular/common/http';
import { UserFacingError, apiError, messageFor } from './errors';

describe('errors', () => {
  it("shows Sanelle's own messages and hides everything else", () => {
    expect(messageFor(new UserFacingError('This backup format is not supported.'), 'Could not restore.')).toBe(
      'This backup format is not supported.',
    );
    expect(
      messageFor(new TypeError("Cannot read properties of undefined (reading 'pages')"), 'Could not read it.'),
    ).toBe('Could not read it.');
    expect(messageFor('offline', 'Try again.')).toBe('Try again.');
  });

  it("reads the backend's error reply", () => {
    const conflict = new HttpErrorResponse({
      status: 409,
      error: { status: 409, message: 'Username already taken: thandi' },
    });
    expect(apiError(conflict)).toEqual({ status: 409, message: 'Username already taken: thandi' });
    expect(apiError(new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }))).toEqual({
      status: 0,
      message: null,
    });
    expect(apiError(new Error('not http'))).toBeNull();
  });
});
