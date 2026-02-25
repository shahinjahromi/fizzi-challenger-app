import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;
}

interface TokenResponse {
  accessToken: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _state$ = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
    email: null,
  });

  readonly state$ = this._state$.asObservable();

  private accessToken: string | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async restoreSession(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<TokenResponse>('/api/auth/refresh', {}, { withCredentials: true })
      );
      this.setToken(res.accessToken);
      this.scheduleRefresh();
    } catch {
      this.clearSession();
    }
  }

  async login(identifier: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<TokenResponse>('/api/auth/login', { identifier, password }, { withCredentials: true })
    );
    this.setToken(res.accessToken);
    this.scheduleRefresh();
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post('/api/auth/logout', {}, { withCredentials: true })
      );
    } catch {
      // Ignore errors on logout
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  scheduleRefresh(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(async () => {
      try {
        const res = await firstValueFrom(
          this.http.post<TokenResponse>('/api/auth/refresh', {}, { withCredentials: true })
        );
        this.onTokenRefreshed(res.accessToken);
      } catch {
        this.onRefreshFailed();
      }
    }, 14 * 60 * 1000);
  }

  onTokenRefreshed(token: string): void {
    this.setToken(token);
    this.scheduleRefresh();
  }

  onRefreshFailed(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private setToken(token: string): void {
    this.accessToken = token;
    const payload = this.decodePayload(token);
    this._state$.next({
      isAuthenticated: true,
      isLoading: false,
      userId: payload?.userId ?? null,
      email: payload?.email ?? null,
    });
  }

  private clearSession(): void {
    this.accessToken = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this._state$.next({ isAuthenticated: false, isLoading: false, userId: null, email: null });
  }

  private decodePayload(token: string): { userId: string; email: string } | null {
    try {
      const base64 = token.split('.')[1];
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }
}
