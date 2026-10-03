import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { AuthShellPage } from './auth/auth-shell.page';


export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'welcome', loadComponent: () => import('./welcome/welcome.page').then(m => m.WelcomePage) },
  { path: 'auth', component: AuthShellPage },
  {
    path: 'health/record/:key',
    loadComponent: () => import('./my-health/record/record.page').then(m => m.RecordPage),
    canActivate: [authGuard],
  },
  {
    path: 'health/questions',
    loadComponent: () => import('./my-health/questions/questions.page').then(m => m.QuestionsPage),
    canActivate: [authGuard],
  },
  {
    path: 'health/symptoms',
    loadComponent: () => import('./my-health/symptoms/symptom-timeline.page').then(m => m.SymptomTimelinePage),
    canActivate: [authGuard],
  },
  {
    path: 'health/symptoms/log/:date',
    loadComponent: () => import('./my-health/symptoms/symptom-log.page').then(m => m.SymptomLogPage),
    canActivate: [authGuard],
  },
  {
    path: 'health/summary',
    loadComponent: () => import('./my-health/summary-page/summary.page').then(m => m.SummaryPage),
    canActivate: [authGuard],
  },
  {
    path: 'learn/:id',
    loadComponent: () => import('./learn/food-clarity/food-clarity.page').then(m => m.FoodClarityPage),
    canActivate: [authGuard],
  },

  // Put meal-details BEFORE ** and (optionally) guard it
  {
    path: 'meal-details/:id',
    loadComponent: () => import('./pages/meal-details/meal-details.page').then(m => m.MealDetailsPage),
    canActivate: [authGuard],
  },

  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [authGuard],
    children: [
      { path: 'today', loadComponent: () => import('./today/today.page').then(m => m.TodayPage) },
      { path: 'health', loadComponent: () => import('./my-health/health/health.page').then(m => m.HealthPage) },
      { path: 'tab2', loadComponent: () => import('./tab2/tab2.page').then(m => m.Tab2Page) },
      { path: 'tab3', loadComponent: () => import('./tab3/tab3.page').then(m => m.Tab3Page) },
      { path: 'account', loadComponent: () => import('./account/account.page').then(m => m.AccountPage) },
      { path: '', redirectTo: 'today', pathMatch: 'full' },
    ],
  },

  {
    path: 'auth-shell',
    loadComponent: () => import('./auth/auth-shell.page').then( m => m.AuthShellPage)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./auth/components/onboarding/onboarding.page').then( m => m.OnboardingPage),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'welcome' },
];
