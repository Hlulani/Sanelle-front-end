import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { filter, take } from 'rxjs';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  async ngOnInit(): Promise<void> {
    // The splash in index.html stays until the first screen is in place, then fades.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => hideSplash());
    await this.auth.restoreSession();
  }

  /**
   * The browser's back can restore an earlier copy of the app from memory, still holding the
   * session it had then (possibly another account's). Reload so it reads the current one.
   */
  @HostListener('window:pageshow', ['$event'])
  onPageShow(event: PageTransitionEvent): void {
    if (event.persisted) window.location.reload();
  }
}

function hideSplash(): void {
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.classList.add('is-done');
  const remove = () => splash.remove();
  splash.addEventListener('transitionend', remove, { once: true });
  setTimeout(remove, 400); // in case the transition never runs, e.g. with reduced motion
}
