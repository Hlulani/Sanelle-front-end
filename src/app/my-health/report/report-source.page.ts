import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaReportFrameComponent } from '../../shared/design/figma/figma-report-frame.component';
import { FigmaIconComponent } from '../../shared/design/figma/figma-icon.component';
import { ReportDraft } from './report-draft.service';

const MAX_FILES = 10;
const MAX_BYTES = 20 * 1024 * 1024;

/** RPT-01: where the report comes from. Nothing is uploaded, and nothing is interpreted. */
@Component({
  selector: 'app-report-source',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, FigmaReportFrameComponent, FigmaIconComponent],
  templateUrl: './report-source.page.html',
})
export class ReportSourcePage {
  private readonly router = inject(Router);
  private readonly draft = inject(ReportDraft);

  readonly maxFiles = MAX_FILES;
  readonly error = signal<string | null>(null);

  cameraReady() {
    this.draft.start('camera');
    void this.router.navigateByUrl('/health/report/capture');
  }
  previewSample() {
    this.draft.start('manual');
    void this.router.navigate(['/health/report/check'], { queryParams: { source: 'manual', demo: 1 } });
  }
  chooseReport(event: Event) {
    const files = this.files(event);
    if (!files) return;
    if (files.some((f) => !/^image\//.test(f.type) && f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name))) {
      this.error.set('Choose photos (JPG or PNG) or a PDF.');
      return;
    }
    const source = files.some((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) ? 'pdf' : 'photos';
    this.draft.start(source, files);
    void this.router.navigate(['/health/report/check'], { queryParams: { source } });
  }
  /** The first photo starts the capture screen, where more pages are added and checked. */
  take(event: Event) {
    const files = this.files(event);
    if (!files) return;
    if (!files.every((f) => /^image\//.test(f.type))) {
      this.error.set('Choose a photo of the report (JPG or PNG).');
      return;
    }
    this.draft.start('camera', files);
    void this.router.navigateByUrl('/health/report/capture');
  }

  choose(event: Event, source: 'photos' | 'pdf') {
    const files = this.files(event);
    if (!files) return;
    if (source === 'pdf' && !files.every((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name))) {
      this.error.set('Choose a PDF file.');
      return;
    }
    if (source === 'photos' && !files.every((f) => /^image\//.test(f.type))) {
      this.error.set('Choose photos (JPG or PNG). For a PDF, use “Upload a PDF”.');
      return;
    }
    this.draft.start(source, files);
    void this.router.navigate(['/health/report/check'], { queryParams: { source } });
  }

  manual() {
    this.draft.start('manual');
    void this.router.navigate(['/health/report/check'], { queryParams: { source: 'manual' } });
  }

  close() {
    void this.router.navigateByUrl('/tabs/health');
  }

  private files(event: Event): File[] | null {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.error.set(null);
    if (!files.length) return null;
    if (files.length > MAX_FILES) {
      this.error.set(`Choose up to ${MAX_FILES} pages.`);
      return null;
    }
    if (files.some((f) => f.size > MAX_BYTES)) {
      this.error.set('Choose files smaller than 20 MB. You can photograph one page at a time.');
      return null;
    }
    return files;
  }
}
