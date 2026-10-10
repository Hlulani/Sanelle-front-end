import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FigmaIconComponent } from './figma-icon.component';
@Component({
  selector: 'app-figma-report-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FigmaIconComponent],
  host: { class: 'figma' },
  template: ` <div class="report-scan" role="dialog" aria-modal="true" aria-label="Add a report">
    <header class="scan-header">
      <div>
        <div class="brand"><span class="brand-mark">s</span><span>sanelle</span></div>
        <span>Add a report</span>
      </div>
      <button class="icon-button" (click)="closed.emit()" aria-label="Close report capture">
        <svg figmaIcon="close" />
      </button>
    </header>
    <div class="scan-progress">
      <i [class.active]="stage() === 1" [class.done]="stage() > 1"></i
      ><i [class.active]="stage() === 2" [class.done]="stage() > 2"></i><i [class.active]="stage() === 3"></i>
    </div>
    <main class="scan-main"><ng-content /></main>
  </div>`,
})
export class FigmaReportFrameComponent {
  readonly stage = input(1);
  readonly closed = output<void>();
}
