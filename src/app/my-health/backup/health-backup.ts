import { CareTask, FINDING_KEYS, Finding, FindingKey, HealthRecord, HealthReport, SymptomEntry, VisitReview, AppointmentQuestion } from '../diagnosis.model';

const FORMAT = 'sanelle-health-backup';
const ITERATIONS = 210_000;
const MAX_BYTES = 15 * 1024 * 1024;
/** Backups are only as strong as their passphrase; shorter ones are refused. */
export const MIN_PASSPHRASE_LENGTH = 12;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('This backup contains invalid health records.');
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 20_000): string {
  if (typeof value !== 'string' || value.length > max) throw new Error('This backup contains invalid text.');
  return value;
}
function optional(value: unknown): string | undefined { return value === undefined ? undefined : text(value); }
function list(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > 20_000) throw new Error('This backup contains an invalid list.');
  return value;
}
function date(value: unknown): string {
  const iso = text(value, 10);
  const parsed = new Date(iso + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) throw new Error('This backup contains an invalid date.');
  return iso;
}
function optionalDate(value: unknown): string | undefined { return value === undefined ? undefined : date(value); }
function timestamp(value: unknown): string {
  const iso = text(value, 40);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(iso) || isNaN(new Date(iso).getTime())) throw new Error('This backup contains an invalid time.');
  return iso;
}
function id(value: unknown): string {
  const valueText = text(value, 200);
  if (!/^[a-zA-Z0-9_.:-]+$/.test(valueText)) throw new Error('This backup contains an invalid identifier.');
  return valueText;
}
function findings(value: unknown): HealthRecord['findings'] {
  const source = object(value);
  return FINDING_KEYS.reduce<HealthRecord['findings']>((out, key) => {
    if (source[key] === undefined) return out;
    const finding = object(source[key]);
    const completeness = object(finding['completeness']);
    if (finding['key'] !== key || !['present', 'absent', 'unknown'].includes(String(completeness['state']))) throw new Error('Invalid finding in backup.');
    const f: Finding = { key, completeness: completeness['state'] === 'present' ? { state: 'present', value: text(completeness['value']) } : { state: completeness['state'] as 'absent' | 'unknown' } };
    if (finding['source'] !== undefined) {
      if (!['entered-from-report', 'told-by-clinician', 'self-reported', 'extracted-and-confirmed'].includes(String(finding['source']))) throw new Error('Invalid source in backup.');
      f.source = finding['source'] as Finding['source'];
    }
    f.originalWording = optional(finding['originalWording']); f.reportDate = optionalDate(finding['reportDate']);
    f.updatedAt = finding['updatedAt'] === undefined ? undefined : timestamp(finding['updatedAt']);
    return { ...out, [key]: f };
  }, {});
}

/** Validate and rebuild known fields; imported objects cannot add arbitrary storage properties. */
export function validateHealthRecord(value: unknown): HealthRecord {
  const r = object(value);
  if (r['version'] !== 1) throw new Error('This health-record version is not supported.');
  const appointment = object(r['appointment']);
  const result: HealthRecord = {
    version: 1, findings: findings(r['findings']), summaryNotes: text(r['summaryNotes']),
    appointment: { date: optionalDate(appointment['date']), with: optional(appointment['with']) },
    questions: list(r['questions']).map((value): AppointmentQuestion => {
      const q = object(value); const key = q['findingKey'];
      if (key !== undefined && !FINDING_KEYS.includes(key as FindingKey)) throw new Error('Invalid question source.');
      if (q['origin'] !== 'suggested' && q['origin'] !== 'custom') throw new Error('Invalid question origin.');
      return { id: id(q['id']), text: text(q['text']), findingKey: key as FindingKey | undefined, origin: q['origin'], answer: optional(q['answer']), createdAt: timestamp(q['createdAt']) };
    }),
    symptoms: list(r['symptoms']).map((value): SymptomEntry => {
      const s = object(value); const entry: SymptomEntry = { date: date(s['date']), notes: optional(s['notes']), treatmentChange: optional(s['treatmentChange']) };
      if (s['bleeding'] !== undefined) {
        if (!['none', 'spotting', 'light', 'moderate', 'heavy', 'very-heavy'].includes(String(s['bleeding']))) throw new Error('Invalid bleeding entry.');
        entry.bleeding = s['bleeding'] as SymptomEntry['bleeding'];
      }
      if (s['pain'] !== undefined) { if (!Number.isInteger(s['pain']) || Number(s['pain']) < 0 || Number(s['pain']) > 10) throw new Error('Invalid pain entry.'); entry.pain = Number(s['pain']); }
      for (const field of ['bloating', 'fatigue'] as const) {
        if (s[field] === undefined) continue;
        if (!['none', 'mild', 'moderate', 'severe'].includes(String(s[field]))) throw new Error('Invalid symptom entry.');
        entry[field] = s[field] as SymptomEntry['bloating'];
      }
      if (s['affected'] !== undefined) entry.affected = list(s['affected']).map((v) => { if (!['sleep', 'work', 'daily'].includes(String(v))) throw new Error('Invalid impact entry.'); return v as 'sleep' | 'work' | 'daily'; });
      entry.updatedAt = s['updatedAt'] === undefined ? undefined : timestamp(s['updatedAt']);
      return entry;
    }),
  };
  result.visitGoal = optional(r['visitGoal']);
  if (r['summaryIncludesCheckins'] !== undefined) { if (typeof r['summaryIncludesCheckins'] !== 'boolean') throw new Error('Invalid summary selection.'); result.summaryIncludesCheckins = r['summaryIncludesCheckins']; }
  if (r['summaryPeriodDays'] !== undefined) { if (![14, 30, 90].includes(Number(r['summaryPeriodDays']))) throw new Error('Invalid summary period.'); result.summaryPeriodDays = r['summaryPeriodDays'] as 14 | 30 | 90; }
  if (r['visits'] !== undefined) result.visits = list(r['visits']).map((value): VisitReview => { const v = object(value); return { date: date(v['date']), discussion: text(v['discussion']), nextSteps: text(v['nextSteps']), followUp: text(v['followUp']) }; });
  if (r['tasks'] !== undefined) result.tasks = list(r['tasks']).map((value): CareTask => {
    const t = object(value); return { id: id(t['id']), title: text(t['title'], 500), createdAt: timestamp(t['createdAt']), dueDate: optionalDate(t['dueDate']), visitDate: optionalDate(t['visitDate']), completedAt: t['completedAt'] === undefined ? undefined : timestamp(t['completedAt']), reminderAt: t['reminderAt'] === undefined ? undefined : timestamp(t['reminderAt']) };
  });
  if (r['reports'] !== undefined) result.reports = list(r['reports']).map((value): HealthReport => { const report = object(value); return { id: id(report['id']), title: text(report['title'], 500), reportDate: optionalDate(report['reportDate']), savedAt: timestamp(report['savedAt']), findings: findings(report['findings']) }; });
  if (r['activeReportId'] !== undefined) {
    result.activeReportId = id(r['activeReportId']);
    const active = result.reports?.find((report) => report.id === result.activeReportId);
    if (!active) throw new Error('The selected report is missing from this backup.');
    result.findings = active.findings;
  }
  for (const key of ['summaryQuestionIds', 'summaryAnswerIds', 'summarySymptomDates', 'summaryVisitDates'] as const) {
    if (r[key] !== undefined) result[key] = list(r[key]).map((v) => key.endsWith('Dates') ? date(v) : id(v));
  }
  for (const records of [result.questions, result.tasks ?? [], result.reports ?? []]) {
    if (new Set(records.map((entry) => entry.id)).size !== records.length) throw new Error('Duplicate records in backup.');
  }
  return result;
}
function encode(bytes: Uint8Array): string { let binary = ''; bytes.forEach((b) => binary += String.fromCharCode(b)); return btoa(binary); }
function decode(value: unknown, length?: number): Uint8Array<ArrayBuffer> {
  const binary = atob(text(value, MAX_BYTES)); const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  if (length && bytes.length !== length) throw new Error('Invalid backup encryption data.');
  return bytes;
}
async function keyFor(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptBackup(record: HealthRecord, password: string): Promise<string> {
  if (password.length < MIN_PASSPHRASE_LENGTH) throw new Error(`Use a backup passphrase with at least ${MIN_PASSPHRASE_LENGTH} characters.`);
  const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = JSON.stringify({ record: validateHealthRecord(record), exportedAt: new Date().toISOString() });
  if (payload.length > 10 * 1024 * 1024) throw new Error('These records exceed the backup size limit. Your records are still saved on this device.');
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFor(password, salt), new TextEncoder().encode(payload));
  return JSON.stringify({ format: FORMAT, version: 1, iterations: ITERATIONS, salt: encode(salt), iv: encode(iv), data: encode(new Uint8Array(encrypted)) });
}
export async function decryptBackup(content: string, password: string): Promise<{ record: HealthRecord; exportedAt: string }> {
  if (content.length > MAX_BYTES) throw new Error('Choose a Sanelle backup smaller than 15 MB.');
  let envelope: Record<string, unknown>;
  try { envelope = object(JSON.parse(content)); } catch { throw new Error('Choose an encrypted Sanelle health backup.'); }
  if (envelope['format'] !== FORMAT || envelope['version'] !== 1 || envelope['iterations'] !== ITERATIONS) throw new Error('This backup format is not supported.');
  let payload: unknown;
  try {
    const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(envelope['iv'], 12) }, await keyFor(password, decode(envelope['salt'], 16)), decode(envelope['data']));
    payload = JSON.parse(new TextDecoder().decode(bytes));
  } catch { throw new Error('The passphrase is incorrect or this backup is damaged. Nothing has been restored.'); }
  const unpacked = object(payload);
  return { record: validateHealthRecord(unpacked['record']), exportedAt: timestamp(unpacked['exportedAt']) };
}
