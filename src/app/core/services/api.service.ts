import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  name: string;
  emailVerified: boolean;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface RegistrationResponse {
  email: string;
  verificationRequired: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  termsAccepted: boolean;
}

/** The account endpoints. Health records never go through here: they stay on the device. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiBaseUrl;

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, { email, password });
  }

  /** Creates an unverified account and emails a verification link. No session yet. */
  register(req: RegisterRequest) {
    return this.http.post<RegistrationResponse>(`${this.API_URL}/auth/register`, req);
  }

  /** The emailed link proves the address and signs the person in. */
  verifyEmail(token: string) {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/verify-email`, { token });
  }

  /** Always accepted, whether or not an account exists. */
  resendVerification(email: string) {
    return this.http.post<void>(`${this.API_URL}/auth/verification/resend`, { email });
  }

  /** Always accepted, whether or not an account exists. */
  requestPasswordReset(email: string) {
    return this.http.post<void>(`${this.API_URL}/auth/password-reset/request`, { email });
  }

  confirmPasswordReset(token: string, password: string) {
    return this.http.post<void>(`${this.API_URL}/auth/password-reset/confirm`, { token, password });
  }

  refresh(refreshToken: string) {
    return this.http.post<TokenPair>(`${this.API_URL}/auth/refresh`, { refreshToken });
  }

  deleteAccount() {
    return this.http.delete<void>(`${this.API_URL}/auth/me`);
  }
  currentUser() {
    return this.http.get<UserResponse>(`${this.API_URL}/auth/me`);
  }
}
