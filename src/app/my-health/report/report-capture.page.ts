import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaReportFrameComponent } from '../../shared/design/figma/figma-report-frame.component';
import { FigmaIconComponent } from '../../shared/design/figma/figma-icon.component';
import { ReportDraft } from './report-draft.service';
import { assessPhoto, qualityProblems } from './page-quality';

/**
 * RPT-02: photograph each page, with a quick check for blur, glare and cut-off edges. Pages can
 * be retaken, reordered, removed or added before they're read.
 */
@Component({
  selector: 'app-report-capture',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonContent, FigmaReportFrameComponent, FigmaIconComponent],
  templateUrl: './report-capture.page.html',
})
export class ReportCapturePage implements OnInit {
  readonly draft = inject(ReportDraft);
  private readonly router = inject(Router);

  readonly pages = this.draft.pages;
  readonly error = signal<string | null>(null);
  private retaking: string | null = null;

  ngOnInit() {
    if (this.draft.source() !== 'camera') {
      void this.router.navigateByUrl('/health/report/new', { replaceUrl: true });
      return;
    }
    for (const p of this.pages()) if (!p.quality) void this.check(p.id, p.file);
  }

  problems = qualityProblems;

  add(event: Event) {
    const file = this.take(event);
    if (file && this.pages().length >= 10) {
      this.error.set('Choose up to 10 pages. Remove a page before adding another.');
      return;
    }
    if (file) void this.check(this.draft.add(file).id, file);
  }

  startRetake(id: string, input: HTMLInputElement) {
    this.retaking = id;
    input.click();
  }

  retake(event: Event) {
    const file = this.take(event);
    if (file && this.retaking) void this.check(this.draft.replace(this.retaking, file).id, file);
    this.retaking = null;
  }

  use() {
    void this.router.navigate(['/health/report/check'], { queryParams: { source: 'camera' } });
  }

  back() {
    this.draft.clear();
    void this.router.navigateByUrl('/health/report/new');
  }

  private async check(id: string, file: File) {
    const quality = await assessPhoto(file);
    this.draft.setQuality(id, quality ?? { blur: false, glare: false, croppedEdge: false, unavailable: true });
  }

  private take(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    this.error.set(null);
    if (file && (!/^image\//.test(file.type) || file.size > 20 * 1024 * 1024)) {
      this.error.set('Choose a JPG or PNG photo smaller than 20 MB.');
      return null;
    }
    return file;
  }
}
