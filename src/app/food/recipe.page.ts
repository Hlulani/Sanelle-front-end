import { FoodPathsComponent } from './food-paths.component';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
      ><app-food-paths /><app-flexible-recipe
        #recipe
        [id]="id()"
        [date]="date()"
        [initialStage]="initialStage()"
        (loaded)="showPreparation()" /></app-figma-frame
  ></ion-content>`,
})
export class RecipePage {
  @ViewChild(IonContent) private content?: IonContent;
  @ViewChild(FlexibleRecipeComponent) private recipeComponent?: FlexibleRecipeComponent;
  @ViewChild('recipe', { read: ElementRef }) private recipe?: ElementRef<HTMLElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly id = computed(() => this.params().get('id') ?? '');
  readonly date = computed(() => this.query().get('date'));
  readonly initialStage = computed(() =>
    this.query().get('stage') === 'cook' ? ('cook' as const) : ('plan' as const),
  );

  ionViewDidEnter() {
    // Ionic keeps pages alive; reopening a saved meal must restore Prepare even after viewing Plan.
    this.recipeComponent?.showStage(this.initialStage());
    this.showPreparation();
  }

  showPreparation() {
    if (this.initialStage() !== 'cook') return;
    requestAnimationFrame(async () => {
      const target = this.recipe?.nativeElement.querySelector('.cooking-steps');
      if (!target || !this.content) return;
      const scroll = await this.content.getScrollElement();
      await this.content.scrollToPoint(0, scroll.scrollTop + target.getBoundingClientRect().top - 20, 0);
    });
  }
}
