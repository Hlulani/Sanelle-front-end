import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { ProfileService } from '../profile/profile.service';
import { EncryptedStore } from './encrypted-store.service';

describe('Account record load recovery', () => {
  it('retries a failed read and only permits writes after a successful load', async () => {
    const store = jasmine.createSpyObj<EncryptedStore>('EncryptedStore', ['get', 'set']);
    store.get.and.rejectWith(new Error('Storage temporarily unavailable'));
    store.set.and.resolveTo();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getUserEmail: () => 'test@example.test', getDisplayName: () => '' } },
        { provide: EncryptedStore, useValue: store },
      ],
    });
    const profile = TestBed.inject(ProfileService);
    await expectAsync(profile.load()).toBeRejected();
    await expectAsync(profile.save({ name: 'New name' })).toBeRejected();
    expect(store.set).not.toHaveBeenCalled();
    store.get.and.resolveTo(JSON.stringify({ version: 1, name: 'Saved name' }));
    await profile.load();
    expect(profile.name()).toBe('Saved name');
    await profile.save({ name: 'New name' });
    expect(profile.name()).toBe('New name');
  });
});
