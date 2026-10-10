import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { FoodProfileService } from './food-profile.service';
/** The unchanged Food introduction and three path controls from Figma Make. */
@Component({
  selector: 'app-food-paths',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="food-intro">
      <div>
        <p class="eyebrow">A calmer approach</p>
        <h2>No banned lists. Just practical choices.</h2>
        <p>
          Check confusing advice, find meals you can adapt, or plan what to cook. Food here supports general
          wellbeing—it is not a fibroid treatment.
        </p>
      </div>
    </section>
    <section class="food-paths" aria-label="Choose what you want to do with food">
      <button [class.selected]="active() === 'claims'" (click)="claim()">
        <span>01</span><strong>Check food advice</strong><small>See what evidence can tell us</small></button
      ><button [class.selected]="active() === 'meals'" (click)="meals()">
        <span>02</span><strong>Find something to cook</strong><small>Flexible recipes and swaps</small></button
      ><button [class.selected]="active() === 'plan'" (click)="plan()">
        <span>03</span><strong>Plan meals & groceries</strong><small>Servings, ingredients and a list</small>
      </button>
    </section>`,
})
export class FoodPathsComponent {
  readonly active = input('meals');
  private readonly router = inject(Router);
  private readonly food = inject(FoodProfileService);
  claim() {
    void this.router.navigate(['/learn/C17'], { queryParams: { from: 'food' } });
  }
  meals() {
    void this.router.navigateByUrl('/food/find');
  }
  plan() {
    void this.router.navigateByUrl(this.food.reviewed() ? '/food/plan' : '/food/requirements');
  }
}
