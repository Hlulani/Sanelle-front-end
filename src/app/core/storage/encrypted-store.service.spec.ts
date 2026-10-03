import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';
import { EncryptedStore } from './encrypted-store.service';

describe('EncryptedStore', () => {
  let store: EncryptedStore;
  const KEY = 'test.encrypted.record';

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(EncryptedStore);
    await Preferences.remove({ key: KEY });
  });

  it('round-trips a value', async () => {
    await store.set(KEY, '{"cavity":"unknown"}');
    expect(await store.get(KEY)).toBe('{"cavity":"unknown"}');
  });

  it('never stores the plain text', async () => {
    await store.set(KEY, 'Two intramural fibroids are noted.');
    const { value } = await Preferences.get({ key: KEY });
    expect(value).toMatch(/^enc:v1:/);
    expect(value).not.toContain('fibroids');
  });

  it('uses a new IV each time, so the same record encrypts differently', async () => {
    await store.set(KEY, 'same');
    const first = (await Preferences.get({ key: KEY })).value;
    await store.set(KEY, 'same');
    const second = (await Preferences.get({ key: KEY })).value;
    expect(first).not.toBe(second);
  });

  it('migrates a value saved before encryption and encrypts it in place', async () => {
    await Preferences.set({ key: KEY, value: '{"old":"plain"}' });
    expect(await store.get(KEY)).toBe('{"old":"plain"}');
    const { value } = await Preferences.get({ key: KEY });
    expect(value).toMatch(/^enc:v1:/);
    expect(await store.get(KEY)).toBe('{"old":"plain"}');
  });

  it('returns null for tampered data instead of throwing', async () => {
    await store.set(KEY, 'secret');
    const { value } = await Preferences.get({ key: KEY });
    const tampered = value!.slice(0, -4) + (value!.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    await Preferences.set({ key: KEY, value: tampered });
    expect(await store.get(KEY)).toBeNull();
  });

  it('returns null when nothing is stored', async () => {
    expect(await store.get(KEY)).toBeNull();
  });
});
