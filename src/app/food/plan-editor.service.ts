import { Injectable, computed, inject, signal } from '@angular/core';
import { FoodProfileService } from './food-profile.service';
import { MealPlanStore } from './meal-plan.store';
import { RecipeCatalog } from './recipe-catalog.service';
import {
  GroceryEdits,
  MealPlan,
  PlanDay,
  PlanSetup,
  PlannedMeal,
  Horizon,
  RankedOption,
  buildDays,
  rankOptions,
} from './meal-plan';
import { UserFacingError } from '../core/errors/errors';
import { AuthService } from '../core/auth/auth.service';

/**
 * Makes and changes meal plans. A new plan stays a draft on screen until she saves it; after
 * that, every change goes to the saved plan. Either way the same rules apply.
 */
@Injectable({ providedIn: 'root' })
export class PlanEditor {
  private readonly food = inject(FoodProfileService);
  private readonly store = inject(MealPlanStore);
  private readonly catalog = inject(RecipeCatalog);
  private readonly auth = inject(AuthService);
  private draftOwner: string | null = null;

  private readonly swapUndo = signal<{ owner: string; planId: string; before: PlanDay[]; after: string } | null>(null);
  readonly canUndoSwap = computed(() => {
    const undo = this.swapUndo(),
      plan = this.plan();
    return (
      !!undo &&
      undo.owner === this.auth.getUserEmail() &&
      undo.planId === plan?.id &&
      undo.after === JSON.stringify(plan.days)
    );
  });
  async swapDays(days: PlanDay[]): Promise<void> {
    const prior = this.plan(),
      owner = this.auth.getUserEmail();
    if (!prior || !owner) throw new UserFacingError('Open your meal plan again.');
    const before = prior.days;
    await this.replaceDays(days);
    if (owner === this.auth.getUserEmail())
      this.swapUndo.set({ owner, planId: prior.id, before, after: JSON.stringify(days) });
  }
  async undoLastSwap(): Promise<void> {
    if (!this.canUndoSwap() || this.swapUndo()?.owner !== this.auth.getUserEmail())
      throw new UserFacingError('This swap can no longer be undone.');
    const undo = this.swapUndo()!;
    await this.replaceDays(undo.before);
    this.swapUndo.set(null);
  }
  private readonly draftState = signal<MealPlan | null>(null);
  readonly isDraft = computed(() => !!this.draftState());
  /** The plan on screen: the unsaved draft if there is one, otherwise the saved plan. */
  readonly plan = computed(() => this.draftState() ?? this.store.plan());
  readonly recipes = this.catalog.recipes;

  async load(): Promise<void> {
    if (this.draftOwner !== this.auth.getUserEmail()) this.discardDraft();
    await Promise.all([this.food.load(), this.store.load()]);
  }

  /** Every eligible main meal, ranked by her preferences. Strict requirements are applied by the server. */
  async options(maxPrepMinutes: number | null = null): Promise<RankedOption[]> {
    await this.food.load();
    const [eligible, recipes] = await Promise.all([
      this.catalog.eligibleMainMeals(this.food.profile(), this.food.exclusions(), maxPrepMinutes),
      this.catalog.loadRecipes(),
    ]);
    return rankOptions(eligible, recipes, this.food.profile());
  }

  async build(setup: PlanSetup, maxPrepMinutes: number | null): Promise<MealPlan> {
    const owner = this.auth.getUserEmail();
    const ranked = await this.options(maxPrepMinutes);
    if (!owner || owner !== this.auth.getUserEmail())
      throw new UserFacingError('The signed-in account changed. Start the plan again.');
    if (!ranked.length)
      throw new UserFacingError(
        'No meals meet all your requirements. Try a longer prep time, or review your requirements.',
      );
    const profile = this.food.profile();
    const plan: MealPlan = {
      id: Math.random().toString(36).slice(2, 10),
      horizon: setup.horizon,
      startDate: setup.startDate,
      servings: setup.servings,
      days: buildDays(setup, ranked),
      groceries: [],
      createdAt: new Date().toISOString(),
      madeWith: {
        allergies: profile.allergies,
        exclusions: this.food.exclusions(),
        dietaryPattern: profile.dietaryPattern,
      },
    };
    this.draftOwner = owner;
    this.draftState.set(plan);
    return plan;
  }

  async saveDraft(): Promise<void> {
    if (!this.draftState()) return;
    if (this.draftOwner !== this.auth.getUserEmail()) {
      this.discardDraft();
      throw new UserFacingError('The signed-in account changed. Start the plan again.');
    }
    const draft = this.draftState();
    if (!draft) return;
    await this.store.save(draft);
    await this.food.rememberPlanned(draft.days.filter((d) => d.meal).map((d) => d.meal!.mealId));
    this.draftState.set(null);
  }

  /** Change the source planner's duration without discarding edits to overlapping days. */
  async resize(horizon: Horizon): Promise<void> {
    const owner = this.auth.getUserEmail();
    await this.load();
    if (!owner || owner !== this.auth.getUserEmail())
      throw new UserFacingError('The signed-in account changed. Start the plan again.');
    const prior = this.plan();
    if (!prior) throw new UserFacingError('Make a plan first.');
    const ranked = await this.options();
    if (!owner || owner !== this.auth.getUserEmail())
      throw new UserFacingError('The signed-in account changed. Start the plan again.');
    if (!ranked.length) throw new UserFacingError('No meals meet all your requirements. Review your requirements.');
    const generated = buildDays(
      { horizon, startDate: prior.startDate, servings: prior.servings, openWeekdays: [], batch: false },
      ranked,
    );
    const existing = new Map(prior.days.map((day) => [day.date, day]));
    this.draftOwner = owner;
    this.draftState.set({
      ...prior,
      horizon,
      days: generated.map((day) => existing.get(day.date) ?? day),
      savedAt: undefined,
    });
  }

  discardDraft(): void {
    this.draftState.set(null);
    this.draftOwner = null;
  }

  async replaceDays(days: PlanDay[]): Promise<void> {
    if (this.draftState()) {
      this.draftState.update((p) => (p ? { ...p, days } : p));
      return;
    }
    await this.store.replaceDays(days);
    await this.food.rememberPlanned(days.filter((d) => d.meal).map((d) => d.meal!.mealId));
  }

  async setMeal(date: string, meal: PlannedMeal | null): Promise<void> {
    const plan = this.plan();
    if (!plan) throw new UserFacingError('Make a plan first.');
    const days = plan.days.map((d, i) => {
      if (d.date === date) return { date, meal };
      const previous = plan.days[i - 1];
      return d.leftovers && previous?.date === date ? { date: d.date, meal: d.meal } : d;
    });
    await this.replaceDays(days);
  }

  /** Preparing is tracked on the saved plan only, and never means a meal was eaten. */
  togglePrepared(date: string): Promise<void> {
    if (this.draftState()) return Promise.reject(new UserFacingError('Save the plan before marking meals prepared.'));
    return this.store.togglePrepared(date);
  }

  async editGroceries(week: number, edit: (edits: GroceryEdits) => GroceryEdits): Promise<void> {
    if (this.draftState()) {
      this.draftState.update((p) => {
        if (!p) return p;
        const groceries = [...p.groceries];
        while (groceries.length <= week) groceries.push({ have: [], removed: [], added: [] });
        groceries[week] = edit(groceries[week]);
        return { ...p, groceries };
      });
      return;
    }
    await this.store.editGroceries(week, edit);
  }

  async clearSaved(): Promise<void> {
    await this.store.clear();
  }
}
