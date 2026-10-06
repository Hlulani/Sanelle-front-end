import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { emptyHealthRecord } from '../diagnosis.model';
import { HealthRepository } from '../health-repository';
import { SummaryPage } from './summary.page';

describe('Main concern editor', () => {
  const record = signal(emptyHealthRecord());
  let page: SummaryPage;
  let save: jasmine.Spy;
  beforeEach(() => {
    record.set(emptyHealthRecord());
    save = jasmine
      .createSpy('setVisitGoal')
      .and.callFake(async (visitGoal: string) => record.update((r) => ({ ...r, visitGoal })));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HealthRepository,
          useValue: {
            record,
            questions: computed(() => record().questions),
            load: () => Promise.resolve(),
            setVisitGoal: save,
          },
        },
        { provide: Router, useValue: { navigateByUrl: jasmine.createSpy() } },
      ],
    });
    page = TestBed.runInInjectionContext(() => new SummaryPage());
  });

  it('prefills the saved concern and discards a cancelled draft without changing the summary', async () => {
    record.update((r) => ({ ...r, visitGoal: 'Understand my report' }));
    await page.openConcern();
    expect(page.concernDraft).toBe('Understand my report');
    page.concernDraft = 'An unfinished edit';
    page.cancelConcern();
    expect(save).not.toHaveBeenCalled();
    expect(page.summary().visitGoal).toBe('Understand my report');
    await page.openConcern();
    expect(page.concernDraft).toBe('Understand my report');
  });

  it('keeps the draft and saved summary after a failed write, then updates the summary on retry', async () => {
    await page.openConcern();
    page.concernDraft = ' Pain is affecting my work ';
    save.and.rejectWith(new Error('Storage unavailable'));
    await page.saveConcern();
    expect(page.editingConcern()).toBeTrue();
    expect(page.concernDraft).toBe(' Pain is affecting my work ');
    expect(page.concernError()).toContain('Your text is still here');
    expect(page.summary().visitGoal).toBe('');
    save.and.callFake(async (visitGoal: string) => record.update((r) => ({ ...r, visitGoal })));
    await page.saveConcern();
    expect(page.editingConcern()).toBeFalse();
    expect(page.summary().visitGoal).toBe('Pain is affecting my work');
    expect(page.concernStatus()).toContain('saved');
  });

  it('prevents duplicate saves and cancellation while a confirmed save is pending', async () => {
    let release!: () => void;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    save.and.callFake(async (visitGoal: string) => {
      await waiting;
      record.update((r) => ({ ...r, visitGoal }));
    });
    await page.openConcern();
    page.concernDraft = 'Understand my report';
    const pending = page.saveConcern();
    await page.saveConcern();
    page.cancelConcern();
    expect(save).toHaveBeenCalledTimes(1);
    expect(page.editingConcern()).toBeTrue();
    expect(page.concernDraft).toBe('Understand my report');
    release();
    await pending;
    expect(page.summary().visitGoal).toBe('Understand my report');
    expect(page.editingConcern()).toBeFalse();
  });
});
