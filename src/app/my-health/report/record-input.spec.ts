import { isBareMeasurement } from './record-input';

describe('Size entry', () => {
  it('requires a unit choice for a number or dimensions alone', () => {
    expect(isBareMeasurement('1.3')).toBeTrue();
    expect(isBareMeasurement('41 x 36')).toBeTrue();
    expect(isBareMeasurement('4,1 × 3,6')).toBeTrue();
  });

  it('preserves sizes already written with their units', () => {
    expect(isBareMeasurement('1.3 cm')).toBeFalse();
    expect(isBareMeasurement('41 × 36 mm')).toBeFalse();
  });
});
