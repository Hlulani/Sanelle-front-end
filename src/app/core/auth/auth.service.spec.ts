import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom } from 'rxjs';
import { AuthService, SESSION_REFRESH_TIMEOUT_MS } from './auth.service';
import { ProfileService } from '../profile/profile.service';
import { FoodProfileService } from '../../food/food-profile.service';

function tokenFor(email: string, expiresInSeconds = 3600): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'none' })}.${b64({ sub: email, exp: Math.floor(Date.now() / 1000) + expiresInSeconds })}.sig`;
}
describe('Account setup and personal records', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  beforeEach(async () => {
    await Preferences.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  async function login(email: string) {
    const done = firstValueFrom(auth.login(email, 'password'));
    http
      .expectOne((r) => r.url.endsWith('/auth/login'))
      .flush({ accessToken: tokenFor(email), refreshToken: tokenFor(email) });
    await done;
  }
  async function register(email: string) {
    const done = firstValueFrom(auth.register({ name: 'Name', email, password: 'password', termsAccepted: true }));
    http.expectOne((r) => r.url.endsWith('/auth/register')).flush({ email, verificationRequired: true });
    await done;
  }
  async function expiredSession() {
    await Preferences.set({ key: 'access_token', value: tokenFor('returning@example.test', -3600) });
    await Preferences.set({ key: 'refresh_token', value: tokenFor('returning@example.test') });
    await auth.init();
  }
  it('bounds a stalled restoration, preserves the session, and permits a later retry', fakeAsync(() => {
    void expiredSession();
    flushMicrotasks();
    const refreshToken = auth.getRefreshToken();
    let restored: boolean | undefined;
    void auth.restoreSession().then((value) => (restored = value));
    const request = http.expectOne((r) => r.url.endsWith('/auth/refresh'));
    tick(SESSION_REFRESH_TIMEOUT_MS);
    flushMicrotasks();
    expect(request.cancelled).toBeTrue();
    expect(restored).toBeFalse();
    expect(auth.getRefreshToken()).toBe(refreshToken);
    void auth.restoreSession();
    flushMicrotasks();
    http.expectNone((r) => r.url.endsWith('/auth/refresh'));
    tick(30_000);
    void auth.restoreSession().then((value) => (restored = value));
    http
      .expectOne((r) => r.url.endsWith('/auth/refresh'))
      .flush({
        accessToken: tokenFor('returning@example.test'),
        refreshToken: tokenFor('returning@example.test'),
      });
    flushMicrotasks();
    expect(restored).toBeTrue();
    expect(auth.hasValidToken()).toBeTrue();
  }));
  it('shares one refresh between simultaneous startup and route checks', fakeAsync(() => {
    void expiredSession();
    flushMicrotasks();
    const results: boolean[] = [];
    void auth.restoreSession().then((value) => results.push(value));
    void auth.restoreSession().then((value) => results.push(value));
    http
      .expectOne((r) => r.url.endsWith('/auth/refresh'))
      .flush({
        accessToken: tokenFor('returning@example.test'),
        refreshToken: tokenFor('returning@example.test'),
      });
    flushMicrotasks();
    expect(results).toEqual([true, true]);
  }));
  it('preserves credentials when the server is temporarily unavailable', fakeAsync(() => {
    void expiredSession();
    flushMicrotasks();
    const refreshToken = auth.getRefreshToken();
    void auth.restoreSession();
    http.expectOne((r) => r.url.endsWith('/auth/refresh')).flush({}, { status: 503, statusText: 'Unavailable' });
    flushMicrotasks();
    expect(auth.getRefreshToken()).toBe(refreshToken);
  }));
  it('clears a refresh token rejected by the server', fakeAsync(() => {
    void expiredSession();
    flushMicrotasks();
    void auth.restoreSession();
    http.expectOne((r) => r.url.endsWith('/auth/refresh')).flush({}, { status: 401, statusText: 'Unauthorized' });
    flushMicrotasks();
    expect(auth.getRefreshToken()).toBeNull();
    expect(auth.getAccessToken()).toBeNull();
  }));
  it('registration creates no session and a new account starts at onboarding', async () => {
    await register('new@example.test');
    expect(auth.hasValidToken()).toBeFalse();
    await login('new@example.test');
    expect(auth.hasCompletedOnboarding()).toBeFalse();
  });
  it('remembers completed onboarding only for that account', async () => {
    await register('first@example.test');
    await login('first@example.test');
    auth.setOnboardingCompleted();
    await Promise.resolve();
    auth.logout();
    await login('first@example.test');
    expect(auth.hasCompletedOnboarding()).toBeTrue();
    await register('second@example.test');
    await login('second@example.test');
    expect(auth.hasCompletedOnboarding()).toBeFalse();
  });
  it('separates profile choices when switching accounts and restores them on return', async () => {
    const profile = TestBed.inject(ProfileService);
    await login('first@example.test');
    await profile.save({ priorities: ['food', 'diagnosis'], name: 'First' });
    await login('second@example.test');
    await profile.load();
    expect(profile.profile().priorities).toEqual([]);
    await login('first@example.test');
    await profile.load();
    expect(profile.profile().priorities).toEqual(['diagnosis', 'food']);
    expect(profile.name()).toBe('First');
  });
  it('separates dietary requirements between accounts', async () => {
    const food = TestBed.inject(FoodProfileService);
    await login('first@example.test');
    await food.load();
    await food.saveRequirements({ ...food.profile(), dietaryPattern: 'VEGAN' });
    await login('second@example.test');
    await food.load();
    expect(food.profile().dietaryPattern).toBe('ANY');
    await login('first@example.test');
    await food.load();
    expect(food.profile().dietaryPattern).toBe('VEGAN');
  });
});
