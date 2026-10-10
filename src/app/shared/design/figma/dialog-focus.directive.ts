import { AfterViewInit, Directive, ElementRef, HostListener, inject } from '@angular/core';
/** Keyboard behavior for the source modal, without changing its visual markup. */
@Directive({ selector: '[appDialogFocus]', standalone: true })
export class DialogFocusDirective implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private controls() {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input:not(:disabled):not([type=hidden]),textarea:not(:disabled),select:not(:disabled),a[href],summary',
      ),
    ).filter((e) => e.getClientRects().length > 0);
  }
  ngAfterViewInit() {
    this.host.nativeElement
      .querySelector<HTMLElement>('.sheet-close,.scan-header button')
      ?.focus({ preventScroll: true });
  }
  @HostListener('keydown', ['$event']) onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.host.nativeElement.querySelector<HTMLElement>('.sheet-close,.scan-header button')?.click();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = this.controls();
    const first = items[0],
      last = items.at(-1);
    if (!first) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
