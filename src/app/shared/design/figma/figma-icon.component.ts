import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** SVG paths from the supplied Figma Make Icon component. */
@Component({
  // An SVG host preserves the supplied icon geometry and namespace.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'svg[figmaIcon]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.width]': 'size()',
    '[attr.height]': 'size()',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  },
  template: `@switch (figmaIcon()) {
    @case ('home') {
      <svg:path d="m3 11 9-8 9 8" />
      <svg:path d="M5 10v10h14V10M9 20v-6h6v6" />
    }
    @case ('food') {
      <svg:path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8h4v10M18 3v8" />
    }
    @case ('health') {
      <svg:path d="M4 13h4l2-7 4 12 2-5h4" />
      <svg:path d="M19 5a5 5 0 0 0-7 0 5 5 0 0 0-7 0c-2 2-2 5 0 7l7 7 7-7c2-2 2-5 0-7Z" />
    }
    @case ('visit') {
      <svg:rect x="4" y="3" width="16" height="18" rx="2" />
      <svg:path d="M8 2v3M16 2v3M8 10h8M8 14h5" />
    }
    @case ('arrow') {
      <svg:path d="M5 12h14M14 7l5 5-5 5" />
    }
    @case ('plus') {
      <svg:path d="M12 5v14M5 12h14" />
    }
    @case ('check') {
      <svg:path d="m5 12 4 4L19 6" />
    }
    @case ('info') {
      <svg:circle cx="12" cy="12" r="9" />
      <svg:path d="M12 11v5M12 8h.01" />
    }
    @case ('close') {
      <svg:path d="m6 6 12 12M18 6 6 18" />
    }
    @case ('cart') {
      <svg:path d="M3 4h2l2 11h11l2-7H6" />
      <svg:circle cx="9" cy="19" r="1" />
      <svg:circle cx="18" cy="19" r="1" />
    }
    @case ('clock') {
      <svg:circle cx="12" cy="12" r="9" />
      <svg:path d="M12 7v5l3 2" />
    }
    @case ('people') {
      <svg:circle cx="9" cy="8" r="3" />
      <svg:path d="M3 20c0-4 2-7 6-7s6 3 6 7M16 5a3 3 0 0 1 0 6M17 14c3 1 4 3 4 6" />
    }
    @case ('spark') {
      <svg:path d="M12 2c0 6-3 9-9 9 6 0 9 3 9 9 0-6 3-9 9-9-6 0-9-3-9-9Z" />
    }
  }`,
})
export class FigmaIconComponent {
  readonly figmaIcon = input.required<string>();
  readonly size = input(20);
}
