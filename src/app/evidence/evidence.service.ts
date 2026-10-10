import { Injectable } from '@angular/core';
import { CATALOG } from './evidence-catalog';
import { CatalogEntry, EvidenceStatus, EvidenceTopic } from './evidence.model';

export interface CatalogFilter {
  search?: string;
  topic?: EvidenceTopic | null;
  status?: EvidenceStatus | null;
}

/**
 * The one way screens read evidence. Patient screens can only reach published entries;
 * the internal catalogue sees every entry, whatever its status.
 */
@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private readonly entries: readonly CatalogEntry[] = CATALOG;

  /** A published entry by catalogue id (e.g. "EV-C37") or claim id ("C37"); null otherwise. */
  published(id: string): CatalogEntry | null {
    const entry = this.find(id);
    return entry?.status === 'published' ? entry : null;
  }

  publishedIn(topic: EvidenceTopic): CatalogEntry[] {
    return this.entries.filter((e) => e.status === 'published' && e.topic === topic);
  }

  /** Internal catalogue only. */
  entry(id: string): CatalogEntry | null {
    return this.find(id) ?? null;
  }

  /** Internal catalogue only: searches title, id and explanation. */
  search(filter: CatalogFilter): CatalogEntry[] {
    const words = (filter.search ?? '').trim().toLowerCase();
    return this.entries.filter(
      (e) =>
        (!filter.topic || e.topic === filter.topic) &&
        (!filter.status || e.status === filter.status) &&
        (!words || [e.id, e.claimId ?? '', e.title, e.explanation].some((text) => text.toLowerCase().includes(words))),
    );
  }

  private find(id: string): CatalogEntry | undefined {
    const key = id.toUpperCase();
    return this.entries.find((e) => e.id === key || e.claimId === key);
  }
}
