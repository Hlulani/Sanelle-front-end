import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { AuthShellPage } from './auth/auth-shell.page';

export const routes: Routes = [
  {
    path: 'health/steps',
    loadComponent: () => import('./my-health/steps/steps.page').then((m) => m.StepsPage),
    canActivate: [authGuard],
  },
  {
    path: 'health/reports',
    loadComponent: () => import('./my-health/reports/reports.page').then((m) => m.ReportsPage),
    canActivate: [authGuard],
  },
  {
    path: 'health/backup',
    loadComponent: () => import('./my-health/backup/backup.page').then((m) => m.BackupPage),
    canActivate: [authGuard],
  },
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'welcome', loadComponent: () => import('./welcome/welcome.page').then((m) => m.WelcomePage) },
  { path: 'auth', component: AuthShellPage },
  {
    path: 'health/report',
    loadComponent: () => import('./my-health/report/report.page').then((m) => m.ReportPage),
    canActivate: [authGuard],
  },
  {
    path: 'health/record/:key',
    loadComponent: () => import('./my-health/record/record.page').then((m) => m.RecordPage),
    canActivate: [authGuard],
  },
  {
    path: 'nourish/quick',
    loadComponent: () => import('./nourish/quick-meals/quick-meals.page').then((m) => m.QuickMealsPage),
    canActivate: [authGuard],
  },
  {
    path: 'health/recorded',
    loadComponent: () => import('./my-health/recorded/recorded.page').then((m) => m.RecordedPage),
    canActivate: [authGuard],
  },
  {
    path: 'health/questions',
    loadComponent: () => import('./my-health/questions/questions.page').then((m) => m.QuestionsPage),
    canActivate: [authGuard],
  },
  {
    path: 'health/symptoms',
    loadComponent: () => import('./my-health/symptoms/symptom-timeline.page').then((m) => m.SymptomTimelinePage),
    canActivate: [authGuard],
  },
  {
    path: 'health/symptoms/log/:date',
    loadComponent: () => import('./my-health/symptoms/symptom-log.page').then((m) => m.SymptomLogPage),
    canActivate: [authGuard],
  },
  {
    path: 'health/visit',
    loadComponent: () => import('./my-health/visit/visit.page').then((m) => m.VisitPage),
    canActivate: [authGuard],
  },
  {
    path: 'health/summary',
    loadComponent: () => import('./my-health/summary-page/summary.page').then((m) => m.SummaryPage),
    canActivate: [authGuard],
  },
  {
    path: 'learn/:id',
    loadComponent: () => import('./learn/food-clarity/food-clarity.page').then((m) => m.FoodClarityPage),
    canActivate: [authGuard],
  },

  // Put meal-details BEFORE ** and (optionally) guard it
  {
    path: 'meal-details/:id',
    loadComponent: () => import('./pages/meal-details/meal-details.page').then((m) => m.MealDetailsPage),
    canActivate: [authGuard],
  },

  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [authGuard],
    children: [
      { path: 'today', loadComponent: () => import('./today/today.page').then((m) => m.TodayPage) },
      { path: 'health', loadComponent: () => import('./my-health/health/health.page').then((m) => m.HealthPage) },
      { path: 'tab2', loadComponent: () => import('./tab2/tab2.page').then((m) => m.Tab2Page) },
      { path: 'tab3', loadComponent: () => import('./tab3/tab3.page').then((m) => m.Tab3Page) },
      { path: 'learn', loadComponent: () => import('./learn/learn/learn.page').then((m) => m.LearnPage) },
      { path: 'account', loadComponent: () => import('./account/account.page').then((m) => m.AccountPage) },
      { path: '', redirectTo: 'today', pathMatch: 'full' },
    ],
  },

  {
    path: 'onboarding',
    loadComponent: () => import('./auth/components/onboarding/onboarding.page').then((m) => m.OnboardingPage),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'welcome' },
];
