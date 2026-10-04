import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { FoodRestrictionsService, sameRestrictions } from './food-restrictions.service';

describe('sameRestrictions', () => {
  it('treats order and letter case as the same', () => {
    expect(sameRestrictions({ allergies: ['MILK', 'EGG'], dislikes: ['Mushrooms'] }, { allergies: ['EGG', 'MILK'], dislikes: ['mushrooms'] })).toBeTrue();
  });

  it('notices an added allergy', () => {
    expect(sameRestrictions({ allergies: [], dislikes: [] }, { allergies: ['SESAME'], dislikes: [] })).toBeFalse();
  });

  it('treats a plan made before restrictions existed as matching only when there are none', () => {
    expect(sameRestrictions(null, { allergies: [], dislikes: [] })).toBeTrue();
    expect(sameRestrictions(null, { allergies: ['MILK'], dislikes: [] })).toBeFalse();
  });
});

describe('Saved food exclusions', () => {
  let service: FoodRestrictionsService;
  let stored: string | null;
  let set: jasmine.Spy;
  beforeEach(() => {
    stored = null;
    set = jasmine.createSpy('set').and.callFake(async (_key: string, value: string) => { stored = value; });
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { getUserEmail: () => 'food@example.test' } },
      { provide: EncryptedStore, useValue: { get: async () => stored, set } },
    ] });
    service = TestBed.inject(FoodRestrictionsService);
  });
  it('keeps rapid allergy and dislike changes together in storage', async () => {
    await Promise.all([service.toggleAllergy('MILK'), service.toggleAllergy('SESAME'), service.addDislike('Mushrooms')]);
    expect(service.restrictions()).toEqual({ allergies: ['MILK', 'SESAME'], dislikes: ['Mushrooms'] });
    expect(JSON.parse(stored!)).toEqual(service.restrictions());
    expect(service.saving()).toBeFalse();
  });
  it('retains the saved exclusions after a storage failure and allows retrying', async () => {
    await service.toggleAllergy('MILK');
    set.and.rejectWith(new Error('Storage unavailable'));
    await expectAsync(service.toggleAllergy('SESAME')).toBeRejected();
    expect(service.restrictions().allergies).toEqual(['MILK']);
    set.and.callFake(async (_key: string, value: string) => { stored = value; });
    await service.toggleAllergy('SESAME');
    expect(JSON.parse(stored!).allergies).toEqual(['MILK', 'SESAME']);
  });
  it('does not publish an allergy as saved while device storage is still pending', async () => {
    let started!: () => void; let release!: () => void;
    const inStore = new Promise<void>((resolve) => { started = resolve; });
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    set.and.callFake(async () => { started(); await waiting; });
    const save = service.toggleAllergy('MILK');
    await inStore;
    expect(service.saving()).toBeTrue();
    expect(service.restrictions().allergies).toEqual([]);
    release(); await save;
    expect(service.restrictions().allergies).toEqual(['MILK']);
  });
});
