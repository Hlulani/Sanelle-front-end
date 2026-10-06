import { Injectable, computed } from '@angular/core';
import { AccountRecordStore } from '../core/storage/account-record-store';
import { accountKey } from '../core/storage/account-key';
import {
  AppointmentQuestion,
  Appointment,
  Finding,
  FindingKey,
  HealthRecord,
  SymptomEntry,
  VisitReview,
  CareTask,
  HealthReport,
  emptyHealthRecord,
  hasContent,
  unansweredQuestions,
} from './diagnosis.model';
import { UserFacingError } from '../core/errors/errors';

/**
 * Health records live on the device only, stored per account so another person
 * signing in on the same phone never sees them. Optional sync can be added later
 * behind this same interface without changing the screens.
 *
 * Records are encrypted before they're saved (see EncryptedStore).
 */
const KEY_PREFIX = 'sanelle.health.v1.';

export function storageKeyFor(email: string): string {
  return accountKey(KEY_PREFIX, email);
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

@Injectable({ providedIn: 'root' })
export class HealthRepository extends AccountRecordStore<HealthRecord> {
  protected readonly keyPrefix = KEY_PREFIX;

  readonly record = this.state.asReadonly();
  readonly questions = computed(() => this.state().questions);
  readonly hasAnyFinding = computed(() => Object.keys(this.state().findings).length > 0);

  protected empty(): HealthRecord {
    return emptyHealthRecord();
  }

  protected revive(stored: unknown): HealthRecord {
    const parsed = stored as HealthRecord | null;
    return parsed?.version === 1 ? { ...emptyHealthRecord(), ...parsed } : emptyHealthRecord();
  }

  saveFinding(finding: Finding): Promise<void> {
    return this.saveFindings([finding]);
  }

  /** Saves manual edits together, preserving unedited fields and the report's prior revision. */
  saveFindings(findings: Finding[]): Promise<void> {
    const changes = findings.map((finding) => {
      const stamped: Finding = { ...finding, updatedAt: new Date().toISOString() };
      // An unknown finding carries no source: there is nothing it came from.
      if (stamped.completeness.state === 'unknown') {
        delete stamped.source;
        delete stamped.originalWording;
        delete stamped.reportDate;
      }
      return stamped;
    });
    return this.update((r) => {
      const next = changes.reduce((all, f) => ({ ...all, [f.key]: f }), r.findings);
      // Editing the overview preserves a dated revision of the selected report.
      const reports = r.activeReportId
        ? (r.reports ?? []).map((report) => (report.id === r.activeReportId ? { ...report, findings: next } : report))
        : r.reports;
      const prior = r.activeReportId ? (r.reports ?? []).find((report) => report.id === r.activeReportId) : undefined;
      return {
        ...r,
        findings: next,
        reports: prior
          ? [...(reports ?? []), { ...prior, id: newId(), title: prior.title + ' · before edit' }]
          : reports,
      };
    });
  }

  saveReport(findings: Finding[], title: string, reportDate?: string, makeCurrent = true): Promise<void> {
    return this.update((r) => {
      const savedAt = new Date().toISOString();
      const report: HealthReport = {
        id: newId(),
        title: title.trim() || 'My report',
        reportDate,
        savedAt,
        findings: findings.reduce<HealthReport['findings']>(
          (all, finding) => ({ ...all, [finding.key]: { ...finding, updatedAt: savedAt } }),
          {},
        ),
      };
      const reports = [...(r.reports ?? [])];
      let activeReportId = r.activeReportId;
      if (!r.activeReportId && Object.keys(r.findings).length) {
        const previous = { id: newId(), title: 'Previously recorded details', savedAt, findings: r.findings };
        reports.push(previous);
        activeReportId = previous.id;
      }
      reports.push(report);
      return {
        ...r,
        reports,
        activeReportId: makeCurrent ? report.id : activeReportId,
        ...(makeCurrent ? { findings: report.findings } : {}),
      };
    });
  }

  selectReport(id: string): Promise<void> {
    return this.update((r) => {
      const report = r.reports?.find((item) => item.id === id);
      if (!report) throw new UserFacingError('Report not found.');
      return { ...r, activeReportId: id, findings: report.findings };
    });
  }

  saveTask(task: Omit<CareTask, 'id' | 'createdAt'> & { id?: string }): Promise<void> {
    return this.update((r) => {
      const prior = r.tasks?.find((item) => item.id === task.id);
      const next: CareTask = {
        ...task,
        id: prior?.id ?? newId(),
        createdAt: prior?.createdAt ?? new Date().toISOString(),
        title: task.title.trim(),
      };
      if (!next.title) throw new UserFacingError('Add a next step.');
      return { ...r, tasks: [...(r.tasks ?? []).filter((item) => item.id !== next.id), next] };
    });
  }

  completeTask(id: string, completed: boolean): Promise<void> {
    return this.update((r) => ({
      ...r,
      tasks: (r.tasks ?? []).map((task) =>
        task.id === id ? { ...task, completedAt: completed ? new Date().toISOString() : undefined } : task,
      ),
    }));
  }

  removeTask(id: string): Promise<void> {
    return this.update((r) => ({ ...r, tasks: (r.tasks ?? []).filter((task) => task.id !== id) }));
  }

  setSummarySelection(
    changes: Partial<
      Pick<HealthRecord, 'summaryQuestionIds' | 'summaryAnswerIds' | 'summarySymptomDates' | 'summaryVisitDates'>
    >,
  ): Promise<void> {
    return this.update((r) => ({ ...r, ...changes }));
  }

  toggleSummarySelection(
    key: keyof Pick<
      HealthRecord,
      'summaryQuestionIds' | 'summaryAnswerIds' | 'summarySymptomDates' | 'summaryVisitDates'
    >,
    id: string,
    include: boolean,
  ): Promise<void> {
    return this.update((r) => {
      const defaults =
        key === 'summaryQuestionIds'
          ? unansweredQuestions(r)
              .slice(0, 3)
              .map((q) => q.id)
          : key === 'summarySymptomDates'
            ? r.symptoms.map((entry) => entry.date)
            : [];
      const current = r[key] ?? defaults;
      return { ...r, [key]: include ? [...new Set([...current, id])] : current.filter((value) => value !== id) };
    });
  }

  restoreRecord(record: HealthRecord): Promise<void> {
    return this.update(() => record);
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

  /** Saves one day's check-in, replacing any earlier entry for that date. An empty entry removes the day. */
  saveSymptoms(entry: SymptomEntry): Promise<void> {
    const stamped: SymptomEntry = { ...entry, updatedAt: new Date().toISOString() };
    return this.update((r) => {
      const others = r.symptoms.filter((s) => s.date !== entry.date);
      const symptoms = hasContent(stamped) ? [...others, stamped] : others;
      symptoms.sort((a, b) => a.date.localeCompare(b.date));
      return { ...r, symptoms };
    });
  }

  symptomsOn(date: string): SymptomEntry | undefined {
    return this.state().symptoms.find((s) => s.date === date);
  }

  setAppointment(appointment: Appointment): Promise<void> {
    return this.update((r) => ({ ...r, appointment: { ...r.appointment, ...appointment } }));
  }

  setVisitGoal(goal: string): Promise<void> {
    return this.update((r) => ({ ...r, visitGoal: goal.trim() }));
  }

  saveVisit(visit: VisitReview): Promise<void> {
    return this.update((r) => ({
      ...r,
      visits: [...(r.visits ?? []).filter((v) => v.date !== visit.date), visit].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    }));
  }

  setSummaryNotes(notes: string): Promise<void> {
    return this.update((r) => ({ ...r, summaryNotes: notes }));
  }

  setSummaryIncludesCheckins(include: boolean): Promise<void> {
    return this.update((r) => ({ ...r, summaryIncludesCheckins: include }));
  }

  setSummaryPeriodDays(days: 14 | 30 | 90): Promise<void> {
    return this.update((r) => ({ ...r, summaryPeriodDays: days }));
  }

  /** Removes this person's records from the device (used when deleting the account). */
  async clearCurrentUser(): Promise<void> {
    const email = this.auth.getUserEmail();
    if (email) await this.clearFor(email);
  }
}
