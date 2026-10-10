import { FoodPathsComponent } from './food-paths.component';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { FlexibleRecipeComponent } from './flexible-recipe.component';
@Component({
  selector: 'app-recipe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FoodPathsComponent, IonContent, FigmaFrameComponent, FlexibleRecipeComponent],
  template: `<ion-content
    ><app-figma-frame active="food" title="Food, without the fear" label="Food"
      ><app-food-paths /><app-flexible-recipe [id]="id" [date]="date" /></app-figma-frame
  ></ion-content>`,
})
export class RecipePage {
  private readonly route = inject(ActivatedRoute);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly date = this.route.snapshot.queryParamMap.get('date');
}
