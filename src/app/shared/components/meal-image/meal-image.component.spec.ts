import { shortDishName } from './meal-image.component';
import { photoFor } from '../../meal-photos';

describe('shortDishName', () => {
  it('keeps the dish and drops extras', () => {
    expect(shortDishName('Greek Yogurt Parfait with Blueberries, Flaxseed, Honey')).toBe('Greek Yogurt Parfait');
    expect(shortDishName('Avocado Toast with Fried Egg and Feta (Non-Vegan Alt)')).toBe('Avocado Toast');
    expect(shortDishName('Roasted Vegetable and Chickpea Curry')).toBe('Chickpea Curry');
    expect(shortDishName('Beef and Quinoa Stuffed Bell Peppers (Non-Vegan Alt)')).toBe('Stuffed Bell Peppers');
  });
});

describe('photoFor', () => {
  it('only returns photos matched to that exact recipe', () => {
    expect(photoFor('Tomato Mozzarella Snack Plate')).not.toBeNull();
    expect(photoFor('Tomato Basil Egg Muffins')).toBeNull();
    expect(photoFor(undefined)).toBeNull();
  });
});
