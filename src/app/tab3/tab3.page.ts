import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonCheckbox } from '@ionic/angular/standalone';
import { PlanStoreService } from '../core/services/plan-store.service';
import { MealService } from '../core/services/meal.service';
import { AuthService } from '../core/auth/auth.service';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GenerateMealPlanResponse } from '../core/services/meal-plans.service';
import { MealResponse } from '../core/models/meal.model';

type GroceryItem = {
  name: string;
  amounts: string[];
  group: string;
};

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonCheckbox],
})
export class Tab3Page implements OnInit {
  private planStore = inject(PlanStoreService);
  private mealService = inject(MealService);
  private authService = inject(AuthService);
  private router = inject(Router);

  plan = signal<GenerateMealPlanResponse | null>(null);
  items = signal<GroceryItem[]>([]);
  checkedItems = signal<Set<string>>(new Set());
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.planStore.plan$.subscribe((plan) => {
      this.plan.set(plan);
      if (!plan) {
        this.items.set([]);
        this.checkedItems.set(new Set());
        return;
      }
      this.loadGroceryList(plan);
    });
  }

  private loadGroceryList(plan: GenerateMealPlanResponse) {
    if (!this.authService.hasValidToken()) {
      this.error.set('Login required to build your grocery list.');
      this.items.set([]);
      return;
    }

    const mealIds = Array.from(new Set(
      plan.daysPlan.reduce<string[]>((acc, day) => {
        day.meals.forEach((meal) => {
          if (meal.mealId) acc.push(meal.mealId);
        });
        return acc;
      }, [])
    ));

    if (mealIds.length === 0) {
      this.items.set([]);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    forkJoin(
      mealIds.map((id: string) =>
        this.mealService.getMealById(id).pipe(
          catchError(() => of(null))
        )
      )
    ).subscribe({
      next: (meals) => {
        const validMeals = meals.filter(Boolean) as MealResponse[];
        this.items.set(this.buildGroceryList(validMeals));
        this.checkedItems.set(new Set());
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load grocery list.');
        this.isLoading.set(false);
      },
    });
  }

  private buildGroceryList(meals: MealResponse[]): GroceryItem[] {
    const map = new Map<string, { name: string; amounts: Set<string>; group: string }>();
    meals.forEach((meal) => {
      (meal.ingredients || []).forEach((ing) => {
        const rawName = (ing.name || '').trim();
        if (!rawName) return;
        const key = rawName.toLowerCase();
        if (!map.has(key)) {
          const group = this.groupForIngredient(rawName);
          map.set(key, { name: rawName, amounts: new Set<string>(), group });
        }
        if (ing.amount) map.get(key)?.amounts.add(ing.amount);
      });
    });

    return Array.from(map.values())
      .map((entry) => ({
        name: entry.name,
        amounts: Array.from(entry.amounts),
        group: entry.group,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private groupForIngredient(name: string): string {
    const n = name.toLowerCase();
    const has = (words: string[]) => words.some((w) => n.includes(w));

    if (has(['milk', 'yogurt', 'cheese', 'butter', 'cream', 'ghee'])) return 'Dairy';
    if (has(['chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage'])) return 'Meat';
    if (has(['salmon', 'tuna', 'shrimp', 'prawn', 'fish', 'cod', 'tilapia'])) return 'Seafood';
    if (has(['egg'])) return 'Eggs';
    if (has(['apple', 'banana', 'berry', 'berries', 'orange', 'lemon', 'lime', 'grape', 'pear', 'mango', 'pineapple', 'avocado'])) return 'Produce';
    if (has(['spinach', 'kale', 'lettuce', 'cabbage', 'broccoli', 'carrot', 'tomato', 'pepper', 'onion', 'garlic', 'zucchini', 'mushroom', 'cucumber', 'potato', 'sweet potato'])) return 'Produce';
    if (has(['rice', 'pasta', 'bread', 'oats', 'quinoa', 'flour', 'tortilla'])) return 'Grains';
    if (has(['bean', 'lentil', 'chickpea', 'peas'])) return 'Legumes';
    if (has(['almond', 'cashew', 'walnut', 'peanut', 'pecan', 'nut', 'seed', 'chia', 'flax', 'pumpkin seed', 'sunflower'])) return 'Nuts & Seeds';
    if (has(['oil', 'olive', 'coconut oil', 'vinegar', 'soy sauce', 'tamari', 'mustard', 'ketchup', 'mayo'])) return 'Condiments';
    if (has(['salt', 'pepper', 'cumin', 'paprika', 'turmeric', 'ginger', 'cinnamon', 'spice', 'herb'])) return 'Spices & Herbs';
    if (has(['sugar', 'honey', 'maple'])) return 'Sweeteners';
    return 'Other';
  }

  toggleChecked(name: string, checked: boolean) {
    const set = new Set(this.checkedItems());
    if (checked) {
      set.add(name);
    } else {
      set.delete(name);
    }
    this.checkedItems.set(set);
  }

  visibleItems(): GroceryItem[] {
    const checked = this.checkedItems();
    return this.items().filter((item) => !checked.has(item.name));
  }

  allChecked(): boolean {
    return this.items().length > 0 && this.visibleItems().length === 0;
  }

  resetChecked() {
    this.checkedItems.set(new Set());
  }

  groupedItems(): { group: string; items: GroceryItem[] }[] {
    const groups = new Map<string, GroceryItem[]>();
    this.visibleItems().forEach((item) => {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group)?.push(item);
    });

    const order = [
      'Produce',
      'Meat',
      'Seafood',
      'Eggs',
      'Dairy',
      'Grains',
      'Legumes',
      'Nuts & Seeds',
      'Condiments',
      'Spices & Herbs',
      'Sweeteners',
      'Other',
    ];

    return Array.from(groups.entries())
      .map(([group, items]) => ({
        group,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
  }

  totalItems(): number {
    return this.items().length;
  }

  checkedCount(): number {
    return this.checkedItems().size;
  }

  groupCount(): number {
    return this.groupedItems().length;
  }

  progressPercent(): number {
    const total = this.totalItems();
    if (!total) return 0;
    return Math.round((this.checkedCount() / total) * 100);
  }

  goToPlan() {
    this.router.navigateByUrl('/tabs/tab2');
  }
}
