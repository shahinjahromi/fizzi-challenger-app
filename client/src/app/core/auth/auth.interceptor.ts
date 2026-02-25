import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, throwError, switchMap, filter, take, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

let isRefreshing = false;
const refreshToken$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);

  const addToken = (r: HttpRequest<unknown>, token: string) =>
    r.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  const token = authService.getAccessToken();
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint =
        req.url.includes('/auth/refresh') || req.url.includes('/auth/login');

      if (err.status !== 401 || isAuthEndpoint) {
        return throwError(() => err);
      }

      if (isRefreshing) {
        return refreshToken$.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap((t) => next(addToken(req, t))),
        );
      }

      isRefreshing = true;
      refreshToken$.next(null);

      const http = inject(HttpClient);
      return http.post<{ accessToken: string }>('/api/auth/refresh', {}, { withCredentials: true }).pipe(
        switchMap((res) => {
          isRefreshing = false;
          authService.onTokenRefreshed(res.accessToken);
          refreshToken$.next(res.accessToken);
          return next(addToken(req, res.accessToken));
        }),
        catchError((refreshErr) => {
          isRefreshing = false;
          authService.onRefreshFailed();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
