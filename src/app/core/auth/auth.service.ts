import { inject, Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { ApiService, LoginResponse, RegisterRequest } from '../services/api.service';
import { firstValueFrom, from, map, switchMap, tap } from 'rxjs';
import { CareReminders } from '../../my-health/care-reminders.service';
import { accountKey } from '../storage/account-key';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private careReminders = inject(CareReminders);

  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  /** Device-wide flag from before onboarding was tracked per account; only cleaned up now. */
  private readonly LEGACY_ONBOARDING_KEY = 'onboarding_completed';
  private readonly ONBOARDING_KEY_PREFIX = 'onboarding_completed.';

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
    return this.startSession(this.api.login(email, password));
  }

  /** The emailed verification link signs the person in. */
  verifyEmail(token: string) {
    return this.startSession(this.api.verifyEmail(token));
  }

  private startSession(request: ReturnType<ApiService['login']>) {
    return request.pipe(
      tap((res: LoginResponse) => {
        this.storeTokens(res.accessToken, res.refreshToken);
      }),
      // Guards read the onboarding state synchronously, so it must be loaded before anyone navigates.
      switchMap((res) => from(this.loadOnboardingState()).pipe(map(() => res))),
    );
  }

  /** Creates an unverified account. A new account always starts at onboarding once verified. */
  register(req: RegisterRequest) {
    return this.api
      .register(req)
      .pipe(
        switchMap((res) =>
          from(Preferences.set({ key: this.onboardingKey(res.email || req.email), value: 'false' })).pipe(
            map(() => res),
          ),
        ),
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
    // Records stay on the device, encrypted per account, so logging out never deletes them and
    // another account signing in never sees them.
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
    return accountKey(this.ONBOARDING_KEY_PREFIX, email);
  }

  /** A storage key for the signed-in account, or null when nobody is signed in. */
  currentAccountKey(prefix: string): string | null {
    const email = this.getUserEmail();
    return email ? accountKey(prefix, email) : null;
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
    return this.claim('sub');
  }

  /** The `username` claim the backend embeds in the access token. */
  getUsername(): string | null {
    return this.claim('username');
  }

  /** The name given at registration. */
  getDisplayName(): string | null {
    return this.claim('name');
  }

  /** The internal evidence catalogue is only for accounts the server names as editors. */
  isEvidenceEditor(): boolean {
    const token = this.getAccessToken();
    const roles = token ? this.decodeJwtPayload(token)?.['roles'] : undefined;
    return Array.isArray(roles) && roles.includes('EVIDENCE_EDITOR');
  }
  async verifyEvidenceEditor(): Promise<boolean> {
    try {
      const user = await firstValueFrom(this.api.currentUser());
      return user.roles.includes('EVIDENCE_EDITOR');
    } catch {
      return false;
    }
  }

  private claim(name: string): string | null {
    const token = this.getAccessToken();
    const value = token ? this.decodeJwtPayload(token)?.[name] : undefined;
    return typeof value === 'string' ? value : null;
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
          .join(''),
      );

      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
