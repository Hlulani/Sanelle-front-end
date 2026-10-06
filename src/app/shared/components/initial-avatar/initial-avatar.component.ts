import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// A small fixed palette, picked deterministically per name (via a hash) so
// the same person always renders the same color across the app, without
// needing any real avatar/photo data — this app has no photo uploads at all.
const PALETTE = ['#74203f', '#561530', '#8a5a12', '#1e5f63', '#34497a', '#6b5560'];

@Component({
  selector: 'app-initial-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `<div
    class="initial-avatar"
    [style.width.px]="size()"
    [style.height.px]="size()"
    [style.fontSize.px]="fontSize()"
    [style.background]="color()"
  >{{ initial() }}</div>`,
  styles: [`
    .initial-avatar {
      border-radius: 50%;
      color: #ffffff;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
  `],
})
export class InitialAvatarComponent {
  readonly name = input.required<string>();
  readonly size = input(40);

  initial(): string {
    return (this.name() || '?').trim().charAt(0).toUpperCase() || '?';
  }

  fontSize(): number {
    return Math.round(this.size() * 0.42);
  }

  color(): string {
    return PALETTE[this.hash(this.name()) % PALETTE.length];
  }

  private hash(value: string): number {
    let h = 0;
    for (let i = 0; i < value.length; i++) {
      h = (h * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }
}
