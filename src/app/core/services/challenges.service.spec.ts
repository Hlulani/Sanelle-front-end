import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChallengesService, CHALLENGE_DEFINITIONS } from './challenges.service';
import { MealProgressService } from './meal-progress.service';
import { addDays, localIsoDate } from '../../shared/calendar-date';

function isoOffset(days: number): string {
  return addDays(localIsoDate(), days);
}

describe('ChallengesService', () => {
  let service: ChallengesService;
  let mealProgress: MealProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChallengesService);
    mealProgress = TestBed.inject(MealProgressService);
  });

  it('returns null progress for a challenge that has not been joined', () => {
    const def = CHALLENGE_DEFINITIONS[0];
    expect(service.progress(def)).toBeNull();
  });

  it('counts every individual cooked meal for a meals-in-period challenge, even on the same day', () => {
    const def = CHALLENGE_DEFINITIONS.find((c) => c.id === 'weekly-5')!;
    service.join(def.id);

    mealProgress.toggleCooked(isoOffset(0), 'meal-a');
    mealProgress.toggleCooked(isoOffset(0), 'meal-b'); // same day as meal-a — both should count
    mealProgress.toggleCooked(isoOffset(1), 'meal-c');

    const progress = service.progress(def)!;
    expect(progress.current).toBe(3);
    expect(progress.target).toBe(5);
    expect(progress.completed).toBeFalse();
    expect(progress.expired).toBeFalse();
  });

  it('counts distinct cooked days (not meals) for a days-in-period challenge', () => {
    const def = CHALLENGE_DEFINITIONS.find((c) => c.id === 'consistency-14')!;
    service.join(def.id);

    mealProgress.toggleCooked(isoOffset(0), 'meal-a');
    mealProgress.toggleCooked(isoOffset(0), 'meal-b'); // same day as meal-a — should count once
    mealProgress.toggleCooked(isoOffset(1), 'meal-c');

    const progress = service.progress(def)!;
    expect(progress.current).toBe(2);
  });

  it('computes the longest consecutive streak, resetting on a gap', () => {
    const def = CHALLENGE_DEFINITIONS.find((c) => c.id === 'streak-3')!;
    service.join(def.id);

    mealProgress.toggleCooked(isoOffset(0), 'meal-a');
    mealProgress.toggleCooked(isoOffset(1), 'meal-b');
    // gap at offset 2 (not cooked)
    mealProgress.toggleCooked(isoOffset(3), 'meal-c');

    const progress = service.progress(def)!;
    expect(progress.current).toBe(2);
    expect(progress.completed).toBeFalse();
  });

  it('marks a challenge completed once the target streak is reached', () => {
    const def = CHALLENGE_DEFINITIONS.find((c) => c.id === 'streak-3')!;
    service.join(def.id);

    mealProgress.toggleCooked(isoOffset(0), 'meal-a');
    mealProgress.toggleCooked(isoOffset(1), 'meal-b');
    mealProgress.toggleCooked(isoOffset(2), 'meal-c');

    const progress = service.progress(def)!;
    expect(progress.current).toBe(3);
    expect(progress.completed).toBeTrue();
  });

  it('leave() clears joined state so progress() returns null again', () => {
    const def = CHALLENGE_DEFINITIONS[0];
    service.join(def.id);
    expect(service.isJoined(def.id)).toBeTrue();

    service.leave(def.id);
    expect(service.isJoined(def.id)).toBeFalse();
    expect(service.progress(def)).toBeNull();
  });
});
