import { bootstrapApplication } from '@angular/platform-browser';
import { inject, provideAppInitializer } from '@angular/core';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { authInterceptor } from './app/core/auth/auth.interceptor';
import { AuthService } from './app/core/auth/auth.service';
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
    // Hydrates the in-memory session from Preferences before the router runs its guards,
    // otherwise a returning person would be sent to Log in.
    provideAppInitializer(() => inject(AuthService).init()),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
