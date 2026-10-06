import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Share } from '@capacitor/share';
import { HealthRepository } from '../health-repository';
import { FINDINGS, FINDING_KEYS, HealthRecord, SymptomEntry, findingOrUnknown, unansweredQuestions } from '../diagnosis.model';
import { checkinsInWindow, symptomParts } from '../checkins';
import { buildSummary, summaryAsText } from '../summary';

@Component({
  selector: 'app-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, FormsModule, IonContent],
  templateUrl: './summary.page.html',
  styleUrls: ['./summary.page.scss'],
})
export class SummaryPage {
  private repo = inject(HealthRepository);
  private router = inject(Router);
  private readonly concernInput = viewChild<ElementRef<HTMLTextAreaElement>>('concernInput');
  private readonly concernAction = viewChild<ElementRef<HTMLButtonElement>>('concernAction');

  readonly summary = computed(() => buildSummary(this.repo.record()));
  readonly missingFindings = computed(() => FINDING_KEYS
    .filter((key) => findingOrUnknown(this.repo.record(), key).completeness.state === 'unknown')
    .map((key) => ({ key, label: FINDINGS[key].label, fieldLabel: FINDINGS[key].fieldLabel })));
  readonly status = signal<string | null>(null);
  readonly hasCheckins = computed(() => (this.repo.record().symptoms ?? []).length > 0);
  readonly includeCheckins = computed(() => this.repo.record().summaryIncludesCheckins !== false);
  readonly periodDays = computed(() => this.repo.record().summaryPeriodDays ?? 30);
  readonly pendingQuestions = computed(() => unansweredQuestions(this.repo.record()));
  readonly answeredQuestions = computed(() => this.repo.questions().filter((q) => q.answer?.trim()));
  readonly visits = computed(() => this.repo.record().visits ?? []);
  readonly symptomChoices = computed(() => checkinsInWindow(this.repo.record().symptoms, this.periodDays()));
  readonly periods = [14, 30, 90] as const;
  readonly editingConcern = signal(false);
  readonly savingConcern = signal(false);
  readonly concernError = signal('');
  readonly concernStatus = signal('');
  concernDraft = '';
  readonly notes = signal('');

  async ionViewWillEnter() {
    await this.repo.load();
    this.notes.set(this.repo.record().summaryNotes);
  }

  back() {
    this.router.navigateByUrl('/tabs/health');
  }

  async openConcern() {
    if (this.editingConcern() || this.savingConcern()) return;
    this.savingConcern.set(true); this.concernError.set(''); this.concernStatus.set('');
    try {
      await this.repo.load();
      this.concernDraft = this.repo.record().visitGoal ?? '';
      this.editingConcern.set(true);
      setTimeout(() => this.concernInput()?.nativeElement.focus(), 0);
    } catch { this.concernError.set('Could not open your saved concern. Please try again.'); }
    finally { this.savingConcern.set(false); }
  }

  cancelConcern() {
    if (this.savingConcern()) return;
    this.closeConcern();
  }

  async saveConcern() {
    if (!this.editingConcern() || this.savingConcern()) return;
    this.savingConcern.set(true); this.concernError.set('');
    const concern = this.concernDraft.trim();
    try {
      await this.repo.setVisitGoal(concern);
      this.closeConcern();
      this.concernStatus.set(concern ? 'Main concern saved in your visit summary.' : 'Main concern removed from your visit summary.');
    } catch { this.concernError.set('Could not save your concern. Your text is still here; please try again.'); }
    finally { this.savingConcern.set(false); }
  }

  private closeConcern() {
    this.editingConcern.set(false); this.concernDraft = ''; this.concernError.set('');
    setTimeout(() => this.concernAction()?.nativeElement.focus(), 0);
  }

  ionViewWillLeave() { this.closeConcern(); }

  selected(key: SelectionKey, id: string): boolean {
    const values = this.repo.record()[key];
    return values ? values.includes(id) : key === 'summaryQuestionIds' ? this.pendingQuestions().slice(0, 3).some((q) => q.id === id) : key === 'summarySymptomDates';
  }
  toggleSelection(key: SelectionKey, id: string, include: boolean) {
    void this.saveChange(() => this.repo.toggleSummarySelection(key, id, include));
  }
  symptomLabel(entry: SymptomEntry) { return [...symptomParts(entry), entry.notes, entry.treatmentChange].filter(Boolean).join(' · ') || 'Impact on my day'; }

  setIncludeCheckins(include: boolean) {
    void this.saveChange(() => this.repo.setSummaryIncludesCheckins(include));
  }

  setPeriod(days: 14 | 30 | 90) {
    void this.saveChange(() => this.repo.setSummaryPeriodDays(days));
  }

  saveNotes() {
    return this.saveChange(() => this.repo.setSummaryNotes(this.notes()));
  }

  private async saveChange(change: () => Promise<void>): Promise<boolean> {
    try {
      await change();
      this.status.set(null);
      return true;
    } catch {
      this.status.set('Could not save your summary changes. Please try again.');
      return false;
    }
  }

  /** Sharing is always started by the person; nothing is sent automatically. */
  async share() {
    if (!await this.saveNotes()) return;
    const text = summaryAsText(buildSummary({ ...this.repo.record(), summaryNotes: this.notes() }));
    try {
      const { value: canShare } = await Share.canShare();
      if (canShare) {
        await Share.share({ title: 'My appointment summary', text });
        return;
      }
    } catch {
      // Fall through to copying.
    }
    try {
      await navigator.clipboard.writeText(text);
      this.status.set('Copied. Paste it wherever you need it.');
    } catch {
      this.status.set('Sharing isn’t available here. Use Print instead.');
    }
  }

  async print() {
    if (!await this.saveNotes()) return;
    window.print();
  }
}

type SelectionKey = keyof Pick<HealthRecord, 'summaryQuestionIds' | 'summaryAnswerIds' | 'summarySymptomDates' | 'summaryVisitDates'>;
