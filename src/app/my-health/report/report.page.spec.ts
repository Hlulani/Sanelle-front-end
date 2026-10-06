import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReportPage } from './report.page';
import { ReportReader } from './report-reader.service';
import { HealthRepository } from '../health-repository';
import { emptyHealthRecord } from '../diagnosis.model';

describe('Report review', () => {
  const record = signal(emptyHealthRecord());
  let save: jasmine.Spy;
  let read: jasmine.Spy;
  let page: ReportPage;
  const event = () =>
    ({
      target: { files: [new File(['test'], 'report.pdf', { type: 'application/pdf' })], value: 'report.pdf' },
    }) as unknown as Event;

  beforeEach(() => {
    record.set(emptyHealthRecord());
    save = jasmine.createSpy('saveReport').and.resolveTo();
    read = jasmine
      .createSpy('read')
      .and.resolveTo('Two intramural fibroids are noted. The largest fibroid measures 4.1 cm.');
    TestBed.configureTestingModule({
      providers: [
        { provide: HealthRepository, useValue: { record, load: () => Promise.resolve(), saveReport: save } },
        { provide: ReportReader, useValue: { read } },
      ],
    });
    page = TestBed.runInInjectionContext(() => new ReportPage());
  });

  it('never saves extracted information before the person confirms it', async () => {
    await page.readFiles(event());
    expect(save).not.toHaveBeenCalled();
    await page.save();
    expect(save).not.toHaveBeenCalled();
    page.confirmed = true;
    page.reportDate = '2026-10-01';
    await page.save();
    expect(
      save.calls
        .mostRecent()
        .args[0].every(
          (f: { source: string; reportDate: string }) =>
            f.source === 'extracted-and-confirmed' && f.reportDate === '2026-10-01',
        ),
    ).toBeTrue();
    expect(page.saved()).toBeTrue();
    expect(page.text()).toBe('');
  });

  it('does not select replacements or ambiguous statements automatically', async () => {
    record.set({
      ...emptyHealthRecord(),
      findings: {
        count: { key: 'count', completeness: { state: 'present', value: '5' }, source: 'entered-from-report' },
      },
    });
    read.and.resolveTo('Two fibroids are noted. The largest fibroid measures 4 cm. The largest fibroid measures 5 cm.');
    await page.readFiles(event());
    expect(page.rows().find((r) => r.key === 'count')?.selected).toBeFalse();
    expect(page.rows().find((r) => r.key === 'largestSize')?.selected).toBeFalse();
  });

  it('saves only selected fields in the new report', async () => {
    await page.readFiles(event());
    page.rows().find((r) => r.key === 'count')!.selected = false;
    page.confirmed = true;
    await page.save();
    expect(save.calls.mostRecent().args[0].map((f: { key: string }) => f.key)).toEqual(['largestSize', 'location']);
  });

  it('keeps the review available after a storage failure', async () => {
    await page.readFiles(event());
    page.confirmed = true;
    save.and.rejectWith(new Error('Storage unavailable'));
    await page.save();
    expect(page.saved()).toBeFalse();
    expect(page.text()).toContain('Two intramural');
    expect(page.error()).toContain('please try again');
  });

  it('rejects multiple PDFs before reading or saving', async () => {
    const files = [
      new File(['a'], 'a.pdf', { type: 'application/pdf' }),
      new File(['b'], 'b.pdf', { type: 'application/pdf' }),
    ];
    await page.readFiles({ target: { files, value: '' } } as unknown as Event);
    expect(read).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(page.error()).toContain('a PDF');
  });
});
