import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { FocusPreferencesService } from '../services/focus-preferences.service';

/** An unsigned token with the claims the app reads; the signature isn't checked client-side. */
function tokenFor(email: string): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'none' })}.${b64({ sub: email, exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}

describe('AuthService onboarding and diet, per account', () => {
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
    const done = firstValueFrom(auth.login(email, 'pw'));
    http.expectOne((r) => r.url.endsWith('/auth/login')).flush({ accessToken: tokenFor(email), refreshToken: tokenFor(email) });
    await done;
  }

  async function register(email: string) {
    const done = firstValueFrom(auth.register(email, 'name', 'pw'));
    http.expectOne((r) => r.url.endsWith('/auth/register')).flush({});
    await done;
  }

  it('starts a new account at onboarding, even if the previous account had finished it', async () => {
    await login('first@example.test');
    auth.setOnboardingCompleted(true);
    expect(auth.hasCompletedOnboarding()).toBeTrue();

    await register('second@example.test');
    await login('second@example.test');

    expect(auth.hasCompletedOnboarding()).toBeFalse();
  });

  it('doesn’t ask an account that finished onboarding again after logging out', async () => {
    await register('me@example.test');
    await login('me@example.test');
    auth.setOnboardingCompleted(true);
    await new Promise((r) => setTimeout(r));

    auth.logout();
    await login('me@example.test');

    expect(auth.hasCompletedOnboarding()).toBeTrue();
  });

  it('keeps sending a new account to onboarding until it is finished', async () => {
    await register('new@example.test');
    await login('new@example.test');
    auth.logout();
    await login('new@example.test');

    expect(auth.hasCompletedOnboarding()).toBeFalse();
  });

  it('keeps each account’s help choices separate', async () => {
    const prefs = TestBed.inject(FocusPreferencesService);
    await login('first@example.test');
    await prefs.saveFocus(['food', 'diagnosis']);
    expect(prefs.focus()).toEqual(['diagnosis', 'food']);

    await login('second@example.test');
    expect(await prefs.loadFocus()).toEqual([]);

    await login('first@example.test');
    expect(await prefs.loadFocus()).toEqual(['diagnosis', 'food']);
  });

  it('keeps each account’s diet separate', async () => {
    const prefs = TestBed.inject(FocusPreferencesService);
    await login('fish@example.test');
    await prefs.saveDiet('PESCATARIAN');

    await login('other@example.test');
    expect(await prefs.loadDiet()).toBeNull();

    await login('fish@example.test');
    expect(await prefs.loadDiet()).toBe('PESCATARIAN');
  });
});
