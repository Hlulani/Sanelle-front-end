import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { MealPlanItem, MealPlansService } from '../../core/services/meal-plans.service';
import { FoodRestrictionsService } from '../../core/services/food-restrictions.service';
import { SwapMealModalComponent } from './swap-meal-modal.component';

const meal = (id: string, mealType: MealPlanItem['mealType'] = 'LUNCH'): MealPlanItem => ({
  mealType,
  mealId: id,
  name: id,
  imageUrl: null,
  tags: [],
});

describe('SwapMealModalComponent', () => {
  let swapOptions: jasmine.Spy;

  beforeEach(() => {
    swapOptions = jasmine.createSpy('swapOptions');
    TestBed.configureTestingModule({
      imports: [SwapMealModalComponent],
      providers: [
        { provide: MealPlansService, useValue: { swapOptions } },
        {
          provide: FoodRestrictionsService,
          useValue: { restrictions: signal({ allergies: ['SESAME'], dislikes: ['mushroom'] }) },
        },
      ],
    });
  });

  function open(current: MealPlanItem | null) {
    const fixture = TestBed.createComponent(SwapMealModalComponent);
    fixture.componentRef.setInput('criteria', { proteinPreference: 'VEGAN', maxPrepMinutes: 20 });
    fixture.componentRef.setInput('meal', current);
    fixture.detectChanges();
    return fixture;
  }

  it('asks for alternatives that fit the same choices and exclusions', () => {
    swapOptions.and.returnValue(of([meal('lentils')]));
    const fixture = open(meal('salad'));
    expect(swapOptions).toHaveBeenCalledWith({
      mealType: 'LUNCH',
      currentMealId: 'salad',
      proteinPreference: 'VEGAN',
      maxPrepMinutes: 20,
      allergies: ['SESAME'],
      dislikes: ['mushroom'],
    });
    expect(fixture.componentInstance.options().map((m) => m.mealId)).toEqual(['lentils']);
  });

  it('ignores a slower answer for a meal it has moved on from', () => {
    const first = new Subject<MealPlanItem[]>();
    swapOptions.and.returnValues(first, of([meal('soup')]));
    const fixture = open(meal('salad'));
    fixture.componentRef.setInput('meal', meal('toast', 'BREAKFAST'));
    fixture.detectChanges();
    first.next([meal('stale')]);
    expect(fixture.componentInstance.options().map((m) => m.mealId)).toEqual(['soup']);
  });

  it("offers a retry after a failure, and keeps the slot's meal type for the chosen meal", () => {
    swapOptions.and.returnValues(
      throwError(() => new Error('offline')),
      of([{ ...meal('oats'), mealType: 'BREAKFAST' as const }]),
    );
    const fixture = open(meal('salad'));
    expect(fixture.componentInstance.alternatives().status).toBe('error');
    fixture.componentInstance.retry();
    fixture.detectChanges();
    const chosen: MealPlanItem[] = [];
    fixture.componentInstance.chosen.subscribe((m) => chosen.push(m));
    fixture.componentInstance.choose(fixture.componentInstance.options()[0]);
    expect(chosen[0]).toEqual(jasmine.objectContaining({ mealId: 'oats', mealType: 'LUNCH' }));
  });

  it('asks nothing while closed', () => {
    open(null);
    expect(swapOptions).not.toHaveBeenCalled();
  });
});
