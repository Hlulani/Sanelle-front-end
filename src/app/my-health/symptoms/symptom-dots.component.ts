import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DAY_MARK_LABELS, DayMark, WindowDay, dayMarkText } from './symptom-stats';
import { parseLocalDate } from '../../shared/calendar-date';

/**
 * One dot per calendar day. A recorded bleeding category has its own colour; a day without a
 * check-in is unknown grey. Every dot has a text label, and nothing predicts the next day.
 */
@Component({
  selector: 'app-symptom-dots',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <ol class="dots" [attr.aria-label]="'Last ' + days().length + ' days, oldest first'">
      @for (d of days(); track d.date) {
        <li class="dot mark-{{ d.mark }}" [attr.title]="label(d)">
          <span class="visually-hidden">{{ label(d) }}</span>
        </li>
      }
    </ol>
    @if (legend()) {
      <ul class="legend" aria-label="Key">
        @for (m of legendMarks(); track m) {
          <li><span class="dot mark-{{ m }}" aria-hidden="true"></span>{{ labels[m] }}</li>
        }
      </ul>
    }
  `,
  styles: [
    `
      .dots {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(10, minmax(0, 1fr));
        gap: 8px 6px;
        justify-items: center;
      }
      .dot {
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: var(--sn-unknown);
        flex: 0 0 auto;
      }
      .mark-none {
        background: var(--sn-bleed-none);
        box-shadow: inset 0 0 0 1.5px var(--sn-success);
      }
      .mark-spotting,
      .mark-light {
        background: var(--sn-bleed-light);
        box-shadow: inset 0 0 0 1.5px #efa8b8;
      }
      .mark-moderate {
        background: var(--sn-bleed-moderate);
      }
      .mark-heavy {
        background: var(--sn-bleed-heavy);
      }
      .mark-very-heavy {
        background: var(--sn-bleed-very-heavy);
      }
      .mark-no-bleeding-answer {
        background: var(--sn-white);
        box-shadow: inset 0 0 0 2px var(--sn-berry);
      }
      .legend {
        list-style: none;
        margin: 14px 0 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px 14px;
        font-size: 0.8125rem;
        color: var(--sn-muted);
      }
      .legend li {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .legend .dot {
        width: 12px;
        height: 12px;
      }
    `,
  ],
})
export class SymptomDotsComponent {
  readonly days = input.required<WindowDay[]>();
  readonly legend = input(true);
  readonly labels = DAY_MARK_LABELS;

  /** Only the categories shown, plus "No check-in". */
  readonly legendMarks = computed(() => {
    const order: DayMark[] = [
      'none',
      'spotting',
      'light',
      'moderate',
      'heavy',
      'very-heavy',
      'no-bleeding-answer',
      'no-entry',
    ];
    const present = new Set(this.days().map((d) => d.mark));
    present.add('no-entry');
    return order.filter((m) => present.has(m));
  });

  label(d: WindowDay): string {
    const date = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(
      parseLocalDate(d.date),
    );
    return `${date}: ${dayMarkText(d.mark)}`;
  }
}
