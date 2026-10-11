import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { EvidenceService } from '../evidence/evidence.service';
import { HealthRecord } from '../my-health/diagnosis.model';
import { InsightsResponse, buildInsightsRequest, checkDraft } from './ai-drafts';

/** Optional drafting by Claude. Offered only when the server has a key; the rules stay the fallback. */
@Injectable({ providedIn: 'root' })
export class AiDraftsService {
  private readonly http = inject(HttpClient);
  private readonly evidence = inject(EvidenceService);
  private readonly url = `${environment.apiBaseUrl}/ai`;
  private checked = false;

  readonly available = signal(false);
  /** She agreed to send her check-ins this session. Asked again after the app restarts. */
  readonly consented = signal(false);

  async refresh() {
    if (this.checked) return;
    this.checked = true;
    try {
      const s = await firstValueFrom(this.http.get<{ available: boolean }>(`${this.url}/status`));
      this.available.set(!!s.available);
    } catch {
      this.checked = false;
      this.available.set(false);
    }
  }

  async draft(record: HealthRecord, today: string): Promise<InsightsResponse> {
    const published = this.evidence
      .allPublished()
      .filter((e) => e.claimId)
      .map((e) => ({ claimId: e.claimId!, title: e.title, summary: e.explanation }));
    const request = buildInsightsRequest(record, published, today);
    const answer = await firstValueFrom(this.http.post<InsightsResponse>(`${this.url}/insights`, request));
    return checkDraft(answer, request);
  }
}
