import { isPublicAuthRequest } from './auth.interceptor';

describe('isPublicAuthRequest', () => {
  const api = 'http://localhost:8080/api/v1';

  it('sends no token when signing in, signing up, refreshing or signing out', () => {
    for (const path of ['login', 'register', 'refresh', 'logout']) {
      expect(isPublicAuthRequest(`${api}/auth/${path}`)).withContext(path).toBeTrue();
    }
  });

  it('sends the token for account requests such as deleting the account', () => {
    expect(isPublicAuthRequest(`${api}/auth/me`)).toBeFalse();
    expect(isPublicAuthRequest(`${api}/meal-plans/generate`)).toBeFalse();
  });
});
