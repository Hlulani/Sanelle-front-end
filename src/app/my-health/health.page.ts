import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { FigmaIconComponent } from '../shared/design/figma/figma-icon.component';
import { PatientDesignState } from '../shared/design/figma/patient-design-state.service';
import { EvidenceService } from '../evidence/evidence.service';
import { FindingKey, HealthReport, reportStatus } from './diagnosis.model';
import { WindowDay, dayMarkText, symptomStats, symptomWindow } from './symptoms/symptom-stats';
import { isIsoDate, localIsoDate } from '../shared/calendar-date';
import { messageFor } from '../core/errors/errors';
import { DialogFocusDirective } from '../shared/design/figma/dialog-focus.directive';

@Component({
  selector: 'app-health',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, FormsModule, RouterLink, FigmaFrameComponent, FigmaIconComponent, DialogFocusDirective],
  templateUrl: './health.page.html',
})
export class HealthPage implements OnInit {
  readonly design = inject(PatientDesignState);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly evidence = inject(EvidenceService);
  readonly today = localIsoDate();
  readonly window = computed(() => symptomWindow(this.design.health.record().symptoms, this.today));
  readonly stats = computed(() => symptomStats(this.design.health.record().symptoms, this.today));
  readonly error = signal<string | null>(null);
  readonly showReportReview = signal(false);
  readonly reviewSaving = signal(false);
  reviewConfirmed = false;
  readonly reviewFields = [
    { key: 'count' as FindingKey, label: 'Number of fibroids' },
    { key: 'largestSize' as FindingKey, label: 'Largest recorded size' },
    { key: 'location' as FindingKey, label: 'Location' },
    { key: 'figo' as FindingKey, label: 'FIGO type' },
    { key: 'cavity' as FindingKey, label: 'Cavity involvement' },
  ];
  readonly notesImage = 'assets/photos/figma-notes.jpg';
  private readonly viewState = signal<'diagnosis' | 'symptoms'>('diagnosis');
  get view() {
    return this.viewState();
  }
  set view(value: 'diagnosis' | 'symptoms') {
    this.viewState.set(value);
  }
  showTreatmentEvidence = false;
  private readonly showLabState = signal(false);
  get showLabForm() {
    return this.showLabState();
  }
  set showLabForm(value: boolean) {
    this.showLabState.set(value);
  }
  labValue = '';
  labDate = '';
  readonly treatmentPublished = this.evidence.publishedIn('treatment').length > 0;
  get profileView() {
    return { fibroidCount: this.design.count(), largestSize: this.design.size() };
  }
  get latestCheckIn() {
    return this.design.latestView();
  }
  get savedReport() {
    return this.design.savedReport();
  }
  get recordedCount() {
    return this.stats().recordedDays;
  }
  get bleedingAnswers() {
    return this.window().filter((d) => d.entry?.bleeding !== undefined);
  }
  get heavyCount() {
    return this.stats().bleeding.heavy;
  }
  get coverage() {
    return Math.round((this.recordedCount / 30) * 100);
  }
  get clinicalResult() {
    const r = this.design.health
      .record()
      .results?.find((r) => r.name.toLowerCase() === 'hemoglobin' || r.name.toLowerCase() === 'haemoglobin');
    return r ? { ...r, date: r.testDate } : null;
  }
  get otherDetails() {
    return [
      {
        key: 'location' as FindingKey,
        label: 'Location',
        question: 'Where are my fibroids located?',
        explanation: 'Your saved report doesn’t include a location. You can ask your doctor to explain this.',
      },
      {
        key: 'figo' as FindingKey,
        label: 'FIGO type',
        question: 'What FIGO type are my fibroids?',
        explanation:
          'Your saved report doesn’t include a FIGO type. This classification may not appear on every report.',
      },
      {
        key: 'cavity' as FindingKey,
        label: 'Cavity involvement',
        question: 'Do my fibroids affect the uterine cavity?',
        explanation: 'Your saved report doesn’t say whether the fibroids affect the uterine cavity.',
      },
    ].map((item) => ({ ...item, value: this.design.value(item.key) }));
  }
  ngOnInit() {
    void this.ionViewWillEnter();
  }
  async ionViewWillEnter() {
    await this.design.load();
    this.view =
      this.route.snapshot.data['healthView'] ??
      (this.route.snapshot.queryParamMap.get('view') === 'symptoms' ? 'symptoms' : 'diagnosis');
  }
  setView(value: 'diagnosis' | 'symptoms') {
    this.view = value;
  }
  setShowTreatmentEvidence(value: boolean) {
    this.showTreatmentEvidence = value;
  }
  setShowLabForm(value: boolean) {
    this.labValue = this.clinicalResult?.value ?? '';
    this.labDate = this.clinicalResult?.date ?? '';
    this.showLabForm = value;
  }
  published(id: string) {
    return this.evidence.published(id);
  }
  status = reportStatus;
  reportPages(r: HealthReport) {
    return r.pageCount ?? 0;
  }
  dotClass(d: WindowDay) {
    return d.mark === 'no-entry' || d.mark === 'no-bleeding-answer' ? 'unknown' : d.mark;
  }
  dotTitle(d: WindowDay) {
    return `${d.date}: ${dayMarkText(d.mark)}`;
  }
  openLog() {
    void this.router.navigate(['/health/check-in/today'], { queryParams: { from: 'health', view: this.view } });
  }
  editLatestLog() {
    void this.router.navigate(['/health/check-in', this.latestCheckIn?.date ?? 'today'], {
      queryParams: { from: 'health', view: 'symptoms' },
    });
  }
  onScanReport() {
    void this.router.navigateByUrl('/health/report/new');
  }
  onReviewReport() {
    this.reviewConfirmed = false;
    this.error.set(null);
    this.showReportReview.set(true);
  }
  async saveReview() {
    if (!this.reviewConfirmed || this.reviewSaving()) return;
    this.reviewSaving.set(true);
    try {
      const record = this.design.health.record();
      const active = record.reports?.find((r) => r.id === record.activeReportId);
      const findings = Object.values(record.findings).filter((f) => !!f);
      if (active) {
        await this.design.health.saveCheckedReport(findings, {
          id: active.id,
          title: active.title,
          reportDate: active.reportDate,
          source: active.source ?? 'manual',
          pageCount: active.pageCount,
        });
      } else if (findings.length) {
        await this.design.health.saveFindings(findings.map((f) => ({ ...f, needsChecking: false })));
      }
      this.showReportReview.set(false);
    } catch (e) {
      this.error.set(messageFor(e, 'Your checked details couldn’t be saved. Please try again.'));
    } finally {
      this.reviewSaving.set(false);
    }
  }
  onSuggestQuestion(key: FindingKey) {
    void this.router.navigate(['/health/question', key]);
  }
  openReport(r: HealthReport) {
    void this.router.navigate(
      reportStatus(r) === 'checked' ? ['/health/report', r.id, 'saved'] : ['/health/report/check'],
      { queryParams: reportStatus(r) === 'checked' ? {} : { id: r.id } },
    );
  }
  async saveLab() {
    if (!this.labValue.trim() || !isIsoDate(this.labDate) || this.labDate > this.today) {
      this.error.set('Enter the reported value and a valid test date.');
      return;
    }
    try {
      const r = this.clinicalResult;
      await this.design.health.saveResult({
        id: r?.id,
        name: r?.name ?? 'Hemoglobin',
        value: this.labValue.trim(),
        unit: r?.unit ?? 'g/dL',
        testDate: this.labDate,
        source: r?.source ?? 'Reported by me',
      });
      this.showLabForm = false;
    } catch (e) {
      this.error.set(messageFor(e, 'Your result couldn’t be saved. Please try again.'));
    }
  }
}
