import { Component, Input } from '@angular/core';

// A small fixed palette, picked deterministically per name (via a hash) so
// the same person always renders the same color across the app, without
// needing any real avatar/photo data — this app has no photo uploads at all.
const PALETTE = ['#314a38', '#a95a3c', '#3f6f63', '#6b5b8a', '#8a6d2f', '#3d6a8a'];

@Component({
  selector: 'app-initial-avatar',
  standalone: true,
  template: `<div
    class="initial-avatar"
    [style.width.px]="size"
    [style.height.px]="size"
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
  @Input({ required: true }) name = '';
  @Input() size = 40;

  initial(): string {
    return (this.name || '?').trim().charAt(0).toUpperCase() || '?';
  }

  fontSize(): number {
    return Math.round(this.size * 0.42);
  }

  color(): string {
    return PALETTE[this.hash(this.name) % PALETTE.length];
  }

  private hash(value: string): number {
    let h = 0;
    for (let i = 0; i < value.length; i++) {
      h = (h * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }
}
