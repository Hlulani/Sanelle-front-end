import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MealResponse } from '../models/meal.model';

export interface UserResponse {
  id: string;
  email: string;
  username: string;
}
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export type RegisterResponse = LoginResponse;
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface CustomChallengeResponse {
  id: string;
  name: string;
  description: string | null;
  type: 'meals-in-period' | 'days-in-period' | 'streak';
  targetCount: number;
  durationDays: number;
  inviteCode: string;
  createdByUserId: string;
  createdByUsername: string | null;
  createdAt: string;
  isCreator: boolean;
}

export interface ChallengeMemberResponse {
  userId: string;
  username: string;
  joinedAt: string;
}

export interface CreateCustomChallengeRequest {
  name: string;
  description?: string;
  type: 'meals-in-period' | 'days-in-period' | 'streak';
  targetCount: number;
  durationDays: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiBaseUrl;

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, {
      email,
      password,
    });
  }

  register(email: string, username: string, password: string) {
    return this.http.post<RegisterResponse>(`${this.API_URL}/auth/register`, { email, username, password });
  }

  getRecommended() {
    return this.http.get<MealResponse[]>(`${this.API_URL}/meals`);
  }

  refresh(refreshToken: string) {
    return this.http.post<TokenPair>(`${this.API_URL}/auth/refresh`, { refreshToken });
  }

  deleteAccount() {
    return this.http.delete<void>(`${this.API_URL}/auth/me`);
  }

  joinChallenge(challengeId: string) {
    return this.http.post<void>(`${this.API_URL}/challenges/${encodeURIComponent(challengeId)}/join`, {});
  }

  leaveChallenge(challengeId: string) {
    return this.http.delete<void>(`${this.API_URL}/challenges/${encodeURIComponent(challengeId)}/join`);
  }

  getChallengeCounts(challengeIds: string[]) {
    const params = new HttpParams().set('ids', challengeIds.join(','));
    return this.http.get<Record<string, number>>(`${this.API_URL}/challenges/counts`, { params });
  }

  createCustomChallenge(req: CreateCustomChallengeRequest) {
    return this.http.post<CustomChallengeResponse>(`${this.API_URL}/custom-challenges`, req);
  }

  joinCustomChallengeByCode(inviteCode: string) {
    return this.http.post<CustomChallengeResponse>(`${this.API_URL}/custom-challenges/join`, { inviteCode });
  }

  getMyCustomChallenges() {
    return this.http.get<CustomChallengeResponse[]>(`${this.API_URL}/custom-challenges/mine`);
  }

  getCustomChallengeMembers(challengeId: string) {
    return this.http.get<ChallengeMemberResponse[]>(
      `${this.API_URL}/custom-challenges/${encodeURIComponent(challengeId)}/members`,
    );
  }
}
