import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { OnboardingPage } from './onboarding.page';
import { FocusPreferencesService } from '../../../core/services/focus-preferences.service';

describe('OnboardingPage', () => {
  let component: OnboardingPage;
  let fixture: ComponentFixture<OnboardingPage>;
  let router: Router;
  let focus: FocusPreferencesService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    focus = TestBed.inject(FocusPreferencesService);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(focus, 'saveFocus').and.resolveTo();
    fixture.detectChanges();
  });

  const buttons = () => [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
  const button = (text: string) => buttons().find((b) => b.textContent!.trim().startsWith(text))!;

  it('asks one question with the three pillars', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('What would you like help with?');
    expect(fixture.nativeElement.querySelectorAll('.choice').length).toBe(3);
  });

  it('allows more than one choice, and a second tap clears one', () => {
    const [diagnosis, food] = fixture.nativeElement.querySelectorAll('.choice') as HTMLElement[];
    diagnosis.click();
    food.click();
    fixture.detectChanges();
    expect(component.selected()).toEqual(['diagnosis', 'food']);
    diagnosis.click();
    fixture.detectChanges();
    expect(component.selected()).toEqual(['food']);
    expect(diagnosis.getAttribute('aria-pressed')).toBe('false');
  });

  it('only continues once something is chosen', () => {
    expect(button('Continue').disabled).toBeTrue();
    (fixture.nativeElement.querySelector('.choice') as HTMLElement).click();
    fixture.detectChanges();
    expect(button('Continue').disabled).toBeFalse();
  });

  it('saves the choices and lands on Today', async () => {
    component.toggle('appointment');
    component.toggle('diagnosis');
    await component.finish(component.selected());
    expect(focus.saveFocus).toHaveBeenCalledWith(['appointment', 'diagnosis']);
    expect(router.navigate).toHaveBeenCalledWith(['/tabs/today'], { replaceUrl: true });
  });

  it('can be skipped, and a quick double tap only finishes once', async () => {
    button('Skip for now').click();
    button('Skip for now').click();
    await fixture.whenStable();
    expect(focus.saveFocus).toHaveBeenCalledOnceWith([]);
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });

  it('makes no health claims', () => {
    const text = (fixture.nativeElement.textContent as string).toLowerCase();
    for (const word of ['inflammat', 'pcos', 'endometriosis', 'hormone', 'heal']) {
      expect(text).not.toContain(word);
    }
  });
});
