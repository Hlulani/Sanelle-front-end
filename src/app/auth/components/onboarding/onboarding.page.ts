import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { AuthService } from '../../../core/auth/auth.service';
import { FocusPreferencesService } from '../../../core/services/focus-preferences.service';
import { ProteinPreference } from '../../../core/services/meal-plans.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage {
 currentStep = signal(1);
  totalSteps = 5;
  selectedGoal = signal<string | null>(null);
  selectedDiet = signal<ProteinPreference | null>(null);

  preferences = {
    goal: '',
    diet: '' as ProteinPreference | '',
    focuses: [] as string[],
    completed: false
  };

  // Bumped whenever `preferences.focuses` is mutated in place, so the computed()s
  // below (which the template's *ngFor loops read) know when to actually recompute.
  // Without this, those *ngFor-bound methods would return a brand-new array/object
  // on every change-detection cycle even when nothing changed, and Angular's differ
  // would tear down and rebuild the ion-chip/ion-item DOM every single cycle — whose
  // MutationObservers then re-trigger change detection, spinning the CPU forever.
  private focusesTick = signal(0);

  private router = inject(Router);
  private auth = inject(AuthService);
  private focusPreferences = inject(FocusPreferencesService);

  // NEW: toggle focus (multi-select)
  toggleFocus(focus: string) {
    const idx = this.preferences.focuses.indexOf(focus);
    if (idx >= 0) {
      this.preferences.focuses.splice(idx, 1);
    } else {
      this.preferences.focuses.push(focus);
    }
    this.focusesTick.update(v => v + 1);
  }

  // NEW: helper for checkbox state
  hasFocus(focus: string): boolean {
    return this.preferences.focuses.includes(focus);
  }

  primaryFocusLabel = computed(() => this.focusLabel(this.selectedGoal() ?? ''));

  secondaryFocusOptions = computed<{ key: string; label: string }[]>(() => {
    const descriptions: Record<string, string> = {
      anti_inflammatory: 'Anti-inflammatory meals',
      iron_support: 'Iron support',
      high_fiber: 'Higher fiber (gentle)',
    };
    const goal = this.selectedGoal();
    return Object.keys(descriptions)
      .filter((f) => f !== goal)
      .map((f) => ({ key: f, label: descriptions[f] }));
  });


  nextStep() {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(s => s + 1);
    } else {
      this.finish();
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  onGoalTap(goal: string) {
    this.selectedGoal.set(goal);
    this.fireHaptic();
    this.selectGoal(goal);
  }

  onDietTap(diet: ProteinPreference) {
    this.selectedDiet.set(diet);
    this.fireHaptic();
    this.selectDiet(diet);
  }

  // Deliberately not awaited — haptic feedback is a nice-to-have, never worth blocking
  // the actual step transition on, and it isn't available in every environment anyway
  // (e.g. iOS Simulator has no haptic engine).
  private fireHaptic(): void {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
      // Ignore — haptic feedback is a nice-to-have, not a requirement.
    });
  }

  private selectGoal(goal: string) {
    const previousGoal = this.preferences.goal;
    if (previousGoal && previousGoal !== goal) {
      const idx = this.preferences.focuses.indexOf(previousGoal);
      if (idx >= 0) {
        this.preferences.focuses.splice(idx, 1);
      }
    }

    this.preferences.goal = goal;
    if (!this.preferences.focuses.includes(goal)) {
      this.preferences.focuses.push(goal);
    }
    this.focusesTick.update(v => v + 1);
    this.nextStep();
  }

  private selectDiet(diet: ProteinPreference) {
    this.preferences.diet = diet;
    this.nextStep();
  }

  async finish() {
    await this.focusPreferences.save(this.preferences.focuses);
    if (this.preferences.diet) {
      await this.focusPreferences.saveDiet(this.preferences.diet);
    }
    this.auth.setOnboardingCompleted(true);
    this.router.navigateByUrl('/tabs/today');
  }


  // --- Step 5: Dynamic approach copy (neutral, based on selections) ---

  private focusLabel(f: string): string {
    const map: Record<string, string> = {
      anti_inflammatory: 'Anti-inflammatory',
      iron_support: 'Iron support',
      high_fiber: 'Higher fiber',
    };
    return map[f] ?? f;
  }

  getSelectedFocusChips = computed<string[]>(() => {
    this.focusesTick();
    return (this.preferences.focuses || []).map(f => this.focusLabel(f));
  });

  getDietLabel = computed<string>(() => {
    const map: Record<ProteinPreference, string> = {
      ANY: '',
      MEATY: 'Meaty',
      VEGETARIAN: 'Vegetarian',
      VEGAN: 'Vegan',
    };
    const diet = this.selectedDiet();
    return diet ? map[diet] : '';
  });

  getApproachTitle = computed<string>(() => {
    this.focusesTick();
    if (this.preferences.focuses?.includes('anti_inflammatory')) return 'A plan built around calm, nourishing meals';
    if (this.preferences.focuses?.includes('iron_support')) return 'A plan that supports energy and strength';
    if (this.preferences.focuses?.includes('high_fiber')) return 'A gentler plan, built for comfort';
    return 'A plan built for your preferences';
  });

  getApproachBullets = computed<string[]>(() => {
    this.focusesTick();
    const bullets: string[] = [];
    const f = new Set(this.preferences.focuses || []);

    if (f.has('anti_inflammatory')) bullets.push('More anti-inflammatory ingredients across your week.');
    if (f.has('iron_support')) bullets.push('Iron-supporting meals paired with smart combinations.');
    if (f.has('high_fiber')) bullets.push('Fiber-forward options, balanced and easy to stick to.');

    if (bullets.length === 0) {
      bullets.push('Balanced, whole-food meals built for consistency.');
    }

    return bullets;
  });

  getScienceCards = computed<{ tag: string; title: string; body: string; icon: string; colorClass: string }[]>(() => {
    this.focusesTick();
    const map: Record<string, { tag: string; title: string; body: string; icon: string; colorClass: string }> = {
      anti_inflammatory: {
        tag: 'Inflammation Support',
        title: 'Anti-Inflammatory Focus',
        body: 'We prioritize omega-3s, herbs, and colorful produce to support calm, steady inflammation levels.',
        icon: 'heart-outline',
        colorClass: 'goal-card--anti-inflammatory',
      },
      high_fiber: {
        tag: 'Fiber Support',
        title: 'Fiber-Forward Meals',
        body: 'We increase plant-based fiber to support regularity while keeping meals easy to enjoy.',
        icon: 'leaf-outline',
        colorClass: 'goal-card--fiber',
      },
      iron_support: {
        tag: 'Energy Support',
        title: 'Iron-Smart Pairings',
        body: 'We pair iron-rich foods with absorption-friendly ingredients to support energy levels.',
        icon: 'flash-outline',
        colorClass: 'goal-card--iron',
      },
    };

    const selected = (this.preferences.focuses || [])
      .map((f) => map[f])
      .filter(Boolean);

    if (selected.length > 0) {
      return selected;
    }

    return [{
      tag: 'Balanced Nutrition',
      title: 'Whole-Food Focus',
      body: 'Meals are built around whole ingredients for steady energy and consistency.',
      icon: 'nutrition-outline',
      colorClass: 'goal-card--anti-inflammatory',
    }];
  });

}
