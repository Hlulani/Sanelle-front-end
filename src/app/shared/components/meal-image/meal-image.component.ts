import { Component, Input, computed, signal } from '@angular/core';
import { MealPhoto, photoFor } from '../../meal-photos';

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

/**
 * The dish itself, which in long names comes last:
 * "Greek Yogurt Parfait with Blueberries, Flaxseed, Honey" -> "Greek Yogurt Parfait"
 * "Roasted Vegetable and Chickpea Curry" -> "Chickpea Curry"
 */
export function shortDishName(name: string): string {
  const core = name.replace(/\(.*?\)/g, '').split(/\s+with\s+|,|\s+on\s+/i)[0].trim();
  const words = core.split(/\s+/);
  if (words.length <= 3) return core;
  const tail = words.slice(-3);
  return (tail[0].toLowerCase() === 'and' ? tail.slice(1) : tail).join(' ');
}

/**
 * A recipe photo when a matched, licensed one exists; otherwise a designed tile
 * with the dish's short name. Never an unrelated photo.
 */
@Component({
  selector: 'app-meal-image',
  standalone: true,
  template: `
    @if (photo(); as p) {
      <img class="photo" [src]="p.src" [alt]="p.alt" loading="lazy" />
    } @else {
      <div class="fallback" [class]="'fallback is-' + type().toLowerCase()" role="img" [attr.aria-label]="dishName()">
        <span class="plate" aria-hidden="true"></span>
        <span class="label" aria-hidden="true">{{ shortName() }}</span>
      </div>
    }
  `,
  styles: [`
    :host { display: block; position: relative; overflow: hidden; border-radius: inherit; }
    .photo { display: block; width: 100%; height: 100%; object-fit: cover; }
    .fallback { position: relative; width: 100%; height: 100%; background: var(--sn-blush); }
    .fallback.is-breakfast { background: #f9dcc4; }
    .fallback.is-lunch { background: var(--sn-blush); }
    .fallback.is-dinner { background: #ecd3da; }
    .fallback.is-snack { background: #f3e6cf; }
    .plate {
      position: absolute; right: -18%; bottom: -26%;
      width: 78%; aspect-ratio: 1; border-radius: 50%;
      background: var(--sn-canvas);
      box-shadow: inset 0 0 0 0.6rem rgba(255, 255, 255, 0.7);
    }
    .label {
      position: absolute; left: 0.75rem; top: 0.625rem; right: 0.75rem;
      font: 600 1.0625rem/1.1 var(--sn-display);
      color: var(--sn-brand);
    }
  `],
})
export class MealImageComponent {
  private readonly _name = signal('');
  private readonly _type = signal<MealType>('LUNCH');

  @Input({ required: true }) set name(v: string) { this._name.set(v ?? ''); }
  @Input() set mealType(v: MealType | undefined) { if (v) this._type.set(v); }

  readonly type = this._type.asReadonly();
  readonly dishName = this._name.asReadonly();
  readonly photo = computed<MealPhoto | null>(() => photoFor(this._name()));
  readonly shortName = computed(() => shortDishName(this._name()));

}
