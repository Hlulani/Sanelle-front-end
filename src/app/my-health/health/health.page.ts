import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { FINDINGS, FINDING_KEYS, findingOrUnknown } from '../diagnosis.model';
import { FindingStatusComponent } from '../finding-status.component';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [RouterLink, FormsModule, IonContent, FindingStatusComponent],
  templateUrl: './health.page.html',
  styleUrls: ['./health.page.scss'],
})
export class HealthPage {
  private repo = inject(HealthRepository);

  readonly defs = FINDINGS;
  readonly rows = computed(() => FINDING_KEYS.map((k) => findingOrUnknown(this.repo.record(), k)));
  readonly unknownCount = computed(() => this.rows().filter((f) => f.completeness.state === 'unknown').length);
  readonly questions = this.repo.questions;
  readonly appointment = computed(() => this.repo.record().appointment);

  ionViewWillEnter() {
    void this.repo.load();
  }

  setDate(value: string) {
    void this.repo.setAppointment({ ...this.appointment(), date: value || undefined });
  }

  setWith(value: string) {
    void this.repo.setAppointment({ ...this.appointment(), with: value.trim() || undefined });
  }
}
