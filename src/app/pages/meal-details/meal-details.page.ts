import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonContent, IonImg, IonButton, IonIcon, IonModal
} from '@ionic/angular/standalone';
import { MealService } from '../../core/services/meal.service';
import { environment } from '../../../environments/environment';
import { Ingredient, MealResponse } from '../../core/models/meal.model';
import { AuthService } from '../../core/auth/auth.service';
import { MealProgressService } from '../../core/services/meal-progress.service';
import { scaleIngredientAmount } from '../../core/services/ingredient-scaling.util';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 12;


@Component({
  selector: 'app-meal-details',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonImg,
    IonButton,
    IonIcon,
    IonModal,
  ],
  templateUrl: './meal-details.page.html',
  styleUrls: ['./meal-details.page.scss'],
})
export class MealDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private mealService = inject(MealService);
  private authService = inject(AuthService);
  mealProgress = inject(MealProgressService);
  hostBaseUrl = environment.hostBaseUrl;

  meal: MealResponse | null = null;
  isLoading = true;
  error: string | null = null;

  /** The plan date this meal was opened from, if any — lets "finish cooking" mark it cooked. */
  private planDate: string | null = null;

  servings = signal(1);

  cookModeOpen = signal(false);
  currentStep = signal(0);

  imageUrl(path: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : this.hostBaseUrl + path;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.planDate = this.route.snapshot.queryParamMap?.get('date') ?? null;

    if (!id || !this.authService.hasValidToken()) {
      this.isLoading = false;
      this.error = 'Unable to load this meal.';
      return;
    }

    void this.mealProgress.init();

    this.mealService.getMealById(id).subscribe({
      next: (data) => {
        this.meal = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching meal', err);
        this.error = 'Could not load this recipe. Please try again.';
        this.isLoading = false;
      },
    });
  }

  hasSwapNotes(): boolean {
    return !!this.meal?.vegetableSubstitutes || !!this.meal?.freshOrFrozen;
  }

  increaseServings(): void {
    this.servings.update((s) => Math.min(MAX_SERVINGS, s + 1));
  }

  decreaseServings(): void {
    this.servings.update((s) => Math.max(MIN_SERVINGS, s - 1));
  }

  scaledIngredients(): Ingredient[] {
    const multiplier = this.servings();
    return (this.meal?.ingredients ?? []).map((ing) => ({
      name: ing.name,
      amount: scaleIngredientAmount(ing.amount, multiplier),
    }));
  }

  isCooked(): boolean {
    if (!this.meal || !this.planDate) return false;
    return this.mealProgress.isCooked(this.planDate, this.meal.id);
  }

  startCooking(): void {
    if (!this.meal?.instructions?.length) return;
    this.currentStep.set(0);
    this.cookModeOpen.set(true);
  }

  closeCookMode(): void {
    this.cookModeOpen.set(false);
  }

  totalSteps(): number {
    return this.meal?.instructions?.length ?? 0;
  }

  isLastStep(): boolean {
    return this.currentStep() === this.totalSteps() - 1;
  }

  currentInstruction(): string {
    return this.meal?.instructions?.[this.currentStep()] ?? '';
  }

  progressPercent(): number {
    const total = this.totalSteps();
    if (!total) return 0;
    return ((this.currentStep() + 1) / total) * 100;
  }

  nextStep(): void {
    if (this.isLastStep()) {
      this.finishCooking();
      return;
    }
    this.currentStep.update((s) => s + 1);
  }

  prevStep(): void {
    this.currentStep.update((s) => Math.max(0, s - 1));
  }

  private finishCooking(): void {
    if (this.meal && this.planDate && !this.isCooked()) {
      this.mealProgress.toggleCooked(this.planDate, this.meal.id);
    }
    this.cookModeOpen.set(false);
  }
}
