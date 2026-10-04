/** A number or a set of dimensions without a unit needs an explicit choice. */
export function isBareMeasurement(value: string): boolean {
  return /^\d+(?:[.,]\d+)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?){0,2}$/i.test(value.trim());
}
