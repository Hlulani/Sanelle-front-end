import { sameRestrictions } from './food-restrictions.service';

describe('sameRestrictions', () => {
  it('treats order and letter case as the same', () => {
    expect(sameRestrictions({ allergies: ['MILK', 'EGG'], dislikes: ['Mushrooms'] }, { allergies: ['EGG', 'MILK'], dislikes: ['mushrooms'] })).toBeTrue();
  });

  it('notices an added allergy', () => {
    expect(sameRestrictions({ allergies: [], dislikes: [] }, { allergies: ['SESAME'], dislikes: [] })).toBeFalse();
  });

  it('treats a plan made before restrictions existed as matching only when there are none', () => {
    expect(sameRestrictions(null, { allergies: [], dislikes: [] })).toBeTrue();
    expect(sameRestrictions(null, { allergies: ['MILK'], dislikes: [] })).toBeFalse();
  });
});
