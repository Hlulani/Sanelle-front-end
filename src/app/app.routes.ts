import { Routes } from '@angular/router';
import { authGuard, evidenceEditorGuard, signedOutGuard } from './core/auth/auth-guard';

/**
 * Routes follow the handoff's screen IDs. Patient navigation has four destinations (Today, Food,
 * My health, Appointment); the evidence catalogue is a separate, role-gated workspace.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },

  // Journey 1: account (AUTH-01 to AUTH-05)
  {
    path: 'welcome',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./account-access/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'register',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./account-access/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'check-email',
    loadComponent: () => import('./account-access/check-email.page').then((m) => m.CheckEmailPage),
  },
  {
    path: 'login',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./account-access/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./account-access/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./account-access/verify-email.page').then((m) => m.VerifyEmailPage),
  },
  { path: 'terms', loadComponent: () => import('./account-access/terms.page').then((m) => m.TermsPage) },
  // Older links.
  { path: 'auth', redirectTo: 'login' },

  // Journey 2: onboarding (ONB-01 to ONB-05)
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },

  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: 'today', loadComponent: () => import('./today/today.page').then((m) => m.TodayPage) },
      { path: 'food', loadComponent: () => import('./food/food.page').then((m) => m.FoodPage) },
      { path: 'health', loadComponent: () => import('./my-health/health.page').then((m) => m.HealthPage) },
      {
        path: 'appointment',
        loadComponent: () => import('./appointment/appointment.page').then((m) => m.AppointmentPage),
      },
      { path: '', redirectTo: 'today', pathMatch: 'full' },
    ],
  },

  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./account/account.page').then((m) => m.AccountPage),
  },

  // Journeys 4 and 5: report and diagnosis (RPT-01 to RPT-04, HLT-02, HLT-03)
  {
    path: 'health/report/new',
    canActivate: [authGuard],
    loadComponent: () => import('./my-health/report/report-source.page').then((m) => m.ReportSourcePage),
  },
  {
    path: 'health/report/capture',
    canActivate: [authGuard],
    loadComponent: () => import('./my-health/report/report-capture.page').then((m) => m.ReportCapturePage),
  },
  {
    path: 'health/report/check',
    canActivate: [authGuard],
    loadComponent: () => import('./my-health/report/report-check.page').then((m) => m.ReportCheckPage),
  },
  {
    path: 'health/report/:id/saved',
    canActivate: [authGuard],
    loadComponent: () => import('./my-health/report/report-saved.page').then((m) => m.ReportSavedPage),
  },
  {
    path: 'health/details',
    canActivate: [authGuard],
    loadComponent: () => import('./my-health/report/report-details.page').then((m) => m.ReportDetailsPage),
  },
  {
    path: 'health/question/:key',
    canActivate: [authGuard],
    loadComponent: () => import('./my-health/report/suggested-question.page').then((m) => m.SuggestedQuestionPage),
  },
  {
    path: 'health/reports',
    canActivate: [authGuard],
    loadComponent: () => import('./my-health/report/reports.page').then((m) => m.ReportsPage),
  },

  // Journey 6: symptoms (SYM-01 to SYM-04)
  {
    path: 'health/check-in/:date',
    canActivate: [authGuard],
    loadComponent: () => import('./my-health/symptoms/check-in.page').then((m) => m.CheckInPage),
  },
  {
    path: 'health/symptoms',
    canActivate: [authGuard],
    data: { healthView: 'symptoms' },
    loadComponent: () => import('./my-health/health.page').then((m) => m.HealthPage),
  },
  {
    path: 'health/symptoms/summary',
    canActivate: [authGuard],
    data: { healthView: 'symptoms' },
    loadComponent: () => import('./my-health/health.page').then((m) => m.HealthPage),
  },
  {
    path: 'health/results',
    canActivate: [authGuard],
    loadComponent: () => import('./my-health/symptoms/results.page').then((m) => m.ResultsPage),
  },
  {
    path: 'health/backup',
    canActivate: [authGuard],
    loadComponent: () => import('./my-health/backup/backup.page').then((m) => m.BackupPage),
  },
  {
    path: 'learn/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./evidence/evidence-explanation.page').then((m) => m.EvidenceExplanationPage),
  },

  // Journey 8: appointment (APT-02, APT-03)
  {
    path: 'appointment/answer/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./appointment/record-answer.page').then((m) => m.RecordAnswerPage),
  },
  {
    path: 'appointment/next-step',
    canActivate: [authGuard],
    loadComponent: () => import('./appointment/next-step.page').then((m) => m.NextStepPage),
  },

  // Journey 7: food (FOOD-01A to FOOD-04)
  {
    path: 'food/requirements',
    canActivate: [authGuard],
    loadComponent: () => import('./food/requirements.page').then((m) => m.RequirementsPage),
  },
  {
    path: 'food/plan',
    canActivate: [authGuard],
    loadComponent: () => import('./food/plan.page').then((m) => m.PlanPage),
  },
  {
    path: 'food/swap/:date',
    canActivate: [authGuard],
    loadComponent: () => import('./food/swap.page').then((m) => m.SwapPage),
  },
  {
    path: 'food/find',
    canActivate: [authGuard],
    loadComponent: () => import('./food/find-meal.page').then((m) => m.FindMealPage),
  },
  {
    path: 'food/recipe/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./food/recipe.page').then((m) => m.RecipePage),
  },
  {
    path: 'food/claims',
    canActivate: [authGuard],
    loadComponent: () => import('./food/food-claims.page').then((m) => m.FoodClaimsPage),
  },

  // Journey 9: internal evidence catalogue (EVC-01, EVC-02)
  {
    path: 'internal/evidence',
    canActivate: [evidenceEditorGuard],
    loadComponent: () => import('./evidence/internal/catalog.page').then((m) => m.CatalogPage),
  },
  {
    path: 'internal/evidence/:id',
    canActivate: [evidenceEditorGuard],
    loadComponent: () => import('./evidence/internal/catalog-entry.page').then((m) => m.CatalogEntryPage),
  },

  { path: '**', redirectTo: 'welcome' },
];
