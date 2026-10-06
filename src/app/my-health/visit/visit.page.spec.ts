import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { VisitPage } from './visit.page';
import { HealthRepository } from '../health-repository';
import { emptyHealthRecord } from '../diagnosis.model';

describe('After your visit', () => {
  const record = signal(emptyHealthRecord());
  let load: jasmine.Spy;
  let saveVisit: jasmine.Spy;

  beforeEach(() => {
    record.set(emptyHealthRecord());
    load = jasmine.createSpy('load').and.resolveTo();
    saveVisit = jasmine.createSpy('saveVisit').and.resolveTo();
    TestBed.configureTestingModule({
      imports: [VisitPage],
      providers: [provideRouter([]), { provide: HealthRepository, useValue: { record, load, saveVisit } }],
    });
  });

  it('prevents typing until saved notes have loaded', async () => {
    let finishLoad!: () => void;
    load.and.returnValue(
      new Promise<void>((resolve) => {
        finishLoad = resolve;
      }),
    );
    const fixture = TestBed.createComponent(VisitPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBeTrue();
    finishLoad();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBeFalse();
  });

  it('does not save an empty visit or one in the future', async () => {
    const page = TestBed.runInInjectionContext(() => new VisitPage());
    await page.ngOnInit();
    await page.save();
    expect(saveVisit).not.toHaveBeenCalled();
    page.form.patchValue({ discussion: 'Something to remember', date: '9999-01-01' });
    await page.save();
    expect(saveVisit).not.toHaveBeenCalled();
    expect(page.error()).toContain('already happened');
  });

  it('retains a draft after a failed save and confirms only a successful retry', async () => {
    const page = TestBed.runInInjectionContext(() => new VisitPage());
    await page.ngOnInit();
    page.form.patchValue({ discussion: 'Discussed symptoms', nextSteps: 'Arrange follow-up' });
    saveVisit.and.rejectWith(new Error('Storage unavailable'));
    await page.save();
    expect(page.status()).toBeNull();
    expect(page.form.controls.discussion.value).toBe('Discussed symptoms');
    expect(page.saving()).toBeFalse();
    saveVisit.and.resolveTo();
    await page.save();
    expect(page.status()).toContain('Visit notes saved');
  });
});
