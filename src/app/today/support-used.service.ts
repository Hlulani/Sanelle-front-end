import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { AuthService } from '../core/auth/auth.service';
import { SupportId } from './checkin-support';

/** Which check-in suggestions she has already used today, per account, so they don't keep coming back. */
@Injectable({ providedIn: 'root' })
export class SupportUsedService {
  private auth = inject(AuthService);
  readonly used = signal<SupportId[]>([]);

  private key(): string | null {
    const email = this.auth.getUserEmail();
    return email ? `checkin_support_used.${email.toLowerCase()}` : null;
  }

  async load(today: string): Promise<void> {
    const key = this.key();
    if (!key) return this.used.set([]);
    const { value } = await Preferences.get({ key });
    try {
      const parsed = value ? (JSON.parse(value) as { date: string; ids: SupportId[] }) : null;
      this.used.set(parsed?.date === today ? parsed.ids : []);
    } catch {
      this.used.set([]);
    }
  }

  async markUsed(id: SupportId, today: string): Promise<void> {
    const ids = [...new Set([...this.used(), id])];
    this.used.set(ids);
    const key = this.key();
    if (key) await Preferences.set({ key, value: JSON.stringify({ date: today, ids }) });
  }
}
