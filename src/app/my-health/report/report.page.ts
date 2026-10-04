import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonModal } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { FINDINGS, FINDING_KEYS, Finding, FindingKey } from '../diagnosis.model';
import { ReportPreview, ReportReader, ReportRegion } from './report-reader.service';
import { ReportSuggestion, suggestReportFindings } from './report-parser';
import { isBareMeasurement } from '../record/record-input';

interface ReviewRow {
  key: FindingKey;
  candidates: ReportSuggestion[];
  candidateIndex: number;
  value: string;
  selected: boolean;
  existing?: Finding;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [RouterLink, FormsModule, IonContent, IonModal],
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage {
  private repo = inject(HealthRepository);
  private reader = inject(ReportReader);
  readonly defs = FINDINGS;
  readonly keys = FINDING_KEYS;
  readonly reading = signal(false);
  readonly saving = signal(false);
  readonly progress = signal('');
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);
  readonly text = signal('');
  readonly rows = signal<ReviewRow[]>([]);
  readonly previews = signal<ReportPreview[]>([]);
  readonly viewed = signal<{ page: ReportPreview; regions: ReportRegion[] } | null>(null);
  reportTitle = '';
  makeCurrent = true;
  private generation = 0;
  readonly missing = computed(() => FINDING_KEYS.filter((key) => !this.rows().some((r) => r.key === key)));
  reportDate = '';
  confirmed = false;

  async readFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length || this.reading() || this.saving()) return;
    const generation = ++this.generation;
    this.releasePreviews();
    this.reportTitle = files.length === 1 ? files[0].name.replace(/\.[^.]+$/, '') : 'My photographed report';
    this.makeCurrent = true;
    this.error.set(null);
    this.saved.set(false);
    this.confirmed = false;
    this.text.set('');
    this.rows.set([]);
    this.reportDate = '';
    const pdfCount = files.filter((file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name)).length;
    if (files.length > 10 || (pdfCount > 0 && files.length > 1)) {
      this.error.set('Choose up to 10 photos, or a PDF with up to 10 pages.');
      return;
    }
    this.reading.set(true);
    try {
      await this.repo.load();
      const pages: string[] = [];
      for (const file of files) pages.push(await this.reader.read(file, (message) => { if (generation === this.generation) this.progress.set(message); }, (page) => {
        if (generation === this.generation) this.previews.update((previews) => [...previews, page]);
        else URL.revokeObjectURL(page.url);
      }));
      if (generation !== this.generation) return;
      const text = pages.join('\n\n').trim();
      if (!text) throw new Error('No readable text was found. Try a clearer photo with the whole page visible, or add the details manually.');
      if (text.length > 100_000) throw new Error('This report is too long to review here. Choose the relevant pages or add the details manually.');
      this.text.set(text);
      const suggestions = suggestReportFindings(text);
      this.rows.set(FINDING_KEYS.reduce<ReviewRow[]>((rows, key) => {
        const candidates = suggestions.filter((s) => s.key === key);
        if (!candidates.length) return rows;
        const existing = this.repo.record().findings[key];
        return [...rows, { key, candidates, candidateIndex: 0, value: candidates[0].completeness.state === 'present' ? candidates[0].completeness.value : '', selected: candidates.length === 1 && !existing, existing }];
      }, []));
    } catch (error) {
      if (generation === this.generation) this.error.set(error instanceof Error ? error.message : 'This report could not be read. Try another file or add the details manually.');
    } finally {
      if (generation === this.generation) this.reading.set(false);
    }
  }

  chooseCandidate(row: ReviewRow, index: number) {
    row.candidateIndex = index;
    const candidate = row.candidates[index];
    row.value = candidate.completeness.state === 'present' ? candidate.completeness.value : '';
    row.selected = true;
    this.confirmed = false;
  }

  existingValue(row: ReviewRow): string {
    const completeness = row.existing?.completeness;
    return completeness?.state === 'present' ? completeness.value : completeness?.state === 'absent' ? 'Explicitly absent' : 'Not recorded';
  }


  showOriginal(row: ReviewRow) {
    const wording = normalize(row.candidates[row.candidateIndex].wording);
    const page = this.previews().find((p) => normalize(p.text).includes(wording)) ?? this.previews()[0];
    if (!page) return;
    const regions = page.regions.filter((r) => {
      const region = normalize(r.text);
      return region.length > 4 && (wording.includes(region) || region.includes(wording));
    });
    this.viewed.set({ page, regions });
  }
  private releasePreviews() {
    this.previews().forEach((p) => URL.revokeObjectURL(p.url));
    this.previews.set([]); this.viewed.set(null);
  }
  ionViewWillLeave() {
    this.generation++; this.releasePreviews(); this.text.set(''); this.rows.set([]); this.reading.set(false);
  }

  async save() {
    if (this.saving() || this.reading()) return;
    this.error.set(null);
    const selected = this.rows().filter((r) => r.selected);
    if (!selected.length) { this.error.set('Select at least one detail to save, or add details manually.'); return; }
    if (!this.confirmed) { this.error.set('Check the selected details against your report before saving.'); return; }
    if (selected.some((r) => r.candidates[r.candidateIndex].completeness.state === 'present' && !r.value.trim())) {
      this.error.set('Fill in each selected detail, or leave it unselected.'); return;
    }
    if (selected.some((r) => r.key === 'largestSize' && isBareMeasurement(r.value))) {
      this.error.set('Include cm or mm in the size, exactly as written in your report.'); return;
    }
    this.saving.set(true);
    try {
      await this.repo.saveReport(selected.map((row): Finding => ({
        key: row.key,
        completeness: row.candidates[row.candidateIndex].completeness.state === 'absent' ? { state: 'absent' } : { state: 'present', value: row.value.trim() },
        source: 'extracted-and-confirmed',
        originalWording: row.candidates[row.candidateIndex].wording,
        reportDate: this.reportDate || undefined,
      })), this.reportTitle, this.reportDate || undefined, this.makeCurrent);
      this.saved.set(true);
      this.releasePreviews();
      this.text.set('');
    } catch {
      this.error.set('Could not save these details. Your review is still here; please try again.');
    } finally {
      this.saving.set(false);
    }
  }
}

function normalize(value: string): string { return value.replace(/\s+/g, ' ').trim().toLowerCase(); }
