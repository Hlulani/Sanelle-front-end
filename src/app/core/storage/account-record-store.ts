import { inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { EncryptedStore } from './encrypted-store.service';
import { accountKey } from './account-key';
import { UserFacingError } from '../errors/errors';

/**
 * One encrypted record per account, kept on this device. Subclasses say what the record is
 * (its key prefix, its empty value and how to read it back); this class enforces the rules
 * every such record follows:
 *  - It loads once per account, and a slow load never overwrites a newer account's state.
 *  - Writes apply one at a time, each to the latest saved state, so rapid edits aren't lost.
 *  - A write is refused if the signed-in account changes while it waits.
 *  - New state is shown only after encrypted storage has accepted it.
 */
export abstract class AccountRecordStore<T> {
  protected readonly auth = inject(AuthService);
  private readonly store = inject(EncryptedStore);

  protected readonly state = signal<T>(this.empty());
  private loadedFor: string | null = null;
  private loading: Promise<void> | null = null;
  private queue: Promise<void> = Promise.resolve();
  private pendingWrites = 0;
  private readonly savingState = signal(false);

  /** True while any change is waiting to be stored. */
  readonly saving = this.savingState.asReadonly();

  protected abstract readonly keyPrefix: string;

  /** The record for an account with nothing saved yet. */
  protected abstract empty(): T;

  /** Turns stored JSON back into a record, falling back to `empty()` for anything it can't use. */
  protected abstract revive(stored: unknown): T;

  /** Loads the signed-in account's record. Safe to call repeatedly. */
  load(): Promise<void> {
    const email = this.auth.getUserEmail();
    if (!email) {
      this.reset();
      return Promise.resolve();
    }
    const key = this.keyFor(email);
    if (this.loadedFor === key && this.loading) return this.loading;
    this.loadedFor = key;
    this.loading = (async () => {
      const record = this.read(await this.store.get(key));
      if (this.loadedFor === key) this.state.set(record);
    })();
    return this.loading;
  }

  /** Removes one account's record from this device (used when deleting the account). */
  async clearFor(email: string): Promise<void> {
    await this.queue;
    const key = this.keyFor(email);
    await this.store.remove(key);
    if (this.loadedFor === key) this.reset();
  }

  protected keyFor(email: string): string {
    return accountKey(this.keyPrefix, email);
  }

  /** Queues a change to the signed-in account's record; it resolves once the change is stored. */
  protected update(change: (current: T) => T): Promise<void> {
    const email = this.auth.getUserEmail();
    this.pendingWrites++;
    this.savingState.set(true);
    const saved = this.queue
      .then(async () => {
        this.assertStillSignedIn(email);
        await this.load();
        this.assertStillSignedIn(email);
        const next = change(this.state());
        if (next === this.state()) return;
        await this.store.set(this.keyFor(email!), JSON.stringify(next));
        if (this.auth.getUserEmail() === email) this.state.set(next);
      })
      .finally(() => {
        if (--this.pendingWrites === 0) this.savingState.set(false);
      });
    this.queue = saved.catch(() => undefined);
    return saved;
  }

  private assertStillSignedIn(email: string | null): void {
    if (!email || this.auth.getUserEmail() !== email) {
      throw new UserFacingError('The signed-in account changed. Sign in again and try once more.');
    }
  }

  private read(value: string | null): T {
    if (!value) return this.empty();
    try {
      return this.revive(JSON.parse(value));
    } catch {
      return this.empty(); // An unreadable record starts empty instead of crashing the app.
    }
  }

  private reset(): void {
    this.state.set(this.empty());
    this.loadedFor = null;
    this.loading = null;
  }
}
