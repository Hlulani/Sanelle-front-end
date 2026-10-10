import { Injectable, computed } from '@angular/core';
import { AccountRecordStore } from '../core/storage/account-record-store';
import { accountKey } from '../core/storage/account-key';
import {
  AppointmentQuestion,
  Appointment,
  ClinicalResult,
  Finding,
  FindingKey,
  HealthRecord,
  QuestionEvent,
  QuestionStatus,
  ReportSource,
  SymptomEntry,
  VisitReview,
  CareTask,
  HealthReport,
  emptyHealthRecord,
  hasContent,
  questionStatus,
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

function byKey(findings: Finding[]): HealthReport['findings'] {
  return findings.reduce<HealthReport['findings']>((all, finding) => ({ ...all, [finding.key]: finding }), {});
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

  /**
   * Keeps a report whose details haven't been compared with it yet ("Save and finish later").
   * It never changes the current details or the appointment summary until it is checked.
   */
  async saveReportForLater(
    findings: Finding[],
    meta: { id?: string; title: string; reportDate?: string; source: ReportSource; pageCount?: number },
  ): Promise<string> {
    const id = meta.id ?? newId();
    await this.update((r) => {
      const savedAt = new Date().toISOString();
      const report: HealthReport = {
        id,
        title: meta.title.trim() || 'My report',
        reportDate: meta.reportDate,
        savedAt,
        source: meta.source,
        pageCount: meta.pageCount,
        status: 'needs-checking',
        findings: byKey(findings.map((f) => ({ ...f, needsChecking: true, updatedAt: savedAt }))),
      };
      return { ...r, reports: [...(r.reports ?? []).filter((item) => item.id !== id), report] };
    });
    return id;
  }

  /**
   * Saves a report the person compared with the original, and makes its details the current
   * ones. Confirmation covers transcription only; it is never clinician verification.
   */
  async saveCheckedReport(
    findings: Finding[],
    meta: { id?: string; title: string; reportDate?: string; source: ReportSource; pageCount?: number },
  ): Promise<string> {
    const id = meta.id ?? newId();
    await this.update((r) => {
      const savedAt = new Date().toISOString();
      const checked = byKey(findings.map((f) => ({ ...f, needsChecking: false, updatedAt: savedAt })));
      const report: HealthReport = {
        id,
        title: meta.title.trim() || 'My report',
        reportDate: meta.reportDate,
        savedAt: (r.reports ?? []).find((item) => item.id === id)?.savedAt ?? savedAt,
        source: meta.source,
        pageCount: meta.pageCount,
        status: 'checked',
        checkedAt: savedAt,
        findings: checked,
      };
      const reports = (r.reports ?? []).filter((item) => item.id !== id);
      // Details recorded before any report (e.g. during setup) are kept as their own entry.
      if (!r.activeReportId && Object.keys(r.findings).length) {
        reports.push({
          id: newId(),
          title: 'Details I added myself',
          savedAt,
          status: 'checked',
          findings: r.findings,
        });
      }
      return { ...r, reports: [...reports, report], activeReportId: id, findings: checked };
    });
    return id;
  }

  report(id: string): HealthReport | undefined {
    return this.state().reports?.find((report) => report.id === id);
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

  addQuestion(text: string, findingKey?: FindingKey, sourceLabel?: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return Promise.resolve();
    return this.update((r) => {
      if (r.questions.some((q) => q.text.toLowerCase() === trimmed.toLowerCase())) return r;
      const q: AppointmentQuestion = {
        id: newId(),
        text: trimmed,
        findingKey,
        origin: findingKey ? 'suggested' : 'custom',
        sourceLabel,
        status: 'open',
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

  /** Records what the clinician said, in the person's own words. */
  answerQuestion(id: string, answer: string, visitDate?: string): Promise<void> {
    const text = answer.trim();
    if (!text) return Promise.reject(new UserFacingError('Write the answer in your own words, or mark it unresolved.'));
    return this.recordQuestionEvent(id, { status: 'answered', answer: text, visitDate });
  }

  /** Asked, but not answered. Kept apart from questions that were never asked. */
  markUnresolved(id: string, note?: string, visitDate?: string): Promise<void> {
    return this.recordQuestionEvent(id, { status: 'unresolved', note: note?.trim() || undefined, visitDate });
  }

  /** Puts an unresolved question back on the list for the next visit, keeping its history. */
  carryForward(id: string): Promise<void> {
    return this.recordQuestionEvent(id, { status: 'open', note: 'Carried forward to my next visit' });
  }

  /** The answer and its agreed next step share one encrypted write. */
  saveQuestionOutcome(
    id: string,
    status: 'answered' | 'unresolved',
    text: string,
    visitDate: string,
    task?: { title: string; dueDate?: string },
  ): Promise<void> {
    const answer = text.trim();
    if (status === 'answered' && !answer)
      return Promise.reject(new UserFacingError('Write the answer in your own words, or mark it unresolved.'));
    return this.recordQuestionEvent(
      id,
      { status, visitDate, ...(status === 'answered' ? { answer } : { note: answer || undefined }) },
      task,
    );
  }

  private recordQuestionEvent(
    id: string,
    event: Omit<QuestionEvent, 'at'>,
    task?: { title: string; dueDate?: string },
  ): Promise<void> {
    return this.update((r) => {
      if (!r.questions.some((q) => q.id === id)) throw new UserFacingError('This question is no longer saved.');
      const at = new Date().toISOString();
      return {
        ...r,
        ...(task?.title.trim()
          ? {
              tasks: [
                ...(r.tasks ?? []),
                {
                  id: newId(),
                  createdAt: at,
                  title: task.title.trim(),
                  dueDate: task.dueDate,
                  visitDate: event.visitDate,
                  questionId: id,
                },
              ],
            }
          : {}),
        questions: r.questions.map((q) => {
          if (q.id !== id) return q;
          const history = [...(q.history ?? [])];
          // An answer recorded before history existed is kept as the first entry.
          if (!q.history && q.answer?.trim()) history.push({ at: q.createdAt, status: 'answered', answer: q.answer });
          history.push({ at, ...event });
          const status: QuestionStatus = event.status;
          return { ...q, status, answer: status === 'answered' ? event.answer : q.answer, history };
        }),
      };
    });
  }

  questionsWithStatus(status: QuestionStatus): AppointmentQuestion[] {
    return this.state().questions.filter((q) => questionStatus(q) === status);
  }

  saveResult(result: Omit<ClinicalResult, 'id' | 'savedAt'> & { id?: string }): Promise<void> {
    const name = result.name.trim();
    const value = result.value.trim();
    if (!name) return Promise.reject(new UserFacingError('Add the result name, as it appears on the result.'));
    if (!value) return Promise.reject(new UserFacingError('Add the exact value.'));
    return this.update((r) => {
      const saved: ClinicalResult = {
        ...result,
        id: result.id ?? newId(),
        name,
        value,
        unit: result.unit.trim(),
        source: result.source.trim(),
        savedAt: new Date().toISOString(),
      };
      return { ...r, results: [...(r.results ?? []).filter((item) => item.id !== saved.id), saved] };
    });
  }

  removeResult(id: string): Promise<void> {
    return this.update((r) => ({ ...r, results: (r.results ?? []).filter((item) => item.id !== id) }));
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
