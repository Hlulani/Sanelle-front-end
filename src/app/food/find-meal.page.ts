import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { PlanEditor } from './plan-editor.service';
import { RankedOption } from './meal-plan';
import { MealImageComponent } from '../shared/components/meal-image/meal-image.component';
import { messageFor } from '../core/errors/errors';

@Component({
  selector: 'app-find-meal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FigmaFrameComponent, IonContent, FormsModule, RouterLink, MealImageComponent],
  template: `<ion-content
    ><app-figma-frame active="food" title="Find a meal" label="Food"
      ><div class="visit-paper source-extension">
        <div class="section-title">
          <a class="text-action" routerLink="/tabs/food">Food</a><a routerLink="/food/requirements">My requirements</a>
        </div>
        <header class="section-title source-extension-heading">
          <h1>Find a meal</h1>
          <p class="source-extension-intro">Start with your time, an ingredient, or something you enjoy.</p>
        </header>
        <label class="source-field answer-form"
          ><span>What do you have or feel like?</span
          ><input
            name="search"
            [ngModel]="search()"
            (ngModelChange)="search.set($event)"
            placeholder="e.g. chickpeas, rice, soup"
        /></label>
        <div class="chip-choices" role="group" aria-label="Preparation time">
          @for (t of times; track t.label) {
            <button
              type="button"
              class="source-choice"
              [attr.aria-pressed]="minutes() === t.value"
              [class.selected]="minutes() === t.value"
              (click)="minutes.set(t.value)"
            >
              {{ t.label }}
            </button>
          }
        </div>
        @if (loading()) {
          <p role="status">Finding meals that fit your requirements…</p>
        }
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
          <button type="button" class="primary" (click)="load()">Try again</button>
        }
        <section class="paper-section">
          <h2>{{ matches().length }} meals that fit</h2>
          @for (o of matches(); track o.meal.mealId) {
            <a class="recipe saved-answer" [routerLink]="['/food/recipe', o.meal.mealId]"
              ><app-meal-image [name]="o.meal.name" [imageUrl]="o.meal.imageUrl"></app-meal-image
              ><span
                ><strong>{{ o.meal.name }}</strong
                ><span class="fine-print"
                  >{{ o.meal.prepTimeMinutes ?? 'Time not recorded'
                  }}{{ o.meal.prepTimeMinutes !== null ? ' min' : '' }}</span
                ><span class="fine-print">{{ o.why.join(' · ') || 'Fits your stated requirements' }}</span>
                @if (o.conflict.state !== 'clear') {
                  <span class="status-chip sn-status--needs-checking">Needs your review</span>
                }
              </span></a
            >
          } @empty {
            @if (!loading() && !error()) {
              <div class="paper-section">
                <p>No meals match these choices.</p>
                <button type="button" class="primary secondary" (click)="reset()">Clear time and search</button
                ><a routerLink="/food/requirements">Review my requirements</a>
              </div>
            }
          }
        </section>
      </div></app-figma-frame
    ></ion-content
  >`,
})
export class FindMealPage {
  private readonly editor = inject(PlanEditor);
  readonly options = signal<RankedOption[]>([]);
  readonly search = signal('');
  readonly minutes = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly times = [
    { label: 'Any time', value: null },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
  ];
  readonly matches = computed(() =>
    this.options().filter(
      (o) =>
        (this.minutes() === null || (o.meal.prepTimeMinutes !== null && o.meal.prepTimeMinutes <= this.minutes()!)) &&
        (!this.search().trim() ||
          [o.meal.name, ...(this.editor.recipes().get(o.meal.mealId)?.ingredients ?? []).map((i) => i.name)].some((t) =>
            t.toLowerCase().includes(this.search().trim().toLowerCase()),
          )),
    ),
  );
  ionViewWillEnter() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.options.set(await this.editor.options());
    } catch (e) {
      this.error.set(messageFor(e, 'Meals couldn’t load. Check your connection and try again.'));
    } finally {
      this.loading.set(false);
    }
  }
  reset() {
    this.search.set('');
    this.minutes.set(null);
  }
}
