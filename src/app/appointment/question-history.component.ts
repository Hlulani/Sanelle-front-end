import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { QuestionEvent } from '../my-health/diagnosis.model';
@Component({
  selector: 'app-question-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (earlier().length) {
    <details>
      <summary>Earlier visit notes · {{ earlier().length }}</summary>
      <ol class="source-list">
        @for (event of earlier(); track $index) {
          <li>
            <p>
              <strong>{{
                event.status === 'answered'
                  ? 'Answered'
                  : event.status === 'unresolved'
                    ? 'Unresolved'
                    : 'Open question'
              }}</strong
              >{{ event.visitDate ? ' · visit ' + event.visitDate : '' }}
            </p>
            @if (event.answer) {
              <p>“{{ event.answer }}”</p>
            }
            @if (event.note) {
              <p>{{ event.note }}</p>
            }
            <p class="fine-print">Recorded {{ when(event.at) }}</p>
          </li>
        }
      </ol>
    </details>
  }`,
  styles: [
    `
      details {
        margin-top: 12px;
      }
      summary {
        min-height: 44px;
        align-content: center;
        color: var(--berry);
        font-weight: 700;
        cursor: pointer;
      }
      li {
        padding: 10px 0;
        border-bottom: 1px solid var(--line);
      }
    `,
  ],
})
export class QuestionHistoryComponent {
  when(at: string) {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(at));
  }
  readonly events = input<QuestionEvent[]>([]);
  readonly earlier = computed(() => this.events().slice(0, -1));
}
