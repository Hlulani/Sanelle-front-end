import { bootstrapApplication } from '@angular/platform-browser';
import { inject, provideAppInitializer } from '@angular/core';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { authInterceptor } from './app/core/auth/auth.interceptor';
import { AuthService } from './app/core/auth/auth.service';
import { PlanStoreService } from './app/core/services/plan-store.service';
import { NotificationService } from './app/core/services/notification.service';
import { registerAppIcons } from './app/core/icons';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

registerAppIcons();

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Page transitions are movement for its own sake; skip them for people who ask for less motion.
    provideIonicAngular({ animated: !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches }),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Hydrates AuthService's in-memory token cache and the last-generated meal
    // plan from Preferences before the router/first tab renders — otherwise a
    // returning user would be bounced to /auth, or see an empty plan and have
    // to regenerate one that's already sitting in storage.
    provideAppInitializer(async () => {
      // inject() must run synchronously, before any `await` — otherwise it's called
      // outside the injection context (NG0203). Resolve everything up front.
      const authService = inject(AuthService);
      const planStore = inject(PlanStoreService);
      const notifications = inject(NotificationService);

      await Promise.all([authService.init(), planStore.init()]);
      // Reschedules only if the user already opted in — reads the just-hydrated plan
      // state above, so a returning user's "time to cook" reminder reflects reality.
      await notifications.reschedule();
    }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
