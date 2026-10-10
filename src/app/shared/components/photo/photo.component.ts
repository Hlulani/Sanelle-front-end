import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Photo } from '../../photos';

/** A handoff photo with its Unsplash credit underneath. Decorative photos pass an empty alt. */
@Component({
  selector: 'app-photo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <figure class="sn-photo">
      <img [src]="photo().src" [alt]="decorative() ? '' : photo().alt" [style.aspect-ratio]="ratio()" loading="lazy" />
      <figcaption class="sn-credit">
        Photo: <a [href]="photo().url" target="_blank" rel="noopener noreferrer">{{ photo().credit }}</a> on Unsplash
      </figcaption>
    </figure>
  `,
})
export class PhotoComponent {
  readonly photo = input.required<Photo>();
  readonly ratio = input('16 / 9');
  readonly decorative = input(false);
}
