import { Component, Input } from '@angular/core';
import { Finding, SOURCE_TAGS } from './diagnosis.model';

/** One finding's status line: value and source, "Report says no", or "Not recorded". */
@Component({
  selector: 'app-finding-status',
  standalone: true,
  template: `
    @switch (finding.completeness.state) {
      @case ('present') {
        <span class="sn-status sn-status--present">{{ $any(finding.completeness).value }}{{ finding.source ? ' · ' + tags[finding.source] : '' }}</span>
      }
      @case ('absent') {
        <span class="sn-status sn-status--absent">Report says no{{ finding.source && finding.source !== 'entered-from-report' ? ' · ' + tags[finding.source] : '' }}</span>
      }
      @default {
        <span class="sn-status sn-status--unknown">Not recorded</span>
      }
    }
  `,
})
export class FindingStatusComponent {
  @Input({ required: true }) finding!: Finding;
  readonly tags = SOURCE_TAGS;
}
