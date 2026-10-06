import { ChangeDetectionStrategy, Component, HostListener, inject, OnInit } from '@angular/core';
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

  async ngOnInit(): Promise<void> {
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
