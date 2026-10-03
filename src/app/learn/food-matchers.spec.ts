import { containsDairy, isDairyIngredient } from './food-matchers';

describe('isDairyIngredient', () => {
  it('matches dairy names and common aliases', () => {
    for (const name of ['Milk', 'Greek yogurt', 'Feta', 'Parmesan, grated', 'Unsalted butter', 'Ghee', 'Plain yoghurt', 'Heavy cream', 'Brie', 'Burrata', 'Mozzarella', 'Cheddar, grated']) {
      expect(isDairyIngredient(name)).withContext(name).toBeTrue();
    }
  });

  it('ignores plant-based look-alikes', () => {
    for (const name of ['Almond milk', 'Coconut milk', 'Oat milk', 'Peanut butter', 'Almond butter', 'Coconut yogurt', 'Cream of tartar']) {
      expect(isDairyIngredient(name)).withContext(name).toBeFalse();
    }
  });

  it('judges the main ingredient, not an optional alternative', () => {
    expect(isDairyIngredient('Milk (or oat milk)')).toBeTrue();
    expect(isDairyIngredient('Oat milk (or dairy milk)')).toBeFalse();
  });

  it('does not match words that only contain a dairy term', () => {
    expect(isDairyIngredient('Butternut squash')).toBeFalse();
    expect(isDairyIngredient('Creamed corn')).toBeFalse();
  });
});

describe('containsDairy', () => {
  it('is false for missing ingredient lists', () => {
    expect(containsDairy(undefined)).toBeFalse();
    expect(containsDairy([])).toBeFalse();
  });

  it('is true when any ingredient is dairy', () => {
    expect(containsDairy([{ name: 'Spinach', amount: '1 cup' }, { name: 'Feta', amount: '30 g' }])).toBeTrue();
  });
});
