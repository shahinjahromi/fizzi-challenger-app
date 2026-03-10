import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginResponse, RefreshResponse } from '../../shared/models/user.model';

const REFRESH_TOKEN_KEY = 'szb_refresh_token';
const API = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _accessToken: string | null = null;
  readonly currentUser$ = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  get accessToken(): string | null {
    return this._accessToken;
  }

  isAuthenticated(): boolean {
    return this._accessToken !== null;
  }

  login(usernameOrEmail: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API}/auth/login`, { usernameOrEmail, password })
      .pipe(
        tap((res) => {
          this._accessToken = res.accessToken;
          localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
          this.currentUser$.next(res.user);
        })
      );
  }

  logout(): void {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken && this._accessToken) {
      this.http
        .post(`${API}/auth/logout`, { refreshToken })
        .pipe(catchError(() => throwError(() => null)))
        .subscribe({ complete: () => this._clearSession() });
    } else {
      this._clearSession();
    }
  }

  refreshToken(): Observable<RefreshResponse> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      this._clearSession();
      return throwError(() => new Error('No refresh token'));
    }
    return this.http
      .post<RefreshResponse>(`${API}/auth/refresh`, { refreshToken })
      .pipe(
        tap((res) => {
          this._accessToken = res.accessToken;
          localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
        }),
        catchError((err) => {
          this._clearSession();
          return throwError(() => err);
        })
      );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API}/auth/forgot-password`, { email });
  }

  forgotUsername(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API}/auth/forgot-username`, { email });
  }

  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(`${API}/auth/me`).pipe(
      tap((user) => this.currentUser$.next(user))
    );
  }

  tryRestoreSession(): boolean {
    return !!localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private _clearSession(): void {
    this._accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }
}
