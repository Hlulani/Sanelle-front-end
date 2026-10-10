import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** A short list of words she types, e.g. foods to avoid. Each can be removed with one tap. */
@Component({
  selector: 'app-word-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="add" (submit)="$event.preventDefault(); add()">
      <label class="answer-form">
        <span class="visually-hidden">{{ label() }}</span>
        <input [name]="name()" [(ngModel)]="draft" [placeholder]="placeholder()" [attr.aria-label]="label()" />
      </label>
      <button type="submit" class="secondary compact">Add</button>
    </form>
    @if (words().length) {
      <ul class="chip-choices words">
        @for (w of words(); track w) {
          <li>
            <button type="button" class="source-choice" (click)="remove(w)" [attr.aria-label]="'Remove ' + w">
              {{ w }} ✕
            </button>
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      .add {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: end;
      }
      .words {
        list-style: none;
        margin: 8px 0 0;
        padding: 0;
      }
    `,
  ],
})
export class WordListComponent {
  readonly words = model<string[]>([]);
  readonly label = input.required<string>();
  readonly name = input('word');
  readonly placeholder = input('');
  draft = '';

  add() {
    const word = this.draft.trim();
    if (word && !this.words().some((w) => w.toLowerCase() === word.toLowerCase()))
      this.words.set([...this.words(), word]);
    this.draft = '';
  }

  remove(word: string) {
    this.words.set(this.words().filter((w) => w !== word));
  }
}
