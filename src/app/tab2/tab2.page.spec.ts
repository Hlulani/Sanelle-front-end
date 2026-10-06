import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { GenerateMealPlanResponse, MealPlanItem } from '../core/services/meal-plans.service';
import { PlanStoreService } from '../core/services/plan-store.service';
import { FoodRestrictionsService } from '../core/services/food-restrictions.service';
import { MealProgressService } from '../core/services/meal-progress.service';
import { localIsoDate, addDays } from '../shared/calendar-date';
import { Tab2Page } from './tab2.page';

const item = (id: string, mealType: MealPlanItem['mealType']): MealPlanItem => ({
  mealType,
  mealId: id,
  name: id,
  imageUrl: null,
  tags: [],
});
const planOf = (meals: string[]): GenerateMealPlanResponse =>
  ({
    days: 2,
    daysPlan: meals.map((id, i) => ({ date: addDays(localIsoDate(), i), meals: [item(id, 'LUNCH')] })),
    unfilled: [],
  }) as unknown as GenerateMealPlanResponse;

describe('Tab2Page', () => {
  let fixture: ComponentFixture<Tab2Page>;
  let page: Tab2Page;
  let plans: BehaviorSubject<GenerateMealPlanResponse | null>;
  let savePlan: jasmine.Spy;

  beforeEach(async () => {
    plans = new BehaviorSubject<GenerateMealPlanResponse | null>(planOf(['salad', 'salad']));
    savePlan = jasmine.createSpy('savePlan').and.callFake(async (p: GenerateMealPlanResponse) => plans.next(p));
    await TestBed.configureTestingModule({
      imports: [Tab2Page],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PlanStoreService, useValue: { plan$: plans, getPlanSnapshot: () => plans.value, savePlan } },
        {
          provide: FoodRestrictionsService,
          useValue: {
            restrictions: signal({ allergies: [], dislikes: [] }),
            saving: signal(false),
            load: () => Promise.resolve(),
          },
        },
        {
          provide: MealProgressService,
          useValue: { init: () => Promise.resolve(), isCooked: () => false, toggleCooked: () => undefined },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Tab2Page);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('swaps only the meal on the chosen day, saves it, and can undo', async () => {
    const saved = page.plan()!;
    const day = saved.daysPlan[1];
    page.openSwap(day.meals[0], day.date);
    await page.applySwap(item('stew', 'LUNCH'));
    const updated = savePlan.calls.mostRecent().args[0] as GenerateMealPlanResponse;
    expect(updated.daysPlan.map((d) => d.meals[0].mealId)).toEqual(['salad', 'stew']);
    expect(page.undoPlan()).toBe(saved);
    expect(page.swapping()).toBeNull();
  });

  it('changes a preview without saving anything', async () => {
    page.showPreview(planOf(['oats', 'soup']));
    const day = page.previewPlan()!.daysPlan[0];
    page.openSwap(day.meals[0], day.date);
    await page.applySwap(item('eggs', 'LUNCH'));
    expect(savePlan).not.toHaveBeenCalled();
    expect(page.previewPlan()!.daysPlan.map((d) => d.meals[0].mealId)).toEqual(['eggs', 'soup']);
  });

  it('ignores a swap chosen for a plan that has since changed', async () => {
    const day = page.plan()!.daysPlan[0];
    page.openSwap(day.meals[0], day.date);
    page.showPreview(planOf(['oats', 'soup']));
    await page.applySwap(item('eggs', 'LUNCH'));
    expect(savePlan).not.toHaveBeenCalled();
    expect(page.previewPlan()!.daysPlan[0].meals[0].mealId).toBe('oats');
  });

  it('counts cooked meals across the saved plan', () => {
    expect(page.cookedProgress()).toEqual({ done: 0, total: 2 });
  });
});
