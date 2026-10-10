import { FigmaFrameComponent } from '../shared/design/figma/figma-frame.component';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import {
  ALLERGENS,
  AllergenCode,
  CULTURAL_RULES,
  CulturalRule,
  DIETARY_PATTERNS,
  FoodProfileService,
} from './food-profile.service';
import { ProteinPreference } from '../core/services/meal-plans.service';
import { FOOD_NEEDS, FOOD_NEED_LABELS, FoodNeed } from '../core/profile/profile.service';
import { WordListComponent } from './word-list.component';
import { messageFor } from '../core/errors/errors';

/**
 * FOOD-01A: requirements kept as separate data. Allergies, strict avoidances, the dietary pattern
 * and cultural requirements decide which meals are eligible; everything else only decides order.
 */
@Component({
  selector: 'app-requirements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FigmaFrameComponent, IonContent, RouterLink, WordListComponent],
  templateUrl: './requirements.page.html',
})
export class RequirementsPage implements OnInit {
  private readonly food = inject(FoodProfileService);
  private readonly router = inject(Router);

  readonly allergens = ALLERGENS;
  readonly patterns = DIETARY_PATTERNS;
  readonly cultural = CULTURAL_RULES;
  readonly needs = FOOD_NEEDS.map((value) => ({ value, label: FOOD_NEED_LABELS[value] }));

  readonly allergies = signal<AllergenCode[]>([]);
  readonly strict = signal<string[]>([]);
  readonly intolerances = signal<string[]>([]);
  readonly pattern = signal<ProteinPreference>('ANY');
  readonly rules = signal<CulturalRule[]>([]);
  readonly dislikes = signal<string[]>([]);
  readonly likes = signal<string[]>([]);
  readonly practical = signal<FoodNeed[]>([]);
  readonly household = signal(1);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly reviewed = this.food.reviewed;

  async ngOnInit() {
    await this.food.load();
    const p = this.food.profile();
    this.allergies.set(p.allergies);
    this.strict.set(p.strictAvoidances);
    this.intolerances.set(p.intolerances);
    this.pattern.set(p.dietaryPattern);
    this.rules.set(p.cultural);
    this.dislikes.set(p.dislikes);
    this.likes.set(p.likes);
    this.practical.set(p.practical);
    this.household.set(p.household);
  }

  toggle<T>(list: { (): T[]; set(v: T[]): void }, value: T) {
    list.set(list().includes(value) ? list().filter((v) => v !== value) : [...list(), value]);
  }

  allergyWords(): string {
    const named = this.allergens.filter((a) => this.allergies().includes(a.code)).map((a) => a.word);
    return named.length > 1 ? `${named.slice(0, -1).join(', ')} or ${named[named.length - 1]}` : (named[0] ?? '');
  }

  changeHousehold(delta: number) {
    this.household.set(Math.min(12, Math.max(1, this.household() + delta)));
  }

  async save() {
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.food.saveRequirements({
        allergies: this.allergies(),
        strictAvoidances: this.strict(),
        intolerances: this.intolerances(),
        dietaryPattern: this.pattern(),
        cultural: this.rules(),
        dislikes: this.dislikes(),
        likes: this.likes(),
        practical: this.practical(),
        household: this.household(),
      });
      void this.router.navigate(['/food/plan'], { queryParams: { new: 1 }, replaceUrl: true });
    } catch (e) {
      this.error.set(messageFor(e, 'Your requirements couldn’t be saved. Please try again.'));
    } finally {
      this.saving.set(false);
    }
  }
}
