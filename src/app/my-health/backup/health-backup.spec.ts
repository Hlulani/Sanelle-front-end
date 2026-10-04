import { decryptBackup, encryptBackup, validateHealthRecord } from './health-backup';
import { emptyHealthRecord, HealthRecord } from '../diagnosis.model';

const record = (): HealthRecord => ({ ...emptyHealthRecord(), visitGoal: 'Discuss bleeding',
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
    const envelope = JSON.parse(content); envelope.data = 'AAAA' + envelope.data.slice(4);
    await expectAsync(decryptBackup(JSON.stringify(envelope), 'a long private passphrase')).toBeRejected();
  });
  it('rejects invalid records and unsupported encryption before restoration', async () => {
    expect(() => validateHealthRecord({ ...record(), symptoms: [{ date: '2026-02-31', pain: 20 }] })).toThrow();
    expect(() => validateHealthRecord({ ...record(), activeReportId: 'missing' })).toThrow();
    expect(() => validateHealthRecord({ ...record(), questions: [...record().questions, ...record().questions] })).toThrow();
    await expectAsync(decryptBackup('{"format":"other"}', 'password')).toBeRejected();
    await expectAsync(encryptBackup(record(), 'short')).toBeRejected();
  });
});
