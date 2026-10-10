import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard, evidenceEditorGuard } from './auth-guard';
import { AuthService } from './auth.service';
describe('Route permissions', () => {
  let auth: {
    hasValidToken: () => boolean;
    restoreSession: () => Promise<boolean>;
    hasCompletedOnboarding: () => boolean;
    verifyEvidenceEditor: () => Promise<boolean>;
  };
  beforeEach(() => {
    auth = {
      hasValidToken: () => true,
      restoreSession: async () => true,
      hasCompletedOnboarding: () => true,
      verifyEvidenceEditor: async () => false,
    };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });
  });
  const route = {} as ActivatedRouteSnapshot;
  const state = (url: string) => ({ url }) as RouterStateSnapshot;
  it('redirects an unauthenticated patient to login', async () => {
    auth.hasValidToken = () => false;
    auth.restoreSession = async () => false;
    const result = await TestBed.runInInjectionContext(() => authGuard(route, state('/tabs/today')));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
  });
  it('finishes setup before opening a new account’s health screens', async () => {
    auth.hasCompletedOnboarding = () => false;
    const result = await TestBed.runInInjectionContext(() => authGuard(route, state('/tabs/health')));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/onboarding');
  });
  it('requires the server to confirm the editor role', async () => {
    const denied = await TestBed.runInInjectionContext(() => evidenceEditorGuard(route, state('/internal/evidence')));
    expect(TestBed.inject(Router).serializeUrl(denied as UrlTree)).toBe('/tabs/today');
    auth.verifyEvidenceEditor = async () => true;
    expect(
      await TestBed.runInInjectionContext(() => evidenceEditorGuard(route, state('/internal/evidence'))),
    ).toBeTrue();
  });
});
