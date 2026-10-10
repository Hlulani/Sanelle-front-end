import { FoodPathsComponent } from './food-paths.component';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { FigmaIconComponent } from '../shared/design/figma/figma-icon.component';
import { EvidenceService } from '../evidence/evidence.service';
@Component({
  selector: 'app-food-claims',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FoodPathsComponent, IonContent, RouterLink, FigmaFrameComponent, FigmaIconComponent],
  template: `<ion-content
    ><app-figma-frame active="food" title="Food, without the fear" label="Food"
      ><app-food-paths active="claims" />
      <div class="section-title">
        <div>
          <p class="eyebrow">Saved evidence</p>
          <h2>Claims worth unpacking</h2>
        </div>
      </div>
      @for (e of entries; track e.id) {
        <button class="claim-row" [routerLink]="['/learn', e.id]" [queryParams]="{ from: 'food' }">
          <div class="claim-label">
            Food<br /><span>{{ e.claimId }}</span>
          </div>
          <div>
            <strong>{{ e.title }}</strong>
            <p>{{ e.outcome }}</p>
          </div>
          <svg figmaIcon="arrow" />
        </button>
      } @empty {
        <div class="report-empty">
          <strong>Food explanations are being reviewed.</strong>
          <p>Meals and plans are still available to help with everyday cooking.</p>
          <button routerLink="/tabs/food">Choose a food task</button>
        </div>
      }
    </app-figma-frame></ion-content
  >`,
})
export class FoodClaimsPage {
  readonly entries = inject(EvidenceService).publishedIn('food');
}
