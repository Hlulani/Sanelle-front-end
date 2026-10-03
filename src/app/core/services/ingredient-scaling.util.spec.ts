import { scaleIngredientAmount } from './ingredient-scaling.util';

describe('scaleIngredientAmount', () => {
  it('leaves the amount unchanged at 1x', () => {
    expect(scaleIngredientAmount('2 cups', 1)).toBe('2 cups');
  });

  it('scales a whole number with a unit', () => {
    expect(scaleIngredientAmount('30 g', 2)).toBe('60 g');
  });

  it('scales a bare count with no unit', () => {
    expect(scaleIngredientAmount('2', 3)).toBe('6');
  });

  it('scales a simple fraction into a mixed number', () => {
    expect(scaleIngredientAmount('1/2', 3)).toBe('1 1/2');
  });

  it('scales a fraction with a unit', () => {
    expect(scaleIngredientAmount('3/4 cup', 2)).toBe('1 1/2 cup');
  });

  it('scales a mixed number', () => {
    expect(scaleIngredientAmount('1 1/2 tbsp', 2)).toBe('3 tbsp');
  });

  it('leaves non-numeric amounts unchanged', () => {
    expect(scaleIngredientAmount('pinch', 4)).toBe('pinch');
    expect(scaleIngredientAmount('to taste', 4)).toBe('to taste');
  });

  it('falls back to a rounded decimal for uncommon fractions', () => {
    expect(scaleIngredientAmount('1/7 cup', 2)).toBe('0.29 cup');
  });

  // Real amount strings pulled from the seeded meal_ingredients table, to catch
  // formats the handwritten unit tests above didn't anticipate.
  describe('against real seeded data', () => {
    it('scales a range by scaling both ends', () => {
      expect(scaleIngredientAmount('2-3 slices', 2)).toBe('4-6 slices');
    });

    it('leaves a decimal amount byte-for-byte unchanged at 1x', () => {
      expect(scaleIngredientAmount('1.5 cups', 1)).toBe('1.5 cups');
    });

    it('scales a decimal amount into a mixed-number fraction above 1x', () => {
      expect(scaleIngredientAmount('1.5 cups', 3)).toBe('4 1/2 cups');
    });

    it('scales a comma-qualified amount, preserving the qualifier', () => {
      expect(scaleIngredientAmount('1/2, diced', 2)).toBe('1, diced');
      expect(scaleIngredientAmount('1 can, rinsed', 3)).toBe('3 can, rinsed');
    });

    it('scales both the primary quantity and a parenthetical annotation', () => {
      expect(scaleIngredientAmount('1 can (about 120 g)', 2)).toBe('2 can (about 240 g)');
      expect(scaleIngredientAmount('1 can (about 90 g)', 3)).toBe('3 can (about 270 g)');
    });
  });
});
