import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { EvidenceTopic } from './evidence.model';
import { TOPICS } from './topics.data';

@Injectable({ providedIn: 'root' })
export class EvidenceTopicsService {
  private readonly showDrafts = environment.showDraftContent;

  /** Topics a person can see in this build. Drafts never reach production. */
  list(): EvidenceTopic[] {
    return TOPICS.filter((t) => this.isVisible(t));
  }

  get(id: string): EvidenceTopic | null {
    const topic = TOPICS.find((t) => t.id === id);
    return topic && this.isVisible(topic) ? topic : null;
  }

  private isVisible(topic: EvidenceTopic): boolean {
    return topic.review.state === 'reviewed' || this.showDrafts;
  }
}
