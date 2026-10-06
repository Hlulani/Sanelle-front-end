import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GenerateMealPlanResponse, MealPlansService } from '../../core/services/meal-plans.service';
import { FoodRestrictionsService } from '../../core/services/food-restrictions.service';
import { FocusPreferencesService } from '../../core/services/focus-preferences.service';
import { AuthService } from '../../core/auth/auth.service';
import { addDays, localIsoDate } from '../../shared/calendar-date';
import { PlanSetupComponent } from './plan-setup.component';

describe('PlanSetupComponent', () => {
  let generate: jasmine.Spy;
  const plan: GenerateMealPlanResponse = {
    days: 7,
    daysPlan: Array.from({ length: 7 }, (_, i) => ({ date: addDays(localIsoDate(), i), meals: [] })),
  } as unknown as GenerateMealPlanResponse;

  beforeEach(() => {
    generate = jasmine.createSpy('generate').and.returnValue(of(plan));
    TestBed.configureTestingModule({
      imports: [PlanSetupComponent],
      providers: [
        provideRouter([]),
        { provide: MealPlansService, useValue: { generate } },
        {
          provide: FoodRestrictionsService,
          useValue: { restrictions: signal({ allergies: ['FISH'], dislikes: [] }), saving: signal(false) },
        },
        {
          provide: FocusPreferencesService,
          useValue: { loadDiet: () => Promise.resolve(null), saveDiet: () => Promise.resolve() },
        },
        { provide: AuthService, useValue: { hasValidToken: () => true } },
      ],
    });
  });

  function create() {
    const fixture = TestBed.createComponent(PlanSetupComponent);
    fixture.componentRef.setInput('ready', true);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('previews a plan from her choices, starting on the day she picked', () => {
    const setup = create();
    const start = addDays(localIsoDate(), 2);
    setup.days.set(14);
    setup.mealsPerDay.set('FASTING_16_8');
    setup.proteinPreference.set('VEGETARIAN');
    setup.startDate.set(start);
    let previewed: GenerateMealPlanResponse | undefined;
    setup.previewed.subscribe((p) => (previewed = p));
    setup.preview();
    expect(generate).toHaveBeenCalledWith({
      duration: 'DAYS_14',
      fastingStyle: 'FASTING_16_8',
      proteinPreference: 'VEGETARIAN',
      maxPrepMinutes: null,
      allergies: ['FISH'],
      dislikes: [],
    });
    expect(previewed?.daysPlan[0].date).toBe(start);
    expect(previewed?.preferences?.startDate).toBe(start);
  });

  it('refuses a start date in the past', () => {
    const setup = create();
    const failures: string[] = [];
    setup.failed.subscribe((m) => failures.push(m));
    setup.startDate.set(addDays(localIsoDate(), -1));
    setup.preview();
    expect(generate).not.toHaveBeenCalled();
    expect(failures[0]).toContain('today or a future date');
  });

  it('starts from the choices the saved plan was made with', () => {
    const fixture = TestBed.createComponent(PlanSetupComponent);
    fixture.componentRef.setInput('saved', {
      duration: 'DAYS_30',
      fastingStyle: 'NO_FASTING_3_MEALS',
      proteinPreference: 'PESCATARIAN',
      maxPrepMinutes: 30,
      allergies: [],
      dislikes: [],
      startDate: '2026-11-01',
    });
    fixture.detectChanges();
    const setup = fixture.componentInstance;
    expect([setup.days(), setup.proteinPreference(), setup.maxPrepMinutes(), setup.startDate()]).toEqual([
      30,
      'PESCATARIAN',
      30,
      '2026-11-01',
    ]);
  });
});
