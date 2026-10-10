import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular/standalone';

/** Patient navigation: Today, Food, My health and Appointment. Nothing internal appears here. */
@Component({
  selector: 'app-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonRouterOutlet],
  template: '<ion-router-outlet [animated]="false"></ion-router-outlet>',
})
export class TabsPage {}
