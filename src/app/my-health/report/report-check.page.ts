import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonModal } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { FINDINGS, FINDING_KEYS, Finding, FindingKey, HealthReport, ReportSource } from '../diagnosis.model';
import { ReportPreview, ReportReader, ReportRegion } from './report-reader.service';
import { ReportSuggestion, suggestReportFindings } from './report-parser';
import { FigmaReportFrameComponent } from '../../shared/design/figma/figma-report-frame.component';
import { ReportDraft } from './report-draft.service';
import { statedPageCount } from './page-quality';
import { UserFacingError, messageFor } from '../../core/errors/errors';
import { localIsoDate } from '../../shared/calendar-date';

type FieldState = 'present' | 'absent' | 'unknown';

/** One report field under review. Nothing here is saved until she chooses to. */
export interface FieldRow {
  key: FindingKey;
  candidates: ReportSuggestion[];
  candidateIndex: number;
  state: FieldState;
  value: string;
  /** Exactly as reported; blank when the report gives no unit. */
  unit: string;
  wording: string;
  page?: number;
  /** Read from the report rather than typed. */
  extracted: boolean;
}

export const CONFIRMATION_TEXT = 'I compared these fields with the report and corrected any transcription errors.';

/** "41 × 38 mm" → value "41 × 38", unit "mm". */
export function splitUnit(text: string): { value: string; unit: string } {
  const m = text.trim().match(/^(.*?\d)\s*(cm|mm)$/i);
  return m ? { value: m[1].trim(), unit: m[2].toLowerCase() } : { value: text.trim(), unit: '' };
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * RPT-03: every field shows the report's own words, the page they came from, the value and its
 * unit as reported, and whether it still needs checking. Any field can be corrected or marked
 * not recorded. Confirming checks the transcription only, never the medical finding (C10).
 */
@Component({
  selector: 'app-report-check',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, IonModal, FormsModule, FigmaReportFrameComponent],
  templateUrl: './report-check.page.html',
  styleUrls: ['./report-check.page.scss'],
})
export class ReportCheckPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repo = inject(HealthRepository);
  private readonly reader = inject(ReportReader);
  private readonly draft = inject(ReportDraft);

  readonly defs = FINDINGS;
  readonly confirmationText = CONFIRMATION_TEXT;
  readonly today = localIsoDate();

  readonly source = signal<ReportSource>('manual');
  readonly rows = signal<FieldRow[]>([]);
  readonly previews = signal<ReportPreview[]>([]);
  readonly reading = signal(false);
  readonly progress = signal('');
  readonly readError = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly ready = signal(false);
  readonly statedPages = signal<number | null>(null);
  readonly viewed = signal<{ page: ReportPreview; regions: ReportRegion[] } | null>(null);
  /** Re-checking a report saved earlier, whose page images were never kept. */
  readonly resumed = signal(false);
  readonly editingChecked = signal(false);

  reportId: string | undefined;
  originalWording = '';
  demo = false;
  title = '';
  reportDate = '';
  confirmed = false;

  readonly pageCount = computed(() => this.previews().length || this.draft.pages().length || undefined);
  readonly missingPage = computed(() => {
    const stated = this.statedPages();
    const read = this.previews().length;
    return stated && read && stated > read ? { stated, read } : null;
  });
  readonly extractedCount = computed(() => this.rows().filter((r) => r.extracted && r.state !== 'unknown').length);

  async ngOnInit() {
    await this.repo.load();
    const params = this.route.snapshot.queryParamMap;
    const id = params.get('id');
    const fromCurrent = params.get('from') === 'current';
    if (id || fromCurrent) {
      const report = id ? this.repo.report(id) : this.currentReport();
      if (id && !report) {
        this.error.set('This report is no longer saved.');
        this.ready.set(true);
        return;
      }
      this.resume(report, fromCurrent);
      this.ready.set(true);
      return;
    }
    this.demo = params.get('demo') === '1';
    const source = (params.get('source') as ReportSource) || 'manual';
    this.source.set(source);
    this.rows.set(
      (['count', 'largestSize', 'location', 'figo', 'cavity'] as FindingKey[]).map((key) => this.emptyRow(key)),
    );
    this.title = source === 'manual' ? 'Details I typed from my report' : 'My scan report';
    if (this.demo) {
      this.title = 'Thandi’s sample report';
      this.originalWording = 'Two uterine fibroids are visualised. The largest measures 41 × 38 × 35 mm.';
      this.rows.set(
        this.rows().map((r) =>
          r.key === 'count'
            ? { ...r, state: 'present', value: '2', wording: this.originalWording }
            : r.key === 'largestSize'
              ? { ...r, state: 'present', value: '41 × 38 × 35', unit: 'mm', wording: this.originalWording }
              : r,
        ),
      );
    }
    this.ready.set(true);
    if (source !== 'manual') await this.read();
  }

  private currentReport(): HealthReport | undefined {
    const r = this.repo.record();
    return r.activeReportId ? this.repo.report(r.activeReportId) : undefined;
  }

  /** Opens a saved report, or the current details, for checking or correcting. */
  private resume(report: HealthReport | undefined, fromCurrent: boolean) {
    this.resumed.set(!!report && report.source !== 'manual');
    this.editingChecked.set(!!report && report.status !== 'needs-checking');
    this.reportId = report?.id;
    this.source.set(report?.source ?? 'manual');
    this.originalWording = Object.values(report?.findings ?? {})
      .map((f) => f?.originalWording)
      .filter((v, i, a) => v && a.indexOf(v) === i)
      .join('\n');
    this.title = report?.title ?? 'Details I typed from my report';
    this.reportDate = report?.reportDate ?? '';
    const findings = report?.findings ?? (fromCurrent ? this.repo.record().findings : {});
    this.rows.set(
      (['count', 'largestSize', 'location', 'figo', 'cavity'] as FindingKey[]).map((key) => {
        const f = findings[key];
        if (!f || f.completeness.state === 'unknown') return this.emptyRow(key);
        const split =
          f.completeness.state === 'present' && !f.unit && key === 'largestSize'
            ? splitUnit(f.completeness.value)
            : { value: f.completeness.state === 'present' ? f.completeness.value : '', unit: f.unit ?? '' };
        return {
          key,
          candidates: [],
          candidateIndex: 0,
          state: f.completeness.state,
          value: split.value,
          unit: split.unit,
          wording: f.originalWording ?? '',
          page: f.sourcePage,
          extracted: f.source === 'extracted-and-confirmed',
        };
      }),
    );
  }

  private emptyRow(key: FindingKey): FieldRow {
    return {
      key,
      candidates: [],
      candidateIndex: 0,
      state: 'unknown',
      value: '',
      unit: '',
      wording: '',
      extracted: false,
    };
  }

  /** Reads the chosen pages on this device and suggests a value for each field it can find. */
  private async read() {
    const files = this.draft.pages().map((p) => p.file);
    if (!files.length) {
      void this.router.navigateByUrl('/health/report/new', { replaceUrl: true });
      return;
    }
    this.reading.set(true);
    this.readError.set(null);
    try {
      const texts: string[] = [];
      for (const file of files)
        texts.push(
          await this.reader.read(
            file,
            (message) => this.progress.set(message),
            (page) => this.previews.update((pages) => [...pages, page]),
          ),
        );
      const text = texts.join('\n\n').trim();
      this.originalWording = text;
      if (!text)
        throw new UserFacingError(
          'No readable text was found. Retake the photos with the whole page in view, or type the details below.',
        );
      this.statedPages.set(statedPageCount(text));
      const suggestions = suggestReportFindings(text);
      this.rows.set(
        (['count', 'largestSize', 'location', 'figo', 'cavity'] as FindingKey[]).map((key) => {
          const candidates = suggestions.filter((s) => s.key === key);
          return candidates.length ? this.fromCandidate(key, candidates, 0) : this.emptyRow(key);
        }),
      );
    } catch (error) {
      this.readError.set(
        messageFor(error, 'This report couldn’t be read here. Type the details below, or try another file.'),
      );
    } finally {
      this.reading.set(false);
    }
  }

  private fromCandidate(key: FindingKey, candidates: ReportSuggestion[], index: number): FieldRow {
    const c = candidates[index];
    const raw = c.completeness.state === 'present' ? c.completeness.value : '';
    const split = key === 'largestSize' ? splitUnit(raw) : { value: raw, unit: '' };
    return {
      key,
      candidates,
      candidateIndex: index,
      state: c.completeness.state,
      value: split.value,
      unit: split.unit,
      wording: c.wording,
      page: this.pageOf(c.wording),
      extracted: true,
    };
  }

  private pageOf(wording: string): number | undefined {
    const w = normalize(wording);
    const i = this.previews().findIndex((p) => normalize(p.text).includes(w));
    return i >= 0 ? i + 1 : this.previews().length === 1 ? 1 : undefined;
  }

  chooseCandidate(row: FieldRow, index: number) {
    this.replaceRow(this.fromCandidate(row.key, row.candidates, index));
  }

  setState(row: FieldRow, state: FieldState) {
    this.replaceRow({ ...row, state });
  }

  setValue(row: FieldRow, value: string) {
    this.replaceRow({ ...row, value, state: value.trim() ? 'present' : 'unknown' });
  }
  editWording(value: string) {
    this.originalWording = value;
    this.changed();
  }
  changed() {
    this.confirmed = false;
  }

  status(row: FieldRow): { label: string; css: string } {
    if (row.state === 'unknown') return { label: 'Not recorded', css: 'unknown' };
    if (row.extracted) return { label: 'Needs checking', css: 'needs-checking' };
    return { label: 'Entered by me', css: 'open' };
  }

  showOriginal(row: FieldRow) {
    const page = row.page ? this.previews()[row.page - 1] : this.previews()[0];
    if (!page) return;
    const wording = normalize(row.wording);
    const regions = page.regions.filter((r) => {
      const region = normalize(r.text);
      return region.length > 4 && (wording.includes(region) || region.includes(wording));
    });
    this.viewed.set({ page, regions });
  }

  async save(checked: boolean) {
    if (this.saving()) return;
    this.error.set(null);
    if (checked && !this.confirmed) {
      this.error.set('Compare the fields with your report, then tick the box to confirm.');
      return;
    }
    const incomplete = this.rows().find((r) => r.state === 'present' && !r.value.trim());
    if (incomplete) {
      this.error.set(`Add a value for “${this.defs[incomplete.key].label}”, or mark it not recorded.`);
      return;
    }
    if (this.reportDate && this.reportDate > this.today) {
      this.error.set('The report date can’t be in the future.');
      return;
    }
    const findings = this.rows()
      .filter((r) => r.state !== 'unknown')
      .map((r): Finding => ({
        key: r.key,
        completeness: r.state === 'absent' ? { state: 'absent' } : { state: 'present', value: r.value.trim() },
        unit: r.key === 'largestSize' && r.state === 'present' && r.unit ? r.unit : undefined,
        source: r.extracted ? 'extracted-and-confirmed' : 'entered-from-report',
        originalWording: r.wording || this.originalWording.trim() || undefined,
        sourcePage: r.page,
        reportDate: this.reportDate || undefined,
      }));
    const meta = {
      id: this.reportId,
      title: this.title,
      reportDate: this.reportDate || undefined,
      source: this.source(),
      pageCount: this.pageCount(),
    };
    this.saving.set(true);
    try {
      const id = checked
        ? await this.repo.saveCheckedReport(findings, meta)
        : await this.repo.saveReportForLater(findings, meta);
      this.releasePages();
      void this.router.navigate(['/health/report', id, 'saved'], { replaceUrl: true });
    } catch {
      this.error.set('These details couldn’t be saved. Your review is still here; please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  ionViewWillLeave() {
    this.viewed.set(null);
  }

  cancel() {
    this.releasePages();
    void this.router.navigateByUrl('/tabs/health');
  }

  private releasePages() {
    this.previews().forEach((p) => URL.revokeObjectURL(p.url));
    this.previews.set([]);
    this.draft.clear();
  }

  private replaceRow(row: FieldRow) {
    this.rows.update((rows) => rows.map((r) => (r.key === row.key ? row : r)));
    this.confirmed = false;
  }
}
