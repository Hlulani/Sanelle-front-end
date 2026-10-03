import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CustomChallengesService } from './custom-challenges.service';
import { CustomChallengeResponse } from './api.service';
import { MealProgressService } from './meal-progress.service';
import { environment } from '../../../environments/environment';

function makeChallenge(overrides: Partial<CustomChallengeResponse> = {}): CustomChallengeResponse {
  return {
    id: 'challenge-1',
    name: '30-Day Reset',
    description: null,
    type: 'meals-in-period',
    targetCount: 10,
    durationDays: 14,
    inviteCode: 'ABCD1234',
    createdByUserId: 'user-1',
    createdByUsername: 'hlulani',
    createdAt: new Date().toISOString(),
    isCreator: true,
    ...overrides,
  };
}

describe('CustomChallengesService', () => {
  let service: CustomChallengesService;
  let mealProgress: MealProgressService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiBaseUrl}/custom-challenges`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CustomChallengesService);
    mealProgress = TestBed.inject(MealProgressService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns null progress for a challenge that has not been created/joined locally', () => {
    expect(service.progress(makeChallenge())).toBeNull();
  });

  it('create() records a local join and refreshes the list', () => {
    const challenge = makeChallenge();
    const captured: { value?: CustomChallengeResponse } = {};

    service.create('30-Day Reset', undefined, 'meals-in-period', 10, 14, (c) => (captured.value = c), fail);

    const createReq = httpMock.expectOne(base);
    expect(createReq.request.method).toBe('POST');
    createReq.flush(challenge);

    const mineReq = httpMock.expectOne(`${base}/mine`);
    expect(mineReq.request.method).toBe('GET');
    mineReq.flush([challenge]);

    expect(captured.value).toEqual(challenge);
    expect(service.list()).toEqual([challenge]);
    expect(service.progress(challenge)).not.toBeNull();
  });

  it('progress reflects real cooked-meal data once locally joined', () => {
    const challenge = makeChallenge({ targetCount: 2 });
    service.create('30-Day Reset', undefined, 'meals-in-period', 2, 14, () => {}, fail);
    httpMock.expectOne(base).flush(challenge);
    httpMock.expectOne(`${base}/mine`).flush([challenge]);

    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    mealProgress.toggleCooked(iso, 'meal-a');
    mealProgress.toggleCooked(iso, 'meal-b');

    const progress = service.progress(challenge)!;
    expect(progress.current).toBe(2);
    expect(progress.completed).toBeTrue();
  });

  it('joinByCode() surfaces a clear message on a 404 (unknown code)', () => {
    const captured: { message?: string } = {};
    service.joinByCode('BADCODE1', fail, (m) => (captured.message = m));

    const req = httpMock.expectOne(`${base}/join`);
    expect(req.request.body).toEqual({ inviteCode: 'BADCODE1' });
    req.flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

    expect(captured.message).toContain("doesn't match a challenge");
  });

  it('clear() wipes local join state so progress() returns null again', () => {
    const challenge = makeChallenge();
    service.create('30-Day Reset', undefined, 'meals-in-period', 10, 14, () => {}, fail);
    httpMock.expectOne(base).flush(challenge);
    httpMock.expectOne(`${base}/mine`).flush([challenge]);

    expect(service.progress(challenge)).not.toBeNull();

    service.clear();

    expect(service.list()).toEqual([]);
    expect(service.progress(challenge)).toBeNull();
  });
});
