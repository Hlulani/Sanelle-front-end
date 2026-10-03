import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonCheckbox } from '@ionic/angular/standalone';
import { PlanStoreService } from '../core/services/plan-store.service';
import { MealService } from '../core/services/meal.service';
import { AuthService } from '../core/auth/auth.service';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GenerateMealPlanResponse, MealPlanItem } from '../core/services/meal-plans.service';
import { MealResponse } from '../core/models/meal.model';
import {
  AisleItem,
  ShoppingWindow,
  WINDOW_LABELS,
  WINDOW_SUBTITLES,
  byAisle,
  byMeal,
  haveKey,
  slotsInWindow,
} from './grocery-list';

type View = 'aisle' | 'meal';

const MEAL_TYPE_LABELS: Record<MealPlanItem['mealType'], string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

const GROUP_ORDER = ['Produce', 'Meat', 'Seafood', 'Eggs', 'Dairy', 'Grains', 'Legumes', 'Nuts & Seeds', 'Condiments', 'Spices & Herbs', 'Sweeteners', 'Other'];

function localIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [CommonModule, IonContent, IonButton, IonCheckbox],
})
export class Tab3Page implements OnInit {
  private planStore = inject(PlanStoreService);
  private mealService = inject(MealService);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly windows: ShoppingWindow[] = ['three', 'week', 'all'];
  readonly windowLabels = WINDOW_LABELS;
  readonly mealTypeLabels = MEAL_TYPE_LABELS;

  plan = signal<GenerateMealPlanResponse | null>(null);
  readonly window = signal<ShoppingWindow>('week');
  readonly view = signal<View>('aisle');
  /** Ingredient keys she already has. Shared by both views: ticking chickpeas in one meal ticks them everywhere. */
  checkedItems = signal<Set<string>>(new Set());
  isLoading = signal(false);
  error = signal<string | null>(null);

  private readonly meals = signal<Map<string, MealResponse>>(new Map());
  private readonly today = localIsoDate(new Date());

  readonly slots = computed(() => {
    const plan = this.plan();
    return plan ? slotsInWindow(plan, this.window(), this.today) : [];
  });
  readonly items = computed<AisleItem[]>(() => byAisle(this.slots(), this.meals()));
  readonly mealGroups = computed(() => byMeal(this.slots(), this.meals()));
  readonly subtitle = computed(() => WINDOW_SUBTITLES[this.window()]);

  ngOnInit() {
    this.planStore.plan$.subscribe((plan) => {
      this.plan.set(plan);
      this.checkedItems.set(new Set());
      if (plan) this.loadMissingMeals();
    });
  }

  setWindow(w: ShoppingWindow) {
    this.window.set(w);
    this.loadMissingMeals();
  }

  /** Fetches only meals in the window that haven't been loaded yet. */
  private loadMissingMeals() {
    if (!this.authService.hasValidToken()) {
      this.error.set('Login required to build your grocery list.');
      return;
    }
    const known = this.meals();
    const missing = [...new Set(this.slots().map((s) => s.mealId))].filter((id) => !known.has(id));
    if (!missing.length) return;

    this.isLoading.set(true);
    this.error.set(null);
    forkJoin(missing.map((id) => this.mealService.getMealById(id).pipe(catchError(() => of(null))))).subscribe({
      next: (loaded) => {
        const next = new Map(this.meals());
        loaded.filter((m): m is MealResponse => !!m).forEach((m) => next.set(m.id, m));
        this.meals.set(next);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load grocery list.');
        this.isLoading.set(false);
      },
    });
  }

  isChecked(name: string): boolean {
    return this.checkedItems().has(haveKey(name));
  }

  toggleChecked(name: string, checked: boolean) {
    const set = new Set(this.checkedItems());
    if (checked) set.add(haveKey(name));
    else set.delete(haveKey(name));
    this.checkedItems.set(set);
  }

  visibleItems(): AisleItem[] {
    return this.items().filter((item) => !this.isChecked(item.name));
  }

  allChecked(): boolean {
    return this.items().length > 0 && this.visibleItems().length === 0;
  }

  resetChecked() {
    this.checkedItems.set(new Set());
  }

  amountLine(item: AisleItem): string {
    const amounts = item.amounts.length ? item.amounts.join(', ') : 'Quantity varies';
    return item.mealCount > 1 ? `${amounts} · for ${item.mealCount} meals` : amounts;
  }

  /** "Today", "Tomorrow" or "Mon 5". */
  dayLabel(iso: string): string {
    if (iso === this.today) return 'Today';
    const tomorrow = new Date(this.today + 'T00:00:00');
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (iso === localIsoDate(tomorrow)) return 'Tomorrow';
    return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric' }).format(new Date(iso + 'T00:00:00'));
  }

  mealDone(ingredients: { name: string }[]): boolean {
    return ingredients.length > 0 && ingredients.every((i) => this.isChecked(i.name));
  }

  groupedItems(): { group: string; items: AisleItem[] }[] {
    const groups = new Map<string, AisleItem[]>();
    this.visibleItems().forEach((item) => {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group)?.push(item);
    });
    return Array.from(groups.entries())
      .map(([group, items]) => ({ group, items: items.sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
  }

  totalItems(): number {
    return this.items().length;
  }

  checkedCount(): number {
    return this.items().filter((i) => this.isChecked(i.name)).length;
  }

  groupCount(): number {
    return this.groupedItems().length;
  }

  progressPercent(): number {
    const total = this.totalItems();
    return total ? Math.round((this.checkedCount() / total) * 100) : 0;
  }

  trackSlot(_: number, m: { slot: { key: string } }): string {
    return m.slot.key;
  }

  goToPlan() {
    this.router.navigateByUrl('/tabs/tab2');
  }
}
