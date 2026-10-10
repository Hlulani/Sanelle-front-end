import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { FigmaIconComponent } from '../../shared/design/figma/figma-icon.component';
import { EvidenceService } from '../evidence.service';
import { STATUS_LABELS, TOPIC_LABELS } from '../evidence.model';
@Component({
  selector: 'app-catalog-entry',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, FigmaIconComponent],
  templateUrl: './catalog-entry.page.html',
})
export class CatalogEntryPage {
  private readonly router = inject(Router);
  onExit() {
    void this.router.navigateByUrl('/tabs/today');
  }
  allEntries() {
    void this.router.navigateByUrl('/internal/evidence');
  }
  private readonly evidence = inject(EvidenceService);
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });
  readonly labels = STATUS_LABELS;
  readonly entry = computed(() => this.evidence.entry(this.id()));
}
