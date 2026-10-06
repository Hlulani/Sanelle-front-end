import { FindingCompleteness, FindingKey } from '../diagnosis.model';

export interface ReportSuggestion {
  key: FindingKey;
  completeness: Exclude<FindingCompleteness, { state: 'unknown' }>;
  wording: string;
}

function matches(text: string, pattern: RegExp): RegExpExecArray[] {
  const found: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) found.push(match);
  return found;
}

/** Conservative English text matching. Missing or ambiguous details produce no suggestion. */
export function suggestReportFindings(text: string): ReportSuggestion[] {
  const suggestions: ReportSuggestion[] = [];
  const sentences = text
    .replace(/\r/g, '')
    .split(/(?<=[.!?])\s+(?=[A-Z])|\n{2,}/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const add = (suggestion: ReportSuggestion) => {
    const value = suggestion.completeness.state === 'present' ? suggestion.completeness.value : 'absent';
    if (
      !suggestions.some(
        (s) =>
          s.key === suggestion.key && (s.completeness.state === 'present' ? s.completeness.value : 'absent') === value,
      )
    ) {
      suggestions.push(suggestion);
    }
  };
  for (const sentence of sentences) {
    if (
      sentence.length > 800 ||
      /\b(?:possibly|possible|suspected|cannot exclude|uncertain|may represent)\b/i.test(sentence)
    )
      continue;
    const positiveStatement = !/\b(?:no|not|without|absent|never)\b/i.test(sentence);
    for (const match of positiveStatement
      ? matches(
          sentence,
          /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|single|multiple|several)\s+(?:(?:uterine|intramural|submucosal|subserosal|small|large)\s+){0,3}fibroids?\b/gi,
        )
      : []) {
      add({ key: 'count', completeness: { state: 'present', value: match[0] }, wording: sentence });
    }
    if (
      positiveStatement &&
      /\bfibroid\b/i.test(sentence) &&
      (/\b(?:largest|dominant)\b/i.test(sentence) ||
        /\b(?:single|one)\s+(?:(?:uterine|intramural|submucosal|subserosal)\s+)*fibroid\b/i.test(sentence))
    ) {
      const measurements = matches(
        sentence,
        /\b\d+(?:[.,]\d+)?(?:\s*(?:cm|mm)?\s*[x×]\s*\d+(?:[.,]\d+)?){0,2}\s*(?:cm|mm)\b/gi,
      );
      // More than one measurement could refer to different structures. Ask the person to enter it.
      if (measurements.length === 1)
        add({ key: 'largestSize', completeness: { state: 'present', value: measurements[0][0] }, wording: sentence });
    }
    if (/\bfibroids?\b/i.test(sentence) && !/\b(?:no|not|without|absent)\b/i.test(sentence)) {
      const locations = matches(
        sentence,
        /\b(?:intramural|submucosal|subserosal|pedunculated|anterior wall|posterior wall|fundal)\b/gi,
      ).map((m) => m[0]);
      if (locations.length)
        add({
          key: 'location',
          completeness: { state: 'present', value: [...new Set(locations)].join(', ') },
          wording: sentence,
        });
    }
    if (/\b(?:uterine|endometrial)\s+cavity\b/i.test(sentence)) {
      if (/\bcavity\s+(?:is\s+)?(?:not\s+(?:distorted|affected|involved)|unaffected|undistorted)\b/i.test(sentence)) {
        add({ key: 'cavity', completeness: { state: 'absent' }, wording: sentence });
      } else if (/\bcavity\s+(?:is\s+)?(?:distorted|affected|involved)\b/i.test(sentence)) {
        add({ key: 'cavity', completeness: { state: 'present', value: sentence }, wording: sentence });
      }
    }
    for (const match of positiveStatement
      ? matches(sentence, /\bFIGO(?:\s+(?:type|classification))?\s*[:\-]?\s*[0-8](?:\s*[-–/]\s*[0-8])?\b/gi)
      : []) {
      add({ key: 'figo', completeness: { state: 'present', value: match[0] }, wording: sentence });
    }
  }
  return suggestions;
}
