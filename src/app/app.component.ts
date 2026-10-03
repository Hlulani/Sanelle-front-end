import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);

  async ngOnInit(): Promise<void> {
    await this.auth.restoreSession();
  }
}
