import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { OnboardingPage } from './onboarding.page';

describe('OnboardingPage', () => {
  let component: OnboardingPage;
  let fixture: ComponentFixture<OnboardingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('advances from step 1 to step 2 on a real DOM click of a goal card', () => {
    expect(component.currentStep()).toBe(1);

    const goalCard: HTMLElement = fixture.nativeElement.querySelector('.goal-card');
    expect(goalCard).withContext('expected a .goal-card to be present on step 1').toBeTruthy();

    goalCard.click();
    fixture.detectChanges();

    expect(component.currentStep()).toBe(2);
  });

  it('advances from step 2 to step 3 on a real DOM click of a diet option', () => {
    // Get to step 2 first via the same real-click path.
    const goalCard: HTMLElement = fixture.nativeElement.querySelector('.goal-card');
    goalCard.click();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(2);

    const dietOption: HTMLElement = fixture.nativeElement.querySelector('.diet-option');
    expect(dietOption).withContext('expected a .diet-option button to be present on step 2').toBeTruthy();

    dietOption.click();
    fixture.detectChanges();

    expect(component.currentStep()).toBe(3);
  });
});
