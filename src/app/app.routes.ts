import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { AuthShellPage } from './auth/auth-shell.page';


export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'auth', component: AuthShellPage },

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
      { path: 'tab2', loadComponent: () => import('./tab2/tab2.page').then(m => m.Tab2Page) },
      { path: 'tab3', loadComponent: () => import('./tab3/tab3.page').then(m => m.Tab3Page) },
      { path: 'account', loadComponent: () => import('./account/account.page').then(m => m.AccountPage) },
      { path: '', redirectTo: 'tab2', pathMatch: 'full' },
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
  { path: '**', redirectTo: 'auth' },
];
