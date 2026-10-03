import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';
import { AuthService } from '../core/auth/auth.service';
import { HealthRepository, storageKeyFor } from './health-repository';

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
    await repo.saveFinding({ key: 'count', completeness: { state: 'present', value: '2' }, source: 'entered-from-report' });
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
      key: 'count', completeness: { state: 'present', value: '2' }, source: 'entered-from-report',
      originalWording: 'Two intramural fibroids are noted.',
    });
    const { value } = await Preferences.get({ key: storageKeyFor('first@example.test') });
    expect(value).toMatch(/^enc:v1:/);
    expect(value).not.toContain('intramural');
    expect(value).not.toContain('count');
  });

  it('stores an unknown finding without a source', async () => {
    const repo = freshRepo();
    await repo.saveFinding({ key: 'cavity', completeness: { state: 'unknown' }, source: 'entered-from-report', originalWording: 'x' });
    const f = repo.record().findings.cavity!;
    expect(f.completeness.state).toBe('unknown');
    expect(f.source).toBeUndefined();
    expect(f.originalWording).toBeUndefined();
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
});
