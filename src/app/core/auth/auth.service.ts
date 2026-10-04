import { inject, Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { ApiService, LoginResponse } from '../services/api.service';
import { PlanStoreService } from '../services/plan-store.service';
import { MealProgressService } from '../services/meal-progress.service';
import { ChallengesService } from '../services/challenges.service';
import { CustomChallengesService } from '../services/custom-challenges.service';
import { firstValueFrom, from, map, switchMap, tap } from 'rxjs';
import { CareReminders } from '../../my-health/steps/care-reminders.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private planStore = inject(PlanStoreService);
  private mealProgress = inject(MealProgressService);
  private challenges = inject(ChallengesService);
  private customChallenges = inject(CustomChallengesService);
  private careReminders = inject(CareReminders);

  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  /** Device-wide flag from before onboarding was tracked per account; only cleaned up now. */
  private readonly LEGACY_ONBOARDING_KEY = 'onboarding_completed';
  private readonly ONBOARDING_KEY_PREFIX = 'onboarding_completed.';
  private readonly LAST_USER_KEY = 'last_active_user_email';

  // In-memory cache so token reads stay synchronous (guards/interceptor rely on
  // this) while the values themselves live in Preferences, not raw localStorage.
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onboardingCompleted = false;

  // Shared promise so concurrent 401s trigger one refresh call, not one each.
  private refreshInFlight: Promise<boolean> | null = null;

  // Resolves once the in-memory cache has been hydrated from Preferences.
  // Must be awaited (via an app initializer) before any guard runs.
  private hydrated: Promise<void> | null = null;

  init(): Promise<void> {
    if (!this.hydrated) {
      this.hydrated = (async () => {
        const [access, refresh] = await Promise.all([
          Preferences.get({ key: this.TOKEN_KEY }),
          Preferences.get({ key: this.REFRESH_KEY }),
        ]);
        this.accessToken = this.isJwtFormat(access.value) ? access.value : null;
        this.refreshToken = this.isJwtFormat(refresh.value) ? refresh.value : null;
        await this.loadOnboardingState();
      })();
    }
    return this.hydrated;
  }

  login(email: string, password: string) {
    return this.api.login(email, password).pipe(
      tap((res: LoginResponse) => {
        this.storeTokens(res.accessToken, res.refreshToken);
        void this.clearLocalDataIfDifferentUser();
      }),
      // Guards read the onboarding state synchronously, so it must be loaded before anyone navigates.
      switchMap((res) => from(this.loadOnboardingState()).pipe(map(() => res)))
    );
  }

  register(email: string, username: string, password: string) {
    return this.api.register(email, username, password).pipe(
      tap((res: Partial<LoginResponse>) => {
        // A new account can never legitimately inherit another account's
        // locally-cached plan/progress, whatever device state led here.
        this.planStore.setPlan(null);
        this.mealProgress.clear();
        this.challenges.clear();
        this.customChallenges.clear();
        void Preferences.set({ key: this.LAST_USER_KEY, value: email.toLowerCase() });
        if (res?.accessToken && res?.refreshToken) {
          this.storeTokens(res.accessToken, res.refreshToken);
        }
      }),
      // A new account always starts at onboarding, whoever used this device before.
      switchMap((res) =>
        from(Preferences.set({ key: this.onboardingKey(email), value: 'false' })).pipe(
          tap(() => (this.onboardingCompleted = false)),
          map(() => res)
        )
      )
    );
  }

  deleteAccount() {
    return this.api.deleteAccount().pipe(tap(() => this.logout()));
  }

  logout(): void {
    void this.careReminders.clear().catch(() => undefined);
    this.accessToken = null;
    this.refreshToken = null;
    this.onboardingCompleted = false;
    void Preferences.remove({ key: this.TOKEN_KEY });
    void Preferences.remove({ key: this.REFRESH_KEY });
    void Preferences.remove({ key: this.LEGACY_ONBOARDING_KEY });
    // Deliberately NOT clearing plan/progress/challenge data here — logging
    // out (including an automatic one after a failed token refresh, e.g. the
    // backend being briefly unreachable) isn't the same thing as switching
    // accounts. The same user logging back in should see their plan exactly
    // as they left it. Cross-account leakage is guarded at login() instead,
    // by comparing identities — see clearLocalDataIfDifferentUser().
  }

  /**
   * Clears locally-cached plan/progress/challenge data if the account that
   * just logged in isn't the same one this device's cached data belongs to.
   * Must run after storeTokens() so getUserEmail() reflects the new session.
   */
  private async clearLocalDataIfDifferentUser(): Promise<void> {
    const email = this.getUserEmail();
    if (!email) return;
    const normalized = email.toLowerCase();

    const { value: lastEmail } = await Preferences.get({ key: this.LAST_USER_KEY });
    if (lastEmail && lastEmail !== normalized) {
      this.planStore.setPlan(null);
      this.mealProgress.clear();
      this.challenges.clear();
      this.customChallenges.clear();
    }
    void Preferences.set({ key: this.LAST_USER_KEY, value: normalized });
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    const exp = this.getJwtExp(token);
    if (!exp) return true;

    const nowSeconds = Math.floor(Date.now() / 1000);
    return exp > nowSeconds;
  }

  private hasValidRefreshToken(): boolean {
    const token = this.getRefreshToken();
    if (!token) return false;

    const exp = this.getJwtExp(token);
    if (!exp) return true;

    const nowSeconds = Math.floor(Date.now() / 1000);
    return exp > nowSeconds;
  }

  async restoreSession(): Promise<boolean> {
    // 1) still valid access token
    if (this.hasValidToken()) return true;

    // 2) a refresh is already underway elsewhere — await the same one
    if (this.refreshInFlight) return this.refreshInFlight;

    // 3) refresh token itself is missing/expired, don't bother calling the API
    if (!this.hasValidRefreshToken()) return false;

    this.refreshInFlight = this.performRefresh().finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }

  private async performRefresh(): Promise<boolean> {
    const rt = this.getRefreshToken();
    if (!rt) return false;

    try {
      const pair = await firstValueFrom(this.api.refresh(rt));
      this.storeTokens(pair.accessToken, pair.refreshToken);
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    void Preferences.set({ key: this.TOKEN_KEY, value: accessToken });
    void Preferences.set({ key: this.REFRESH_KEY, value: refreshToken });
  }

  private isJwtFormat(token: string | null): token is string {
    return !!token && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(token);
  }

  hasCompletedOnboarding(): boolean {
    return this.onboardingCompleted;
  }

  setOnboardingCompleted(completed = true): void {
    this.onboardingCompleted = completed;
    const email = this.getUserEmail();
    if (email) void Preferences.set({ key: this.onboardingKey(email), value: completed ? 'true' : 'false' });
  }

  private onboardingKey(email: string): string {
    return this.ONBOARDING_KEY_PREFIX + email.toLowerCase();
  }

  /**
   * Onboarding is tracked per account. Only a new account is marked as not done, so an
   * account that signed up before this was tracked isn't sent back through it.
   */
  private async loadOnboardingState(): Promise<void> {
    const email = this.getUserEmail();
    if (!email) {
      this.onboardingCompleted = false;
      return;
    }
    const { value } = await Preferences.get({ key: this.onboardingKey(email) });
    this.onboardingCompleted = value !== 'false';
  }

  /** The `sub` claim the backend embeds in the access token — this is the user's email. */
  getUserEmail(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const claims = this.decodeJwtPayload(token);
    return typeof claims?.['sub'] === 'string' ? (claims['sub'] as string) : null;
  }

  /** The `username` claim the backend embeds in the access token. */
  getUsername(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const claims = this.decodeJwtPayload(token);
    return typeof claims?.['username'] === 'string' ? (claims['username'] as string) : null;
  }

  private getJwtExp(token: string): number | null {
    const claims = this.decodeJwtPayload(token);
    return typeof claims?.['exp'] === 'number' ? (claims['exp'] as number) : null;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;

      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
