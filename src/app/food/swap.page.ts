import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { PlanEditor } from './plan-editor.service';
import { FoodProfileService } from './food-profile.service';
import {
  applySwap,
  groceryChanges,
  RankedOption,
  scopeDates,
  SCOPE_LABELS,
  SwapScope,
  swapConfirmation,
  TIER_LABELS,
} from './meal-plan';
import { MealImageComponent } from '../shared/components/meal-image/meal-image.component';
import { messageFor } from '../core/errors/errors';

/** FOOD-03A/B/C: choose, review scope, then confirm the actual grocery changes. */
@Component({
  selector: 'app-swap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FigmaFrameComponent, IonContent, FormsModule, RouterLink, MealImageComponent],
  template: `
    <ion-content
      ><app-figma-frame active="food" title="Swap this meal" label="Food"
        ><div class="visit-paper source-extension">
          <div class="section-title"><a class="text-action" routerLink="/food/plan">My plan</a></div>
          <header class="section-title source-extension-heading">
            <p class="eyebrow">
              {{
                step() === 'choose'
                  ? 'Choose a replacement'
                  : step() === 'scope'
                    ? 'Choose where to swap'
                    : 'Review before saving'
              }}
            </p>
            <h1>
              {{
                step() === 'choose' ? 'Swap this meal' : step() === 'scope' ? 'Which days?' : 'Your shopping changes'
              }}
            </h1>
            <p class="source-extension-intro">
              {{ date }}{{ day()?.meal ? ' · replacing ' + day()?.meal?.name : ' · open day' }}
            </p>
          </header>
          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }
          @if (busy()) {
            <p role="status">Loading meals that fit…</p>
          }
          @if (!busy() && !day()) {
            <div class="paper-section">
              <p>This day isn’t in your plan.</p>
              <a class="primary" routerLink="/food/plan">Open my plan</a>
            </div>
          } @else if (step() === 'choose') {
            <label class="source-field answer-form"
              ><span>Find a replacement</span
              ><input
                name="search"
                [ngModel]="search()"
                (ngModelChange)="search.set($event)"
                placeholder="Meal name or ingredient"
            /></label>
            @for (g of groups(); track g.tier) {
              <section class="paper-section">
                <h2>{{ tiers[g.tier] }}</h2>
                @for (o of g.options; track o.meal.mealId) {
                  <article class="option saved-answer">
                    <app-meal-image [name]="o.meal.name" [imageUrl]="o.meal.imageUrl"></app-meal-image>
                    <h3>{{ o.meal.name }}</h3>
                    <p class="fine-print">
                      {{ o.meal.prepTimeMinutes ?? '—' }} min · {{ plan()?.servings }} servings ·
                      {{ o.batchFriendly ? 'Suits leftovers' : 'Leftover suitability not recorded' }}
                    </p>
                    <p>{{ o.why.join(' · ') || 'Fits your stated requirements' }}</p>
                    @for (line of o.conflict.lines; track line) {
                      <p class="fine-print">{{ line }}</p>
                    }
                    <span class="status-chip" [class.needs-checking]="o.conflict.state !== 'clear'">{{
                      o.conflict.state === 'clear' ? 'Check ingredient labels' : 'Needs your review'
                    }}</span>
                    <div class="review-actions">
                      <button class="primary" type="button" (click)="choose(o)">Choose this meal</button
                      ><button class="primary secondary" type="button" (click)="favourite(o)">
                        {{ profile().favourites.includes(o.meal.mealId) ? 'Remove favourite' : 'Save as favourite' }}
                      </button>
                    </div>
                    <details>
                      <summary>My preferences for this meal</summary>
                      <div class="review-actions">
                        <button class="primary secondary" type="button" (click)="more(o)">
                          Show more meals like this</button
                        ><button class="primary secondary" type="button" (click)="fewer(o)">
                          Show fewer meals like this</button
                        ><button class="primary secondary" type="button" (click)="never(o)">Do not suggest again</button
                        ><a class="text-action" [routerLink]="['/food/recipe', o.meal.mealId]"
                          >Like this meal but not an ingredient?</a
                        >
                      </div>
                    </details>
                  </article>
                }
              </section>
            } @empty {
              @if (!busy() && day()) {
                <div class="paper-section">
                  <p>No meals match this search and your requirements.</p>
                  <button class="primary secondary" type="button" (click)="search.set('')">Clear search</button
                  ><a routerLink="/food/requirements">Review requirements</a>
                </div>
              }
            }
          } @else if (selected(); as o) {
            <section class="paper-section">
              <h2>{{ o.meal.name }}</h2>
              <p>{{ o.meal.prepTimeMinutes ?? '—' }} min · {{ plan()?.servings }} servings</p>
            </section>
            @if (step() === 'scope') {
              <section class="paper-section">
                <h2>Apply this replacement to</h2>
                @for (s of scopes; track s) {
                  <button
                    class="scope source-choice"
                    type="button"
                    [attr.aria-pressed]="scope() === s"
                    [class.selected]="scope() === s"
                    (click)="scope.set(s)"
                  >
                    <strong>{{ scopeLabels[s] }}</strong
                    ><span>{{ datesFor(s).length }} {{ datesFor(s).length === 1 ? 'day' : 'days' }}</span>
                  </button>
                }
                <button type="button" class="primary" (click)="step.set('confirm')">Review shopping changes</button>
              </section>
            } @else {
              <section class="paper-section">
                <h2>{{ scopeLabels[scope()] }}</h2>
                <p>{{ changingDates().join(' · ') }}</p>
                @for (c of changes(); track c.week) {
                  <article class="paper-section">
                    <h3>{{ c.label }} · {{ plan()?.servings }} servings</h3>
                    <p><strong>Added:</strong> {{ c.added.join(', ') || 'None' }}</p>
                    <p><strong>Removed:</strong> {{ c.removed.join(', ') || 'None' }}</p>
                    <p><strong>Retained for other meals:</strong> {{ c.retained.join(', ') || 'None' }}</p>
                    @for (u of c.updated; track u.name) {
                      <p class="fine-print">
                        {{ u.name }}: {{ u.before || 'amount not stated' }} → {{ u.after || 'amount not stated' }}
                      </p>
                    }
                  </article>
                } @empty {
                  <p>The shopping list has no ingredient changes.</p>
                }
                <button type="button" class="primary" [disabled]="busy()" (click)="confirm()">
                  Confirm swap and shopping changes</button
                ><button type="button" class="primary secondary" (click)="step.set('scope')">Change scope</button>
              </section>
            }
            <button type="button" class="primary secondary" (click)="step.set('choose')">
              Choose a different meal
            </button>
          }
          <p class="fine-print footer">
            Strict exclusions override favourites. Check product labels and cross-contamination information; Sanelle
            cannot guarantee allergen-free ingredients or preparation.
          </p>
        </div></app-figma-frame
      ></ion-content
    >
  `,
})
export class SwapPage {
  private readonly editor = inject(PlanEditor);
  private readonly food = inject(FoodProfileService);
  private readonly router = inject(Router);
  readonly date = inject(ActivatedRoute).snapshot.paramMap.get('date') ?? '';
  readonly plan = this.editor.plan;
  readonly profile = this.food.profile;
  readonly day = computed(() => this.plan()?.days.find((d) => d.date === this.date));
  readonly options = signal<RankedOption[]>([]);
  readonly search = signal('');
  readonly selected = signal<RankedOption | null>(null);
  readonly step = signal<'choose' | 'scope' | 'confirm'>('choose');
  readonly scope = signal<SwapScope>('day');
  readonly scopes: SwapScope[] = ['day', 'week', 'plan'];
  readonly scopeLabels = SCOPE_LABELS;
  readonly tiers = TIER_LABELS;
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly groups = computed(() => {
    const query = this.search().trim().toLowerCase();
    const eligible = this.options().filter(
      (o) =>
        !this.profile().neverSuggest.includes(o.meal.mealId) &&
        (!query ||
          o.meal.name.toLowerCase().includes(query) ||
          (this.editor.recipes().get(o.meal.mealId)?.ingredients ?? []).some((i) =>
            i.name.toLowerCase().includes(query),
          )),
    );
    return (['favourite', 'planned-before', 'preference', 'other'] as const)
      .map((tier) => ({ tier, options: eligible.filter((o) => o.tier === tier) }))
      .filter((g) => g.options.length);
  });
  readonly changingDates = computed(() => this.datesFor(this.scope()));
  readonly replacement = computed(() =>
    this.plan() && this.selected() ? applySwap(this.plan()!, this.changingDates(), this.selected()!.meal) : null,
  );
  readonly changes = computed(() =>
    this.plan() && this.replacement()
      ? groceryChanges(this.plan()!, this.replacement()!, this.editor.recipes(), this.day()?.meal?.mealId ?? '')
      : [],
  );
  async ionViewWillEnter() {
    await this.run(async () => {
      await this.editor.load();
      this.options.set(await this.editor.options());
      const meal = this.requestedMeal;
      const option = this.options().find((o) => o.meal.mealId === meal);
      if (option) this.choose(option);
    });
  }
  private readonly requestedMeal = inject(ActivatedRoute).snapshot.queryParamMap.get('meal');
  datesFor(scope: SwapScope): string[] {
    const p = this.plan();
    return p && this.day()?.meal ? scopeDates(p, this.date)[scope] : this.day() ? [this.date] : [];
  }
  choose(option: RankedOption) {
    this.selected.set(option);
    this.scope.set('day');
    this.step.set('scope');
  }
  favourite(o: RankedOption) {
    void this.run(async () => {
      await this.food.toggleFavourite(o.meal.mealId);
      this.options.set(await this.editor.options());
    });
  }
  more(o: RankedOption) {
    void this.run(() => this.food.moreLikeThis(o.meal.mealId));
  }
  fewer(o: RankedOption) {
    void this.run(() => this.food.fewerLikeThis(o.meal.mealId));
  }
  never(o: RankedOption) {
    void this.run(() => this.food.dontSuggest(o.meal.mealId));
  }
  async confirm() {
    await this.run(async () => {
      const next = this.replacement();
      const plan = this.plan();
      if (!next || !plan || !this.changingDates().length) return;
      const notice = swapConfirmation(plan, this.changes());
      await this.editor.swapDays(next.days);
      await this.router.navigate(['/food/plan'], { queryParams: { swapped: notice } });
    });
  }
  private async run(action: () => Promise<void>) {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
    } catch (e) {
      this.error.set(messageFor(e, 'This change couldn’t be saved. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }
}
