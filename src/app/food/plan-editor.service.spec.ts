import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';
import { FoodProfileService } from './food-profile.service';
import { MealPlanStore } from './meal-plan.store';
import { RecipeCatalog } from './recipe-catalog.service';
import { PlanEditor } from './plan-editor.service';
import { MealPlan, PlannedMeal, RankedOption } from './meal-plan';

const meal: PlannedMeal = { mealId: 'a', name: 'Meal A', imageUrl: null, prepTimeMinutes: 20, tags: [], reasons: [] };
const original = (): MealPlan => ({
  id: 'plan',
  startDate: '2026-10-08',
  horizon: 3,
  servings: 2,
  createdAt: '2026-10-08',
  savedAt: '2026-10-08',
  madeWith: { allergies: [], exclusions: [], dietaryPattern: 'ANY' },
  groceries: [],
  days: [
    { date: '2026-10-08', meal, preparedAt: '2026-10-08' },
    { date: '2026-10-09', meal: null },
    { date: '2026-10-10', meal },
  ],
});
const ranked: RankedOption = {
  score: 0,
  meal,
  tier: 'other',
  why: [],
  batchFriendly: false,
  conflict: { state: 'clear', lines: [] },
};
describe('PlanEditor duration and undo', () => {
  let editor: PlanEditor;
  let email: string;
  let saved: ReturnType<typeof signal<MealPlan | null>>;
  let save: jasmine.Spy;
  beforeEach(() => {
    email = 'first@example.test';
    saved = signal<MealPlan | null>(original());
    save = jasmine.createSpy('save').and.resolveTo();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getUserEmail: () => email } },
        { provide: FoodProfileService, useValue: { load: async () => {}, rememberPlanned: async () => {} } },
        { provide: RecipeCatalog, useValue: { recipes: signal(new Map()) } },
        {
          provide: MealPlanStore,
          useValue: {
            plan: saved,
            load: async () => {},
            save,
            replaceDays: async (days: MealPlan['days']) => {
              saved.update((p) => ({ ...p!, days }));
            },
          },
        },
      ],
    });
    editor = TestBed.inject(PlanEditor);
    spyOn(editor, 'options').and.resolveTo([ranked]);
  });
  it('retains open and prepared overlapping days when changing duration, without silently saving', async () => {
    await editor.resize(7);
    expect(editor.plan()?.days.length).toBe(7);
    expect(editor.plan()?.days[0].preparedAt).toBe('2026-10-08');
    expect(editor.plan()?.days[1].meal).toBeNull();
    expect(editor.isDraft()).toBeTrue();
    expect(save).not.toHaveBeenCalled();
  });
  it('rejects a duration result when the signed-in account changes during loading', async () => {
    (editor.options as jasmine.Spy).and.callFake(async () => {
      email = 'second@example.test';
      return [ranked];
    });
    await expectAsync(editor.resize(7)).toBeRejected();
    expect(editor.isDraft()).toBeFalse();
    expect(saved()?.horizon).toBe(3);
  });
  it('undoes a confirmed swap but refuses undo after another edit or account change', async () => {
    await editor.load();
    await editor.swapDays([{ date: '2026-10-08', meal: null }]);
    expect(editor.canUndoSwap()).toBeTrue();
    email = 'second@example.test';
    await expectAsync(editor.undoLastSwap()).toBeRejected();
    email = 'first@example.test';
    await editor.undoLastSwap();
    expect(saved()?.days[0].meal?.mealId).toBe('a');
    expect(editor.canUndoSwap()).toBeFalse();
    await editor.swapDays([{ date: '2026-10-08', meal: null }]);
    await editor.replaceDays([{ date: '2026-10-08', meal }]);
    expect(editor.canUndoSwap()).toBeFalse();
  });
  it('does not treat saving an already saved plan as an account-change error', async () => {
    await editor.load();
    await expectAsync(editor.saveDraft()).toBeResolved();
    expect(save).not.toHaveBeenCalled();
  });
});
