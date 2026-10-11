import { ChangeDetectionStrategy, Component, output } from '@angular/core';

/** Asked before anything is sent: what goes, to whom, and that she checks the result. */
@Component({
  selector: 'app-ai-consent',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ai-consent" role="group" aria-labelledby="ai-consent-title">
      <strong id="ai-consent-title">Draft with Sanelle AI?</strong>
      <p>
        Sanelle AI reads your last 30 days of check-ins and notes. Not your name, email, reports or results. You check
        every word before anything is saved.
      </p>
      <p class="fine-print">
        Sanelle AI is powered by Anthropic, so your check-ins are sent to Anthropic to write the draft.
      </p>
      <div>
        <button class="secondary" type="button" (click)="send.emit()">Send and draft</button
        ><button class="text-action" type="button" (click)="decline.emit()">Not now</button>
      </div>
    </div>
  `,
})
export class AiConsentComponent {
  readonly send = output<void>();
  readonly decline = output<void>();
}
