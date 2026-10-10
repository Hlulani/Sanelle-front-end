import { EvidenceService } from './evidence.service';
import { CatalogEntry } from './evidence.model';
describe('Evidence publication boundaries', () => {
  it('never supplies draft, in-review or withdrawn content to patient screens', () => {
    const service = new EvidenceService();
    const entries = service.search({});
    for (const e of entries) if (e.status !== 'published') expect(service.published(e.id)).toBeNull();
    const published = entries.find((e) => e.status === 'published')!;
    const withdrawn = { ...published, id: 'EV-WITHDRAWN', status: 'withdrawn' } as CatalogEntry;
    (service as unknown as { entries: CatalogEntry[] }).entries = [withdrawn];
    expect(service.published(withdrawn.id)).toBeNull();
    expect(service.publishedIn(withdrawn.topic)).toEqual([]);
    expect(service.entry(withdrawn.id)).toEqual(withdrawn);
  });
  it('all patient summaries retain population, outcome, uncertainty, sources and version', () => {
    const service = new EvidenceService();
    for (const e of service.search({ status: 'published' })) {
      expect(e.population).toBeTruthy();
      expect(e.outcome).toBeTruthy();
      expect(e.limitations).toBeTruthy();
      expect(e.sources.length).toBeGreaterThan(0);
      expect(e.version).toBeTruthy();
      expect(e.reviewer).toContain('review pending');
    }
  });
  it('recovers empty filters and searches by exact claim identifier', () => {
    const service = new EvidenceService();
    expect(service.search({ search: 'not-a-real-entry' })).toEqual([]);
    expect(service.search({ search: 'C17' }).some((e) => e.claimId === 'C17')).toBeTrue();
    expect(service.search({}).length).toBeGreaterThan(40);
  });
});
