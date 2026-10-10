import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../../../core/profile/profile.service';
import { FigmaIconComponent } from './figma-icon.component';

@Component({
  selector: 'app-figma-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FigmaIconComponent],
  host: { class: 'figma' },
  styles: [':host { display:block; width:100%; }'],
  template: ` <div class="app-shell">
    <aside class="desktop-nav" aria-label="Primary navigation">
      <div class="brand"><span class="brand-mark">s</span><span>sanelle</span></div>
      <nav>
        @for (tab of tabs; track tab.id) {
          <button [class.active]="active() === tab.id" (click)="go(tab.route)">
            <svg [figmaIcon]="tab.icon" />{{ tab.label }}
          </button>
        }
      </nav>
      <div class="support-note"><span>Private by design</span>Your health entries are encrypted on this device.</div>
    </aside>
    <main>
      <header class="topbar">
        <div class="brand"><span class="brand-mark">s</span><span>sanelle</span></div>
        <div class="topbar-actions">
          <button class="avatar" aria-label="Open profile" (click)="go('/account')">
            {{ profile.name().slice(0, 1).toUpperCase() }}
          </button>
        </div>
      </header>
      <div class="content">
        <div class="page-heading">
          <div>
            @if (active() !== 'today') {
              <p class="eyebrow">{{ label() }}</p>
            }
            <h1>{{ title() }}</h1>
            @if (active() === 'today') {
              <p>One helpful next step is enough.</p>
            }
          </div>
          @if (active() === 'health') {
            <button class="secondary compact" (click)="logSymptoms()"><svg figmaIcon="plus" /> Log symptoms</button>
          }
        </div>
        <ng-content />
      </div>
    </main>
    <nav class="mobile-nav" aria-label="Primary navigation">
      @for (tab of tabs; track tab.id) {
        <button [class.active]="active() === tab.id" (click)="go(tab.route)">
          <svg [figmaIcon]="tab.icon" [size]="21" /><span>{{ tab.label }}</span>
        </button>
      }
    </nav>
  </div>`,
})
export class FigmaFrameComponent {
  readonly profile = inject(ProfileService);
  private readonly router = inject(Router);
  readonly active = input.required<string>();
  readonly title = input.required<string>();
  readonly label = input('');
  readonly tabs = [
    { id: 'today', label: 'Today', icon: 'home', route: '/tabs/today' },
    { id: 'food', label: 'Food', icon: 'food', route: '/tabs/food' },
    { id: 'health', label: 'My health', icon: 'health', route: '/tabs/health' },
    { id: 'visit', label: 'Appointment', icon: 'visit', route: '/tabs/appointment' },
  ];
  logSymptoms() {
    void this.router.navigate(['/health/check-in/today'], { queryParams: { from: 'health', view: 'symptoms' } });
  }
  go(route: string) {
    void this.router.navigateByUrl(route);
  }
}
