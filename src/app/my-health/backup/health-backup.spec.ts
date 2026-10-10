import { decryptBackup, encryptBackup, validateHealthRecord } from './health-backup';
import { emptyHealthRecord, HealthRecord } from '../diagnosis.model';

const record = (): HealthRecord => ({
  ...emptyHealthRecord(),
  visitGoal: 'Discuss bleeding',
  questions: [{ id: 'q1', text: 'What should I monitor?', origin: 'custom', createdAt: '2026-10-04T00:00:00Z' }],
  symptoms: [{ date: '2026-10-03', pain: 7, affected: ['work'], notes: 'A private note' }],
  visits: [{ date: '2026-10-02', discussion: 'My discussion', nextSteps: 'Arrange follow-up', followUp: '' }],
  tasks: [{ id: 't1', title: 'Book follow-up', dueDate: '2026-11-01', createdAt: '2026-10-04T00:00:00Z' }],
});

describe('Encrypted health backups', () => {
  it('restores records with the passphrase without writing readable health information into the file', async () => {
    const original = record();
    const content = await encryptBackup(original, 'a long private passphrase');
    expect(content).not.toContain('bleeding');
    expect(content).not.toContain('private note');
    const restored = await decryptBackup(content, 'a long private passphrase');
    expect(restored.record.visitGoal).toBe(original.visitGoal);
    expect(restored.record.tasks?.[0].dueDate).toBe('2026-11-01');
    expect(restored.record.symptoms[0].notes).toBe('A private note');
    expect(restored.record.questions[0].text).toBe('What should I monitor?');
  });
  it('rejects wrong passwords and tampered ciphertext', async () => {
    const content = await encryptBackup(record(), 'a long private passphrase');
    await expectAsync(decryptBackup(content, 'an incorrect passphrase')).toBeRejected();
    const envelope = JSON.parse(content);
    envelope.data = 'AAAA' + envelope.data.slice(4);
    await expectAsync(decryptBackup(JSON.stringify(envelope), 'a long private passphrase')).toBeRejected();
  });
  it('rejects invalid records and unsupported encryption before restoration', async () => {
    expect(() => validateHealthRecord({ ...record(), symptoms: [{ date: '2026-02-31', pain: 20 }] })).toThrow();
    expect(() => validateHealthRecord({ ...record(), activeReportId: 'missing' })).toThrow();
    expect(() =>
      validateHealthRecord({ ...record(), questions: [...record().questions, ...record().questions] }),
    ).toThrow();
    await expectAsync(decryptBackup('{"format":"other"}', 'password')).toBeRejected();
    await expectAsync(encryptBackup(record(), 'short')).toBeRejected();
  });
});

describe('Redesigned record backup compatibility', () => {
  it('restores source symptom selections, daily impact and the question associated with a next step', async () => {
    const original = record();
    original.symptoms = [
      { date: '2026-10-08', observedSymptoms: ['Pain', 'Low energy'], dailyImpact: 'Changed my plans' },
    ];
    original.tasks![0].questionId = 'q1';
    const restored = (
      await decryptBackup(await encryptBackup(original, 'a long private passphrase'), 'a long private passphrase')
    ).record;
    expect(restored.symptoms[0].observedSymptoms).toEqual(['Pain', 'Low energy']);
    expect(restored.symptoms[0].dailyImpact).toBe('Changed my plans');
    expect(restored.symptoms[0].pain).toBeUndefined();
    expect(restored.symptoms[0].fatigue).toBeUndefined();
    expect(restored.symptoms[0].affected).toBeUndefined();
    expect(restored.tasks![0].questionId).toBe('q1');
  });
  it('rejects unsupported symptom selections and impact values rather than silently discarding them', () => {
    expect(() =>
      validateHealthRecord({ ...record(), symptoms: [{ date: '2026-10-08', observedSymptoms: ['Unknown'] }] }),
    ).toThrow();
    expect(() =>
      validateHealthRecord({ ...record(), symptoms: [{ date: '2026-10-08', dailyImpact: 'Unknown' }] }),
    ).toThrow();
  });
  it('preserves checking status, reported units/pages, question history and exact clinical results', async () => {
    const original = record();
    original.reports = [
      {
        id: 'r1',
        title: 'My scan',
        source: 'pdf',
        status: 'needs-checking',
        pageCount: 2,
        savedAt: '2026-10-08T09:00:00Z',
        findings: {
          largestSize: {
            key: 'largestSize',
            completeness: { state: 'present', value: '41 × 38' },
            unit: 'mm',
            sourcePage: 2,
            needsChecking: true,
            originalWording: 'measures 41 × 38 mm',
          },
        },
      },
    ];
    original.questions[0] = {
      ...original.questions[0],
      status: 'open',
      history: [
        { at: '2026-10-08T09:00:00Z', status: 'unresolved', note: 'No answer yet', visitDate: '2026-10-08' },
        { at: '2026-10-08T09:05:00Z', status: 'open', note: 'Carried forward' },
      ],
    };
    original.results = [
      {
        id: 'lab1',
        name: 'Haemoglobin',
        value: '10.2',
        unit: 'g/dL',
        testDate: '2026-10-07',
        source: 'Lab report',
        savedAt: '2026-10-08T09:00:00Z',
      },
    ];
    const restored = (
      await decryptBackup(await encryptBackup(original, 'a long private passphrase'), 'a long private passphrase')
    ).record;
    expect(restored.reports![0].status).toBe('needs-checking');
    expect(restored.reports![0].findings.largestSize?.unit).toBe('mm');
    expect(restored.reports![0].findings.largestSize?.sourcePage).toBe(2);
    expect(restored.reports![0].findings.largestSize?.needsChecking).toBeTrue();
    expect(JSON.parse(JSON.stringify(restored.questions[0].history))).toEqual(original.questions[0].history);
    expect(restored.results).toEqual(original.results);
  });
  it('rejects unsupported report status and question-history states', () => {
    expect(() =>
      validateHealthRecord({
        ...record(),
        reports: [
          { id: 'r1', title: 'Bad', savedAt: '2026-10-08T00:00:00Z', status: 'medically-approved', findings: {} },
        ],
      }),
    ).toThrow();
    expect(() =>
      validateHealthRecord({
        ...record(),
        questions: [{ ...record().questions[0], history: [{ at: '2026-10-08T00:00:00Z', status: 'deleted' }] }],
      }),
    ).toThrow();
  });
});
