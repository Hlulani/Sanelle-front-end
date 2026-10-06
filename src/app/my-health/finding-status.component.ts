import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Finding, SOURCE_TAGS } from './diagnosis.model';

/** One finding's status line: value and source, "Report says no", or "Not recorded". */
@Component({
  selector: 'app-finding-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    @let f = finding();
    @switch (f.completeness.state) {
      @case ('present') {
        <span class="sn-status sn-status--present">{{ $any(f.completeness).value }}{{ f.source ? ' · ' + tags[f.source] : '' }}</span>
      }
      @case ('absent') {
        <span class="sn-status sn-status--absent">Report says no{{ f.source && f.source !== 'entered-from-report' ? ' · ' + tags[f.source] : '' }}</span>
      }
      @default {
        <span class="sn-status sn-status--unknown">Not recorded</span>
      }
    }
  `,
})
export class FindingStatusComponent {
  readonly finding = input.required<Finding>();
  readonly tags = SOURCE_TAGS;
}
