import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ProfileService } from '../profile/profile.service';
import { FoodProfileService } from '../../food/food-profile.service';

function tokenFor(email: string): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'none' })}.${b64({ sub: email, exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
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
