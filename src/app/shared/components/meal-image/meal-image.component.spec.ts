import { TestBed } from '@angular/core/testing';
import { MealImageComponent, shortDishName } from './meal-image.component';
import { FALLBACK_MEAL_PHOTO, MEAL_PHOTOS, backendMealImageSrc, photoFor } from '../../meal-photos';
import { environment } from '../../../../environments/environment';

describe('shortDishName', () => {
  it('keeps the dish and drops extras', () => {
    expect(shortDishName('Greek Yogurt Parfait with Blueberries, Flaxseed, Honey')).toBe('Greek Yogurt Parfait');
    expect(shortDishName('Avocado Toast with Fried Egg and Feta (Non-Vegan Alt)')).toBe('Avocado Toast');
    expect(shortDishName('Roasted Vegetable and Chickpea Curry')).toBe('Chickpea Curry');
    expect(shortDishName('Beef and Quinoa Stuffed Bell Peppers (Non-Vegan Alt)')).toBe('Stuffed Bell Peppers');
  });
});

describe('photoFor', () => {
  it('covers the full current catalogue without substituting unrelated dishes for unknown names', () => {
    expect(Object.keys(MEAL_PHOTOS).length).toBe(166);
    expect(photoFor('Tomato Mozzarella Snack Plate')).not.toBeNull();
    expect(photoFor('Tomato Basil Egg Muffins')).not.toBeNull();
    expect(photoFor('A newly added recipe')).toBeNull();
    expect(photoFor(undefined)).toBeNull();
    for (const photo of Object.values(MEAL_PHOTOS)) {
      expect(photo.src).toMatch(/^assets\/meals\/.+\.jpg$/);
      expect(photo.source).toMatch(/^https:\/\//);
      expect(photo.credit).toBeTruthy();
      expect(photo.license).toBeTruthy();
    }
  });

  it('keeps a recipe match despite case and whitespace differences', () => {
    expect(photoFor('  TOFU   STIR-FRY BOWL  ')).toEqual(photoFor('Tofu Stir-Fry Bowl'));
  });
});

describe('backendMealImageSrc', () => {
  it('preserves online photos and local assets while resolving backend paths with one slash', () => {
    expect(backendMealImageSrc('https://example.test/recipe.jpg')).toBe('https://example.test/recipe.jpg');
    expect(backendMealImageSrc('/assets/meals/pea-soup.jpg')).toBe('assets/meals/pea-soup.jpg');
    expect(backendMealImageSrc('uploads/recipe.jpg')).toBe(environment.hostBaseUrl + '/uploads/recipe.jpg');
    expect(backendMealImageSrc('/uploads/recipe.jpg')).toBe(environment.hostBaseUrl + '/uploads/recipe.jpg');
    expect(backendMealImageSrc('javascript:alert(1)')).toBeNull();
  });
});

describe('MealImageComponent', () => {
  it('recovers a failed backend photo with the matched local dish and its attribution', () => {
    const fixture = TestBed.createComponent(MealImageComponent);
    fixture.componentRef.setInput('name', 'Tofu Stir-Fry Bowl');
    fixture.componentRef.setInput('imageUrl', 'https://example.test/unavailable.jpg');
    fixture.detectChanges();
    let img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe('https://example.test/unavailable.jpg');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe(photoFor('Tofu Stir-Fry Bowl')!.src);
    expect(fixture.componentInstance.photo()?.credit).toBe('Polina Tankilevitch / Pexels');
    expect(img.alt).toContain('Serving suggestion');
    fixture.destroy();
  });

  it('uses neutral meal inspiration for a future recipe and replaces it when a recipe photo arrives', () => {
    const fixture = TestBed.createComponent(MealImageComponent);
    fixture.componentRef.setInput('name', 'A newly added recipe');
    fixture.detectChanges();
    expect(fixture.componentInstance.src()).toBe(FALLBACK_MEAL_PHOTO.src);
    expect(fixture.componentInstance.alt()).not.toContain('A newly added recipe');
    fixture.componentRef.setInput('imageUrl', 'https://example.test/new-recipe.jpg');
    fixture.detectChanges();
    expect(fixture.componentInstance.src()).toBe('https://example.test/new-recipe.jpg');
    expect(fixture.componentInstance.photo()).toBeNull();
    fixture.destroy();
  });

  it('clears failed requests when the reused card changes to a different meal', () => {
    const fixture = TestBed.createComponent(MealImageComponent);
    fixture.componentRef.setInput('name', 'Tofu Stir-Fry Bowl');
    fixture.componentRef.setInput('imageUrl', 'https://example.test/photo.jpg');
    fixture.detectChanges();
    fixture.componentInstance.failed('https://example.test/photo.jpg');
    fixture.detectChanges();
    fixture.componentRef.setInput('name', 'Chicken Avocado Salad');
    fixture.detectChanges();
    expect(fixture.componentInstance.src()).toBe('https://example.test/photo.jpg');
    fixture.componentInstance.failed(photoFor('Tofu Stir-Fry Bowl')!.src);
    expect(fixture.componentInstance.src()).toBe('https://example.test/photo.jpg');
    fixture.destroy();
  });
});
