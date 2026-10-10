import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaIconComponent } from '../../shared/design/figma/figma-icon.component';
import { EvidenceService } from '../evidence.service';
import { EvidenceStatus, EvidenceTopic, STATUS_LABELS, TOPIC_LABELS } from '../evidence.model';
@Component({
  selector: 'app-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, FormsModule, FigmaIconComponent],
  templateUrl: './catalog.page.html',
})
export class CatalogPage {
  private readonly router = inject(Router);
  readonly all = inject(EvidenceService).search({});
  readonly topicLabels = TOPIC_LABELS;
  count(status: EvidenceStatus) {
    return this.all.filter((e) => e.status === status).length;
  }
  onExit() {
    void this.router.navigateByUrl('/tabs/today');
  }
  setSelectedId(id: string) {
    void this.router.navigate(['/internal/evidence', id]);
  }
  openDraft() {
    const entry = this.all.find((e) => e.status === 'draft');
    if (entry) this.setSelectedId(entry.id);
  }
  private readonly evidence = inject(EvidenceService);
  readonly search = signal('');
  readonly topic = signal<EvidenceTopic | null>(null);
  readonly status = signal<EvidenceStatus | null>(null);
  readonly labels = STATUS_LABELS;
  readonly topics = Object.entries(TOPIC_LABELS).map(([value, label]) => ({ value: value as EvidenceTopic, label }));
  readonly statuses = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value: value as EvidenceStatus,
    label,
  }));
  readonly entries = computed(() =>
    this.evidence.search({ search: this.search(), topic: this.topic(), status: this.status() }),
  );
  clear() {
    this.search.set('');
    this.topic.set(null);
    this.status.set(null);
  }
}
