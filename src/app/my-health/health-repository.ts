import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { AuthService } from '../core/auth/auth.service';
import {
  AppointmentQuestion,
  Appointment,
  Finding,
  FindingKey,
  HealthRecord,
  emptyHealthRecord,
} from './diagnosis.model';

/**
 * Health records live on the device only, stored per account so another person
 * signing in on the same phone never sees them. Optional sync can be added later
 * behind this same interface without changing the screens.
 *
 * Note: Capacitor Preferences is not encrypted at rest. Move to encrypted storage
 * before this holds real records on a shared or unmanaged device.
 */
const KEY_PREFIX = 'sanelle.health.v1.';

export function storageKeyFor(email: string): string {
  return KEY_PREFIX + email.trim().toLowerCase();
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

@Injectable({ providedIn: 'root' })
export class HealthRepository {
  private auth = inject(AuthService);

  private readonly state = signal<HealthRecord>(emptyHealthRecord());
  private loadedFor: string | null = null;
  private loading: Promise<void> | null = null;

  readonly record = this.state.asReadonly();
  readonly questions = computed(() => this.state().questions);
  readonly hasAnyFinding = computed(() => Object.keys(this.state().findings).length > 0);

  /** Loads the signed-in person's record. Safe to call repeatedly. */
  load(): Promise<void> {
    const email = this.auth.getUserEmail();
    if (!email) {
      this.state.set(emptyHealthRecord());
      this.loadedFor = null;
      return Promise.resolve();
    }
    const key = storageKeyFor(email);
    if (this.loadedFor === key && this.loading) return this.loading;
    this.loadedFor = key;
    this.loading = (async () => {
      const { value } = await Preferences.get({ key });
      let record = emptyHealthRecord();
      if (value) {
        try {
          const parsed = JSON.parse(value) as HealthRecord;
          if (parsed?.version === 1) record = { ...emptyHealthRecord(), ...parsed };
        } catch {
          // A corrupt record is ignored rather than crashing the app.
        }
      }
      this.state.set(record);
    })();
    return this.loading;
  }

  saveFinding(finding: Finding): Promise<void> {
    const stamped: Finding = { ...finding, updatedAt: new Date().toISOString() };
    // An unknown finding carries no source: there is nothing it came from.
    if (stamped.completeness.state === 'unknown') {
      delete stamped.source;
      delete stamped.originalWording;
    }
    return this.update((r) => ({ ...r, findings: { ...r.findings, [finding.key]: stamped } }));
  }

  addQuestion(text: string, findingKey?: FindingKey): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return Promise.resolve();
    return this.update((r) => {
      if (r.questions.some((q) => q.text.toLowerCase() === trimmed.toLowerCase())) return r;
      const q: AppointmentQuestion = {
        id: newId(),
        text: trimmed,
        findingKey,
        origin: findingKey ? 'suggested' : 'custom',
        createdAt: new Date().toISOString(),
      };
      return { ...r, questions: [...r.questions, q] };
    });
  }

  updateQuestion(id: string, changes: Partial<Pick<AppointmentQuestion, 'text' | 'answer'>>): Promise<void> {
    return this.update((r) => ({
      ...r,
      questions: r.questions.map((q) => (q.id === id ? { ...q, ...changes } : q)),
    }));
  }

  removeQuestion(id: string): Promise<void> {
    return this.update((r) => ({ ...r, questions: r.questions.filter((q) => q.id !== id) }));
  }

  moveQuestion(id: string, delta: -1 | 1): Promise<void> {
    return this.update((r) => {
      const list = [...r.questions];
      const i = list.findIndex((q) => q.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= list.length) return r;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...r, questions: list };
    });
  }

  setAppointment(appointment: Appointment): Promise<void> {
    return this.update((r) => ({ ...r, appointment }));
  }

  setSummaryNotes(notes: string): Promise<void> {
    return this.update((r) => ({ ...r, summaryNotes: notes }));
  }

  /** Removes this person's records from the device (used when deleting the account). */
  async clearCurrentUser(): Promise<void> {
    const email = this.auth.getUserEmail();
    if (email) await this.clearFor(email);
  }

  async clearFor(email: string): Promise<void> {
    await Preferences.remove({ key: storageKeyFor(email) });
    if (this.loadedFor === storageKeyFor(email)) {
      this.state.set(emptyHealthRecord());
      this.loadedFor = null;
      this.loading = null;
    }
  }

  private async update(change: (r: HealthRecord) => HealthRecord): Promise<void> {
    await this.load();
    const email = this.auth.getUserEmail();
    if (!email) return;
    const next = change(this.state());
    if (next === this.state()) return;
    this.state.set(next);
    await Preferences.set({ key: storageKeyFor(email), value: JSON.stringify(next) });
  }
}
