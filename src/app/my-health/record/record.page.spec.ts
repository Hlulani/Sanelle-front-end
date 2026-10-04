import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, NavigationExtras, Router, convertToParamMap } from '@angular/router';
import { signal } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { RecordPage } from './record.page';
import { HealthRepository } from '../health-repository';
import { Finding, emptyHealthRecord } from '../diagnosis.model';

describe('Manual report entry', () => {
  it('carries source and date into a new page instance for the next finding', async () => {
    const record = signal(emptyHealthRecord());
    let key = 'count';
    let navigation: NavigationExtras = {};
    TestBed.configureTestingModule({ providers: [
      { provide: HealthRepository, useValue: {
        record,
        load: () => Promise.resolve(),
        saveFinding: async (finding: Finding) => record.update((r) => ({ ...r, findings: { ...r.findings, [finding.key]: finding } })),
      } },
      { provide: ActivatedRoute, useValue: {
        get paramMap() { return of(convertToParamMap({ key })); },
        queryParamMap: of(convertToParamMap({ flow: '1' })),
        snapshot: { queryParamMap: convertToParamMap({ flow: '1' }) },
      } },
      { provide: Router, useValue: {
        getCurrentNavigation: () => ({ extras: navigation }),
        navigate: (_: unknown, extras: NavigationExtras) => { navigation = extras; return Promise.resolve(true); },
      } },
    ] });
    let page = TestBed.runInInjectionContext(() => new RecordPage());
    await page.ngOnInit();
    page.choose('present');
    page.value = '2';
    page.reportDate = '2026-10-03';
    await page.save();
    key = 'largestSize';
    page = TestBed.runInInjectionContext(() => new RecordPage());
    await page.ngOnInit();
    expect(page.source).toBe('entered-from-report');
    expect(page.reportDate).toBe('2026-10-03');
    page.choose('present');
    page.value = '1.3';
    await page.save();
    expect(record().findings.largestSize).toBeUndefined();
    expect(page.error()).toContain('Choose cm or mm');
    page.unit = 'cm';
    await page.save();
    expect(record().findings.largestSize?.completeness).toEqual({ state: 'present', value: '1.3 cm' });
    expect(record().findings.largestSize?.reportDate).toBe('2026-10-03');
  });

  it('adds a missing detail to the current dated report and returns to the summary only after saving', async () => {
    const record = signal({ ...emptyHealthRecord(), activeReportId: 'scan', reports: [{ id: 'scan', title: 'October scan', reportDate: '2026-10-01', savedAt: '2026-10-01T12:00:00Z', findings: {} }] });
    const navigate = jasmine.createSpy('navigateByUrl').and.resolveTo(true);
    const save = jasmine.createSpy('saveFinding').and.rejectWith(new Error('Storage unavailable'));
    TestBed.configureTestingModule({ providers: [
      { provide: HealthRepository, useValue: { record, load: () => Promise.resolve(), saveFinding: save } },
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ key: 'location' })), queryParamMap: of(convertToParamMap({ from: 'summary' })) } },
      { provide: Router, useValue: { getCurrentNavigation: () => null, navigateByUrl: navigate } },
    ] });
    const page = TestBed.runInInjectionContext(() => new RecordPage());
    await page.ngOnInit();
    expect(page.reportDate).toBe('2026-10-01');
    page.choose('present'); page.value = 'posterior wall';
    await page.save();
    expect(navigate).not.toHaveBeenCalled();
    expect(page.error()).toContain('Could not save');
    expect(page.value).toBe('posterior wall');
    save.and.resolveTo(); await page.save();
    expect(save.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ key: 'location', reportDate: '2026-10-01', completeness: { state: 'present', value: 'posterior wall' } }));
    expect(navigate).toHaveBeenCalledWith('/health/summary');
  });

  it('uses the latest return context for the same field and leaves it untouched on cancel or skip', async () => {
    const query = new BehaviorSubject(convertToParamMap({ from: 'health' }));
    const save = jasmine.createSpy('saveFinding');
    const navigate = jasmine.createSpy('navigateByUrl');
    TestBed.configureTestingModule({ providers: [
      { provide: HealthRepository, useValue: { record: () => emptyHealthRecord(), load: () => Promise.resolve(), saveFinding: save } },
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ key: 'figo' })), queryParamMap: query } },
      { provide: Router, useValue: { getCurrentNavigation: () => null, navigateByUrl: navigate } },
    ] });
    const page = TestBed.runInInjectionContext(() => new RecordPage());
    await page.ngOnInit();
    query.next(convertToParamMap({ from: 'summary' })); await Promise.resolve();
    page.cancel(); page.skip();
    expect(navigate.calls.allArgs()).toEqual([['/health/summary'], ['/health/summary']]);
    expect(save).not.toHaveBeenCalled();
  });
});
