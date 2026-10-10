import { FigmaFrameComponent } from '../../shared/design/figma/figma-frame.component';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { ClinicalResult } from '../diagnosis.model';
import { calendarDate, notAfter, notBlank } from '../../shared/forms/validators';
import { localIsoDate } from '../../shared/calendar-date';
import { messageFor } from '../../core/errors/errors';

export const RESULT_SOURCES = ['Lab report', 'Patient portal', 'Told by my clinician', 'Other'];

/** SYM-04: a reported result, saved exactly: name, value, unit, test date and source. Never interpreted. */
@Component({
  selector: 'app-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FigmaFrameComponent, IonContent, RouterLink, ReactiveFormsModule],
  template: `
    <ion-content>
      <app-figma-frame active="health" title="Your test results" label="My health"
        ><div class="visit-paper source-extension">
          <div class="section-title"><a class="text-action" routerLink="/tabs/health">My health</a></div>
          <header class="section-title source-extension-heading">
            <p class="eyebrow">Reported clinical results</p>
            <h1>Your test results</h1>
            <p class="source-extension-intro">
              Copy them exactly. Sanelle shows them in your summary and never interprets them.
            </p>
          </header>

          @if (results().length) {
            <ul class="source-list">
              @for (r of results(); track r.id) {
                <li class="result">
                  <div>
                    <p class="source-list-title">{{ r.name }}: {{ r.value }}{{ r.unit ? ' ' + r.unit : '' }}</p>
                    <p class="fine-print">
                      {{ r.testDate ? 'Tested ' + r.testDate : 'Test date not recorded' }} · {{ r.source }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="primary compact secondary"
                    (click)="remove(r)"
                    [attr.aria-label]="'Remove ' + r.name"
                  >
                    Remove
                  </button>
                </li>
              }
            </ul>
          } @else {
            <p class="fine-print">No reported result saved.</p>
          }

          <section class="paper-section" aria-labelledby="add-title">
            <h2 id="add-title">Add an exact result</h2>
            <form class="answer-form" [formGroup]="form" (ngSubmit)="save()" novalidate>
              <label class="source-field answer-form">
                <span>Result name</span>
                <input formControlName="name" name="name" placeholder="As written, e.g. Haemoglobin" />
              </label>
              <div class="two">
                <label class="source-field answer-form">
                  <span>Exact value</span>
                  <input formControlName="value" name="value" inputmode="decimal" placeholder="e.g. 10.9" />
                </label>
                <label class="source-field answer-form">
                  <span>Unit</span>
                  <input formControlName="unit" name="unit" placeholder="e.g. g/dL" />
                </label>
              </div>
              <label class="source-field answer-form">
                <span>Test date <em class="optional">(optional)</em></span>
                <input type="date" formControlName="testDate" name="testDate" [max]="today" />
              </label>
              <label class="source-field answer-form">
                <span>Source</span>
                <select formControlName="source" name="source">
                  @for (s of sources; track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
              </label>
              @if (error()) {
                <p class="form-error" role="alert">{{ error() }}</p>
              }
              @if (saved()) {
                <p class="save-notice" role="status">Result saved. It’s in your appointment summary.</p>
              }
              <button type="submit" class="primary" [disabled]="saving()">Save result</button>
            </form>
            @if (anaemia(); as e) {
              <a class="text-action" [routerLink]="['/learn', e]">Why check-ins can’t replace a blood test</a>
            }
          </section>
        </div></app-figma-frame
      >
    </ion-content>
  `,
})
export class ResultsPage {
  private readonly repo = inject(HealthRepository);
  readonly today = localIsoDate();
  readonly sources = RESULT_SOURCES;
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);
  readonly anaemia = signal('C12');
  readonly results = computed(() =>
    [...(this.repo.record().results ?? [])].sort((a, b) =>
      (b.testDate ?? b.savedAt).localeCompare(a.testDate ?? a.savedAt),
    ),
  );

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [notBlank()] }),
    value: new FormControl('', { nonNullable: true, validators: [notBlank()] }),
    unit: new FormControl('', { nonNullable: true }),
    testDate: new FormControl('', { nonNullable: true, validators: [calendarDate(), notAfter(() => this.today)] }),
    source: new FormControl(RESULT_SOURCES[0], { nonNullable: true, validators: [Validators.required] }),
  });

  ionViewWillEnter() {
    void this.repo.load();
  }

  async save() {
    this.error.set(null);
    this.saved.set(false);
    const c = this.form.controls;
    if (c.name.invalid) return this.error.set('Add the result name, as written on the result.');
    if (c.value.invalid) return this.error.set('Add the exact value.');
    if (c.testDate.invalid) return this.error.set('Choose a test date that isn’t in the future, or leave it blank.');
    const v = this.form.getRawValue();
    this.saving.set(true);
    try {
      await this.repo.saveResult({ ...v, testDate: v.testDate || undefined });
      this.form.reset({ source: RESULT_SOURCES[0] });
      this.saved.set(true);
    } catch (e) {
      this.error.set(messageFor(e, 'The result couldn’t be saved. Please try again.'));
    } finally {
      this.saving.set(false);
    }
  }

  remove(r: ClinicalResult) {
    void this.repo.removeResult(r.id).catch(() => this.error.set('The result couldn’t be removed. Please try again.'));
  }
}
