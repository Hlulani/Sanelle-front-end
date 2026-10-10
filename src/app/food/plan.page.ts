import { FlexibleRecipeComponent } from './flexible-recipe.component';
import { FoodPathsComponent } from './food-paths.component';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { FigmaIconComponent } from '../shared/design/figma/figma-icon.component';
import { RankedOption } from './meal-plan';
import { PlanEditor } from './plan-editor.service';
import { FoodProfileService } from './food-profile.service';
import { RecipeCatalog } from './recipe-catalog.service';
import {
  GroceryItem,
  HORIZONS,
  Horizon,
  PlanDay,
  formatGroceryAmounts,
  groceryWeeks,
  horizonLabel,
  weekRanges,
} from './meal-plan';
import { MealImageComponent } from '../shared/components/meal-image/meal-image.component';
import { addDays, isIsoDate, localIsoDate, parseLocalDate } from '../shared/calendar-date';
import { messageFor } from '../core/errors/errors';
import { EvidenceService } from '../evidence/evidence.service';

const WEEKDAYS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

/**
 * FOOD-03: one editable main meal per day, or an open day. Planning, preparing and shopping are
 * separate: a prepared tick isn't eating (C44), and shopping lists come one week at a time.
 */
@Component({
  selector: 'app-plan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FlexibleRecipeComponent,
    FoodPathsComponent,
    IonContent,
    FormsModule,
    RouterLink,
    MealImageComponent,
    FigmaFrameComponent,
    FigmaIconComponent,
  ],
  templateUrl: './plan.page.html',
})
export class PlanPage {
  private readonly editor = inject(PlanEditor);
  private readonly food = inject(FoodProfileService);
  private readonly catalog = inject(RecipeCatalog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly evidence = inject(EvidenceService);

  readonly options = signal<RankedOption[]>([]);
  readonly sourceChoices = computed(() => this.options().slice(0, 3));
  async duration(h: Horizon) {
    this.horizon.set(h);
    this.selected.set(null);
    this.week.set(0);
    if (this.plan()) await this.run(() => this.editor.resize(h));
    else if (this.reviewed()) await this.make();
  }
  async chooseDayMeal(o: RankedOption) {
    const day = this.selectedDay();
    if (!day) return;
    if (o.conflict.state !== 'clear') {
      void this.router.navigate(['/food/swap', day.date], { queryParams: { meal: o.meal.mealId } });
      return;
    }
    await this.run(() => this.editor.setMeal(day.date, o.meal));
  }
  readonly horizons = HORIZONS;
  readonly groceryAmounts = formatGroceryAmounts;
  readonly weekdays = WEEKDAYS;
  readonly prepChoices: { label: string; value: number | null }[] = [
    { label: 'Any time', value: null },
    { label: 'Up to 20 min', value: 20 },
    { label: 'Up to 30 min', value: 30 },
    { label: 'Up to 45 min', value: 45 },
  ];
  readonly today = localIsoDate();

  readonly plan = this.editor.plan;
  readonly isDraft = this.editor.isDraft;
  readonly reviewed = this.food.reviewed;
  readonly requirementsChanged = computed(() => {
    const plan = this.plan();
    const profile = this.food.profile();
    if (!plan) return false;
    const sorted = (items: string[]) => [...items].sort().join('|');
    return (
      sorted(plan.madeWith.allergies) !== sorted(profile.allergies) ||
      sorted(plan.madeWith.exclusions) !== sorted(this.food.exclusions()) ||
      plan.madeWith.dietaryPattern !== profile.dietaryPattern
    );
  });
  readonly preparedNote = computed(() => this.evidence.published('C44'));

  // Setup (plan-specific overrides)
  readonly setupOpen = signal(false);
  readonly horizon = signal<Horizon>(3);
  readonly openDays = signal<number[]>([]);
  readonly batch = signal(false);
  readonly maxPrep = signal<number | null>(null);
  readonly servings = signal(1);
  startDate = this.today;

  readonly view = signal<'meals' | 'shopping'>('meals');
  readonly selected = signal<string | null>(null);
  readonly week = signal(0);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  newItem = '';
  newAmount = '';

  readonly weeks = computed(() => {
    const plan = this.plan();
    return plan ? weekRanges(plan) : [];
  });
  readonly lists = computed(() => {
    const plan = this.plan();
    return plan ? groceryWeeks(plan, this.catalog.recipes()) : [];
  });
  readonly list = computed(() => this.lists()[Math.min(this.week(), this.lists().length - 1)] ?? null);
  readonly shoppingItems = computed(() => [
    ...(this.list()?.items ?? []).map((item) => ({ ...item, have: false })),
    ...(this.list()?.have ?? []).map((item) => ({ ...item, have: true })),
  ]);
  readonly groups = computed(() => {
    const map = new Map<string, GroceryItem[]>();
    for (const item of this.list()?.items ?? []) map.set(item.group, [...(map.get(item.group) ?? []), item]);
    return [...map.entries()].map(([group, items]) => ({ group, items }));
  });
  readonly selectedDay = computed(() => {
    const plan = this.plan();
    if (!plan) return null;
    const date = this.selected() ?? (plan.days.some((d) => d.date === this.today) ? this.today : plan.days[0]?.date);
    return plan.days.find((d) => d.date === date) ?? null;
  });
  readonly rangeLabel = computed(() => {
    const days = this.plan()?.days ?? [];
    return days.length ? `${this.short(days[0].date)} to ${this.short(days[days.length - 1].date)}` : '';
  });
  readonly preparedCount = computed(() => (this.plan()?.days ?? []).filter((d) => d.preparedAt).length);
  readonly mealDays = computed(() => (this.plan()?.days ?? []).filter((d) => d.meal).length);

  async ionViewWillEnter() {
    await this.editor.load();
    if (this.plan()) this.horizon.set(this.plan()!.horizon);
    const p = this.food.profile();
    this.servings.set(p.household);
    this.batch.set(p.practical.includes('batch'));
    this.maxPrep.set(p.practical.includes('quick') ? 30 : null);
    const params = this.route.snapshot.queryParamMap;
    const servings = Number(params.get('servings'));
    if (Number.isInteger(servings) && servings >= 1 && servings <= 12) this.servings.set(servings);
    if (params.get('swapped')) this.notice.set(params.get('swapped'));
    this.setupOpen.set((!this.plan() || params.get('new') === '1') && !this.isDraft());
    this.busy.set(true);
    try {
      this.options.set(await this.editor.options());
      if (this.reviewed() && this.setupOpen()) await this.make();
    } catch (e) {
      this.error.set(messageFor(e, 'Meals couldn’t load. Please try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  toggleOpenDay(day: number) {
    this.openDays.update((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]));
  }

  async make() {
    if (!Number.isInteger(this.servings()) || this.servings() < 1 || this.servings() > 12) {
      this.error.set('Choose a whole number of people, from 1 to 12.');
      return;
    }
    if (!isIsoDate(this.startDate) || this.startDate < this.today) {
      this.error.set('Choose today or a later start date.');
      return;
    }
    if (this.openDays().length === 7) {
      this.error.set('Leave at least one day with a meal.');
      return;
    }
    await this.run(async () => {
      await this.editor.build(
        {
          horizon: this.horizon(),
          startDate: this.startDate,
          servings: this.servings(),
          openWeekdays: this.openDays(),
          batch: this.batch(),
        },
        this.maxPrep(),
      );
      const requested = this.route.snapshot.queryParamMap.get('meal');
      if (requested) {
        const option = (await this.editor.options(this.maxPrep())).find((o) => o.meal.mealId === requested);
        const day = this.plan()?.days.find((d) => d.meal);
        if (option && day) await this.editor.setMeal(day.date, option.meal);
        if (option && day) {
          const edits = this.food.recipeShoppingFor(requested);
          await this.editor.editGroceries(0, () => edits);
        }
      }
      this.setupOpen.set(false);
      this.selected.set(null);
      this.week.set(0);
      this.view.set('meals');
      this.notice.set(null);
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { new: null, meal: null, servings: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  readonly canUndoSwap = this.editor.canUndoSwap;
  async undoSwap() {
    await this.run(async () => {
      await this.editor.undoLastSwap();
      this.notice.set('Swap undone. Your previous meals and groceries are restored.');
    });
  }
  async savePlan() {
    await this.run(async () => {
      await this.editor.saveDraft();
      await this.router.navigate(['/tabs/today'], { queryParams: { planSaved: 1 } });
    });
  }

  startAgain() {
    this.editor.discardDraft();
    this.setupOpen.set(true);
  }

  newPlan() {
    this.setupOpen.set(true);
    this.notice.set(null);
  }

  select(day: PlanDay) {
    this.selected.set(day.date);
  }

  async leaveOpen(day: PlanDay) {
    await this.run(() => this.editor.setMeal(day.date, null));
  }

  async togglePrepared(day: PlanDay) {
    await this.run(() => this.editor.togglePrepared(day.date));
  }

  swap(day: PlanDay) {
    void this.router.navigate(['/food/swap', day.date]);
  }

  // Shopping

  async have(item: GroceryItem) {
    await this.editList((e) => ({ ...e, have: [...new Set([...e.have, item.key])] }));
  }

  async notHave(item: GroceryItem) {
    await this.editList((e) => ({ ...e, have: e.have.filter((k) => k !== item.key) }));
  }

  async removeItem(item: GroceryItem) {
    await this.editList((e) =>
      item.added
        ? { ...e, added: e.added.filter((a) => a.name.trim().toLowerCase() !== item.key) }
        : { ...e, removed: [...new Set([...e.removed, item.key])] },
    );
  }

  async restore(item: GroceryItem) {
    await this.editList((e) => ({ ...e, removed: e.removed.filter((k) => k !== item.key) }));
  }

  async addItem() {
    const name = this.newItem.trim();
    if (!name) return;
    await this.editList((e) => ({ ...e, added: [...e.added, { name, amount: this.newAmount.trim() || undefined }] }));
    this.newItem = '';
    this.newAmount = '';
  }

  private editList(edit: Parameters<PlanEditor['editGroceries']>[1]) {
    return this.run(() => this.editor.editGroceries(this.list()?.index ?? 0, edit));
  }

  // Labels

  horizonText = horizonLabel;

  dayNumber(day: PlanDay): number {
    return parseLocalDate(day.date).getDate();
  }

  short(iso: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(parseLocalDate(iso));
  }

  weekday(iso: string): string {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(parseLocalDate(iso));
  }

  long(iso: string): string {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      parseLocalDate(iso),
    );
  }

  meta(day: PlanDay): string {
    if (!day.meal) return 'Open day';
    if (day.leftovers) return 'Leftovers';
    if (day.preparedAt) return 'Prep done';
    return day.meal.prepTimeMinutes ? `${day.meal.prepTimeMinutes} min` : 'Recipe';
  }

  endDate(): string {
    return addDays(this.startDate, this.horizon() - 1);
  }

  private async run(change: () => Promise<void>) {
    this.busy.set(true);
    this.error.set(null);
    try {
      await change();
    } catch (e) {
      this.error.set(messageFor(e, 'That couldn’t be done. Check your connection and try again.'));
    } finally {
      this.busy.set(false);
    }
  }
}
