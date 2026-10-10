import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';
import { AuthService } from '../core/auth/auth.service';
import { HealthRepository, storageKeyFor } from './health-repository';
import { EncryptedStore } from '../core/storage/encrypted-store.service';

class FakeAuth {
  email: string | null = 'first@example.test';
  getUserEmail() {
    return this.email;
  }
}

describe('HealthRepository', () => {
  let auth: FakeAuth;

  function freshRepo(): HealthRepository {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }] });
    return TestBed.inject(HealthRepository);
  }

  beforeEach(async () => {
    auth = new FakeAuth();
    await Preferences.remove({ key: storageKeyFor('first@example.test') });
    await Preferences.remove({ key: storageKeyFor('second@example.test') });
  });

  it('keeps each account’s records separate on the same device', async () => {
    let repo = freshRepo();
    await repo.saveFinding({
      key: 'count',
      completeness: { state: 'present', value: '2' },
      source: 'entered-from-report',
    });
    await repo.addQuestion('Where are my fibroids?', 'location');

    auth.email = 'second@example.test';
    repo = freshRepo();
    await repo.load();
    expect(repo.record().findings.count).toBeUndefined();
    expect(repo.record().questions.length).toBe(0);

    auth.email = 'first@example.test';
    repo = freshRepo();
    await repo.load();
    expect(repo.record().findings.count?.completeness).toEqual({ state: 'present', value: '2' });
    expect(repo.record().questions.map((q) => q.text)).toEqual(['Where are my fibroids?']);
  });

  it('saves records encrypted, never as readable text', async () => {
    const repo = freshRepo();
    await repo.saveFinding({
      key: 'count',
      completeness: { state: 'present', value: '2' },
      source: 'entered-from-report',
      originalWording: 'Two intramural fibroids are noted.',
    });
    const { value } = await Preferences.get({ key: storageKeyFor('first@example.test') });
    expect(value).toMatch(/^enc:v1:/);
    expect(value).not.toContain('intramural');
    expect(value).not.toContain('count');
  });

  it('keeps visit preparation, dated visit history and answers after a reload', async () => {
    let repo = freshRepo();
    await Promise.all([repo.setVisitGoal('Discuss work'), repo.addQuestion('What next?')]);
    await repo.updateQuestion(repo.questions()[0].id, { answer: 'Book a follow-up' });
    await repo.saveVisit({ date: '2026-10-01', discussion: 'First visit', nextSteps: 'Bring my report', followUp: '' });
    await repo.saveVisit({
      date: '2026-10-02',
      discussion: 'Second visit',
      nextSteps: '',
      followUp: 'Arrange follow-up',
    });
    await repo.saveVisit({
      date: '2026-10-01',
      discussion: 'Updated notes',
      nextSteps: 'Bring my report',
      followUp: '',
    });
    await repo.setSummaryPeriodDays(90);
    repo = freshRepo();
    await repo.load();
    expect(repo.record().visitGoal).toBe('Discuss work');
    expect(repo.questions()[0].answer).toBe('Book a follow-up');
    expect(repo.record().visits?.map((v) => v.date)).toEqual(['2026-10-02', '2026-10-01']);
    expect(repo.record().visits?.[1].discussion).toBe('Updated notes');
    expect(repo.record().summaryPeriodDays).toBe(90);
  });

  it('does not show an unsaved change as saved and accepts a retry after a storage failure', async () => {
    const repo = freshRepo();
    await repo.load();
    const store = TestBed.inject(EncryptedStore);
    const save = spyOn(store, 'set').and.rejectWith(new Error('Storage unavailable'));
    await expectAsync(repo.setVisitGoal('Unsaved goal')).toBeRejected();
    expect(repo.record().visitGoal).toBeUndefined();
    save.and.callThrough();
    await repo.setVisitGoal('Saved on retry');
    expect(repo.record().visitGoal).toBe('Saved on retry');
  });

  it('stores an unknown finding without a source', async () => {
    const repo = freshRepo();
    await repo.saveFinding({
      key: 'cavity',
      completeness: { state: 'unknown' },
      source: 'entered-from-report',
      originalWording: 'x',
    });
    const f = repo.record().findings.cavity!;
    expect(f.completeness.state).toBe('unknown');
    expect(f.source).toBeUndefined();
    expect(f.originalWording).toBeUndefined();
  });

  it('keeps each scan separately and never fills a new report from an older one', async () => {
    let repo = freshRepo();
    await repo.saveReport(
      [
        { key: 'count', completeness: { state: 'present', value: '2' }, source: 'extracted-and-confirmed' },
        { key: 'cavity', completeness: { state: 'absent' }, source: 'extracted-and-confirmed' },
      ],
      'First scan',
      '2026-09-01',
    );
    const firstId = repo.record().activeReportId!;
    await repo.saveReport(
      [{ key: 'count', completeness: { state: 'present', value: '3' }, source: 'extracted-and-confirmed' }],
      'Second scan',
      '2026-10-01',
    );
    expect(repo.record().findings.cavity).toBeUndefined();
    expect(repo.record().reports?.length).toBe(2);
    repo = freshRepo();
    await repo.load();
    await repo.selectReport(firstId);
    expect(repo.record().findings.count?.completeness).toEqual({ state: 'present', value: '2' });
    expect(repo.record().findings.cavity?.completeness).toEqual({ state: 'absent' });
  });

  it('can save a report to history without changing the selected overview', async () => {
    const repo = freshRepo();
    await repo.saveFinding({ key: 'count', completeness: { state: 'present', value: '2' } });
    await repo.saveReport(
      [{ key: 'count', completeness: { state: 'present', value: '3' } }],
      'Another scan',
      undefined,
      false,
    );
    expect(repo.record().findings.count?.completeness).toEqual({ state: 'present', value: '2' });
    expect(repo.record().reports?.find((r) => r.id === repo.record().activeReportId)?.title).toBe(
      'Previously recorded details',
    );
    expect(repo.record().reports?.some((r) => r.title === 'Previously recorded details')).toBeTrue();
    await repo.saveReport(
      [{ key: 'count', completeness: { state: 'present', value: '4' } }],
      'A further scan',
      undefined,
      false,
    );
    expect(repo.record().reports?.filter((r) => r.title === 'Previously recorded details').length).toBe(1);
  });

  it('persists next steps, completion state and summary selections', async () => {
    let repo = freshRepo();
    await repo.saveTask({ title: ' Book a follow-up ', dueDate: '2026-11-01', visitDate: '2026-10-01' });
    const taskId = repo.record().tasks![0].id;
    await repo.completeTask(taskId, true);
    await repo.setSummarySelection({ summaryQuestionIds: [], summaryVisitDates: ['2026-10-01'] });
    repo = freshRepo();
    await repo.load();
    expect(repo.record().tasks![0].title).toBe('Book a follow-up');
    expect(repo.record().tasks![0].completedAt).toBeDefined();
    expect(repo.record().summaryQuestionIds).toEqual([]);
    await repo.completeTask(taskId, false);
    expect(repo.record().tasks![0].completedAt).toBeUndefined();
  });

  it('retains every privacy selection when multiple check-ins are excluded quickly', async () => {
    let repo = freshRepo();
    await repo.saveSymptoms({ date: '2026-10-01', pain: 2 });
    await repo.saveSymptoms({ date: '2026-10-02', notes: 'Private note' });
    await repo.saveSymptoms({ date: '2026-10-03', treatmentChange: 'Private change' });
    await Promise.all([
      repo.toggleSummarySelection('summarySymptomDates', '2026-10-02', false),
      repo.toggleSummarySelection('summarySymptomDates', '2026-10-03', false),
    ]);
    repo = freshRepo();
    await repo.load();
    expect(repo.record().summarySymptomDates).toEqual(['2026-10-01']);
  });

  it('persists checked report findings together without replacing unselected details', async () => {
    let repo = freshRepo();
    await repo.saveFinding({
      key: 'location',
      completeness: { state: 'present', value: 'posterior wall' },
      source: 'told-by-clinician',
    });
    const store = TestBed.inject(EncryptedStore);
    const write = spyOn(store, 'set').and.callThrough();
    await repo.saveFindings([
      {
        key: 'count',
        completeness: { state: 'present', value: 'Two fibroids' },
        source: 'extracted-and-confirmed',
        originalWording: 'Two fibroids are noted.',
        reportDate: '2026-10-03',
      },
      {
        key: 'cavity',
        completeness: { state: 'absent' },
        source: 'extracted-and-confirmed',
        originalWording: 'The uterine cavity is not distorted.',
        reportDate: '2026-10-03',
      },
    ]);
    expect(write).toHaveBeenCalledTimes(1);
    repo = freshRepo();
    await repo.load();
    expect(repo.record().findings.location?.completeness).toEqual({ state: 'present', value: 'posterior wall' });
    expect(repo.record().findings.count?.source).toBe('extracted-and-confirmed');
    expect(repo.record().findings.cavity?.originalWording).toBe('The uterine cavity is not distorted.');
    expect(repo.record().findings.cavity?.reportDate).toBe('2026-10-03');
  });

  it('does not add the same question twice and keeps the order it is given', async () => {
    const repo = freshRepo();
    await repo.addQuestion('A?');
    await repo.addQuestion('B?');
    await repo.addQuestion('a?');
    expect(repo.record().questions.map((q) => q.text)).toEqual(['A?', 'B?']);
    await repo.moveQuestion(repo.record().questions[1].id, -1);
    expect(repo.record().questions.map((q) => q.text)).toEqual(['B?', 'A?']);
  });

  it('removes only the current account’s records when clearing', async () => {
    let repo = freshRepo();
    await repo.addQuestion('Kept?');
    auth.email = 'second@example.test';
    repo = freshRepo();
    await repo.addQuestion('Removed?');
    await repo.clearCurrentUser();

    auth.email = 'first@example.test';
    repo = freshRepo();
    await repo.load();
    expect(repo.record().questions.map((q) => q.text)).toEqual(['Kept?']);
  });
  it('saves an answer and next step atomically and retries without duplicate history', async () => {
    let repo = freshRepo();
    await repo.addQuestion('What next?');
    const id = repo.record().questions[0].id;
    const store = TestBed.inject(EncryptedStore);
    const write = spyOn(store, 'set').and.rejectWith(new Error('Storage unavailable'));
    await expectAsync(
      repo.saveQuestionOutcome(id, 'answered', 'A blood test', '2026-10-08', { title: 'Book the test' }),
    ).toBeRejected();
    expect(repo.record().questions[0].history).toBeUndefined();
    expect(repo.record().tasks ?? []).toEqual([]);
    write.and.callThrough();
    await repo.saveQuestionOutcome(id, 'answered', 'A blood test', '2026-10-08', { title: 'Book the test' });
    expect(write).toHaveBeenCalledTimes(2);
    repo = freshRepo();
    await repo.load();
    expect(repo.record().questions[0].history?.length).toBe(1);
    expect(repo.record().tasks?.[0].questionId).toBe(id);
    expect(repo.record().tasks?.[0].title).toBe('Book the test');
  });

  it('preserves selected symptom categories without assigning severity or blank-field answers', async () => {
    let repo = freshRepo();
    await repo.saveSymptoms({
      date: '2026-10-08',
      observedSymptoms: ['Pain', 'Low energy'],
      dailyImpact: 'Changed my plans',
    });
    repo = freshRepo();
    await repo.load();
    const entry = repo.record().symptoms[0];
    expect(entry.observedSymptoms).toEqual(['Pain', 'Low energy']);
    expect(entry.dailyImpact).toBe('Changed my plans');
    expect(entry.bleeding).toBeUndefined();
    expect(entry.pain).toBeUndefined();
    expect(entry.fatigue).toBeUndefined();
    expect(entry.affected).toBeUndefined();
  });
});
