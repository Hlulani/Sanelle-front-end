import { OnboardingDraft, OnboardingDraftSource } from './onboarding-draft';

function source(): OnboardingDraftSource {
  return {
    profile: {
      version: 1,
      name: 'Nandi',
      priorities: ['appointment'],
      trackSymptoms: ['pain'],
      foodNeeds: ['quick'],
      firstUseDone: false,
    },
    findings: {
      count: { key: 'count', completeness: { state: 'present', value: '2' }, source: 'entered-from-report' },
      largestSize: {
        key: 'largestSize',
        completeness: { state: 'present', value: '41 × 38' },
        unit: 'mm',
        source: 'entered-from-report',
      },
    },
    practicalNeeds: ['quick'],
    displayName: 'Account name',
    appointmentDate: '2026-10-24',
  };
}

describe('OnboardingDraft', () => {
  it('keeps form edits separate from loaded records and preserves compound report measurements', () => {
    const saved = source();
    const draft = new OnboardingDraft();
    draft.load(saved);
    draft.priorities.update((values) => [...values, 'food']);
    draft.foodNeeds.update((values) => [...values, 'budget']);
    draft.count = '';
    expect(saved.profile.priorities).toEqual(['appointment']);
    expect(saved.practicalNeeds).toEqual(['quick']);
    expect(draft.size).toBe('');
    expect(draft.diagnosisChanges(saved.findings)).toEqual([]);
    expect(draft.diagnosisSummary(saved.findings)).toContain('2 fibroids · Largest recorded size: 41 × 38 mm');
  });

  it('prevents preview findings from being persisted or mixed with personal records', () => {
    const saved = source();
    const draft = new OnboardingDraft();
    draft.load(saved);
    draft.startPreview();
    draft.count = '';
    draft.size = '';
    expect(draft.canPersist).toBeFalse();
    expect(draft.diagnosisChanges(saved.findings)).toEqual([]);
    expect(draft.diagnosisSummary(saved.findings)).toBe('Number not recorded · Size not recorded');
    draft.load(saved);
    expect(draft.preview()).toBeFalse();
    expect(draft.name).toBe('Nandi');
    expect(draft.canPersist).toBeTrue();
  });

  it('restores all draft fields when review editing is cancelled', () => {
    const draft = new OnboardingDraft();
    draft.load(source());
    draft.beginReviewEdit();
    draft.name = 'Edited';
    draft.size = '4.1';
    draft.sizeUnit = 'cm';
    draft.appointmentDate = '';
    draft.priorities.set(['food']);
    draft.trackSymptoms.set(['bleeding']);
    draft.foodNeeds.set(['budget']);
    draft.cancelReviewEdit();
    expect(draft.name).toBe('Nandi');
    expect(draft.size).toBe('');
    expect(draft.appointmentDate).toBe('2026-10-24');
    expect(draft.priorities()).toEqual(['appointment']);
    expect(draft.trackSymptoms()).toEqual(['pain']);
    expect(draft.foodNeeds()).toEqual(['quick']);
    expect(draft.editingReview()).toBeFalse();
  });

  it('keeps diagnosis changes retryable until the caller confirms successful persistence', () => {
    const saved = source();
    const draft = new OnboardingDraft();
    draft.load(saved);
    draft.size = '4,1';
    draft.sizeUnit = 'cm';
    expect(draft.validateStep(3, '2026-10-11')).toBeNull();
    const changes = draft.diagnosisChanges(saved.findings);
    expect(changes).toEqual([
      { key: 'largestSize', completeness: { state: 'present', value: '4.1' }, unit: 'cm', source: 'self-reported' },
    ]);
    expect(draft.diagnosisChanges(saved.findings)).toEqual(changes);
    draft.acceptDiagnosisChanges();
    expect(draft.diagnosisChanges(saved.findings)).toEqual([]);
  });

  it('rejects ambiguous input without rewriting it, and leaves optional dates optional', () => {
    const draft = new OnboardingDraft();
    draft.count = '2–3';
    expect(draft.validateStep(3, '2026-10-11')).not.toBeNull();
    expect(draft.count).toBe('2–3');
    draft.appointmentDate = '2026-02-30';
    expect(draft.validateStep(5, '2026-10-11')).not.toBeNull();
    draft.appointmentDate = '2026-10-10';
    expect(draft.validateStep(5, '2026-10-11')).not.toBeNull();
    draft.appointmentDate = '';
    expect(draft.validateStep(5, '2026-10-11')).toBeNull();
  });
});
