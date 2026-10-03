import { TOPICS } from './topics.data';
import { FibroidOutcome } from './evidence.model';

const OUTCOMES: FibroidOutcome[] = ['incidence', 'growth', 'bleeding', 'pain', 'fertility'];

describe('evidence topics', () => {
  it('have unique ids', () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const t of TOPICS) {
    describe(t.id, () => {
      it('reports each of the five outcomes once, in order', () => {
        expect(t.findings.map((f) => f.outcome)).toEqual(OUTCOMES);
      });

      it('cites only studies it lists, and lists only studies it cites', () => {
        const listed = t.studies.map((s) => s.id);
        const cited = t.findings.reduce<string[]>((all, f) => all.concat(f.studyIds), []);
        expect(new Set(listed).size).toBe(listed.length);
        cited.forEach((id) => expect(listed).toContain(id));
        listed.forEach((id) => expect(cited).toContain(id));
      });

      it('files each study under an outcome it is cited for', () => {
        for (const s of t.studies) {
          const f = t.findings.find((x) => x.outcome === s.outcome);
          expect(f?.studyIds).withContext(s.id).toContain(s.id);
        }
      });

      it('links every source over https', () => {
        [...t.studies, ...(t.otherSources ?? [])].forEach((s) => expect(s.url).toMatch(/^https:\/\//));
      });

      it('gives no amounts or doses', () => {
        const text = JSON.stringify([t.answer, t.practical, t.findings.map((f) => f.summary)]);
        expect(text).not.toMatch(/\d+\s*(mg|g|mcg|µg|ml|cups?|servings?|portions?)\b/i);
      });
    });
  }
});
