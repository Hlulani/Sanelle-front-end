import { TestBed } from '@angular/core/testing';
import { MealProgressService } from '../../core/services/meal-progress.service';
import { MealPlanItem } from '../../core/services/meal-plans.service';
import { PlanMealCardComponent } from './plan-meal-card.component';

describe('PlanMealCardComponent', () => {
  const meal: MealPlanItem = {
    mealType: 'DINNER',
    mealId: 'm1',
    name: 'Lentil stew',
    imageUrl: null,
    tags: ['vegan', 'anti-inflammatory', 'quick'],
    prepTimeMinutes: 25,
    reasons: ['Vegan, as you chose'],
  };
  let cooked = false;
  const toggleCooked = jasmine.createSpy('toggleCooked').and.callFake(() => (cooked = !cooked));

  beforeEach(() => {
    cooked = false;
    TestBed.configureTestingModule({
      imports: [PlanMealCardComponent],
      providers: [{ provide: MealProgressService, useValue: { isCooked: () => cooked, toggleCooked } }],
    });
  });

  function render(preview = false) {
    const fixture = TestBed.createComponent(PlanMealCardComponent);
    fixture.componentRef.setInput('meal', meal);
    fixture.componentRef.setInput('date', '2026-10-06');
    fixture.componentRef.setInput('preview', preview);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the meal, why it was chosen, and only factual tags', () => {
    const el: HTMLElement = render().nativeElement;
    expect(el.querySelector('.meal-name')?.textContent).toContain('Lentil stew');
    expect(el.querySelector('.meal-why')?.textContent).toContain('Vegan, as you chose');
    expect(Array.from(el.querySelectorAll('.highlight-chip')).map((c) => c.textContent?.trim())).toEqual([
      'Vegan',
      'Quick',
    ]);
  });

  it("marks a saved meal cooked, but a preview meal can't be", () => {
    const fixture = render();
    (fixture.nativeElement.querySelector('.cooked-toggle') as HTMLButtonElement).click();
    expect(toggleCooked).toHaveBeenCalledWith('2026-10-06', 'm1');
    expect(render(true).nativeElement.querySelector('.cooked-toggle')).toBeNull();
  });
});
