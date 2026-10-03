import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { OnboardingPage } from './onboarding.page';

describe('OnboardingPage', () => {
  let component: OnboardingPage;
  let fixture: ComponentFixture<OnboardingPage>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('starts with what the person wants help with', () => {
    expect(component.currentStep()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('What would you like help with first?');
  });

  it('moves to the diet question on a real click of a choice', () => {
    (fixture.nativeElement.querySelector('.choice') as HTMLElement).click();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(2);
    expect(fixture.nativeElement.querySelector('.diet-option')).toBeTruthy();
  });

  it('lands on recording the diagnosis when that was chosen', async () => {
    component.chooseHelp('diagnosis');
    await component.finish();
    expect(router.navigate).toHaveBeenCalledWith(['/health/record/count'], { queryParams: { flow: '1' }, replaceUrl: true });
  });

  it('can be skipped entirely and lands on Today', async () => {
    component.skip();
    component.skip();
    await fixture.whenStable();
    expect(router.navigate).toHaveBeenCalledWith(['/tabs/today'], { queryParams: undefined, replaceUrl: true });
  });

  it('makes no health claims', () => {
    const text = (fixture.nativeElement.textContent as string).toLowerCase();
    for (const word of ['inflammat', 'pcos', 'endometriosis', 'hormone', 'heal']) {
      expect(text).not.toContain(word);
    }
  });
});
