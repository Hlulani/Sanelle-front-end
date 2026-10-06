import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { PlanStoreService } from '../core/services/plan-store.service';
import { MealService } from '../core/services/meal.service';
import { GenerateMealPlanResponse } from '../core/services/meal-plans.service';

import { Tab3Page } from './tab3.page';
import { localIsoDate } from '../shared/calendar-date';

describe('Tab3Page', () => {
  let component: Tab3Page;
  let fixture: ComponentFixture<Tab3Page>;
  let plans: BehaviorSubject<GenerateMealPlanResponse | null>;

  beforeEach(async () => {
    plans = new BehaviorSubject<GenerateMealPlanResponse | null>(null);
    await TestBed.configureTestingModule({
      imports: [Tab3Page],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { hasValidToken: () => true } },
        { provide: PlanStoreService, useValue: { plan$: plans } },
        {
          provide: MealService,
          useValue: {
            getMealById: (id: string) =>
              of({
                id,
                name: 'Chickpea salad',
                mealType: 'LUNCH',
                tags: [],
                instructions: [],
                ingredients: [
                  { name: 'Cucumber', amount: '1' },
                  { name: 'Chickpeas', amount: '1 tin' },
                ],
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab3Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function showPlan() {
    const today = new Date();
    const date = localIsoDate(today);
    plans.next({
      days: 1,
      daysPlan: [
        {
          date,
          meals: [
            {
              mealId: 'salad',
              name: 'Chickpea salad',
              mealType: 'LUNCH',
              tags: [],
              imageUrl: null,
            },
          ],
        },
      ],
    });
    fixture.detectChanges();
  }

  it('keeps the displayed checklist in place during unrelated renders', () => {
    showPlan();
    const groups = [...fixture.nativeElement.querySelectorAll('.group-card')];
    expect(groups.length).toBe(2);
    fixture.detectChanges();
    const after = [...fixture.nativeElement.querySelectorAll('.group-card')];
    expect(after[0]).toBe(groups[0]);
    expect(after[1]).toBe(groups[1]);
  });

  it('updates the remaining checklist and progress when an ingredient is collected', () => {
    showPlan();
    const checkbox = fixture.nativeElement.querySelector('ion-checkbox[aria-label="Got Cucumber"]');
    checkbox.dispatchEvent(new CustomEvent('ionChange', { detail: { checked: true } }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.group-card').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.item-name').textContent.trim()).toBe('Chickpeas');
    expect(component.checkedCount()).toBe(1);
    expect(component.progressPercent()).toBe(50);
    component.toggleChecked('Chickpeas', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.complete-state h2').textContent.trim()).toBe('All set');
  });
});
