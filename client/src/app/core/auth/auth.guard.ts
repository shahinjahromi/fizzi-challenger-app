import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.state$.pipe(
    filter((s) => !s.isLoading),
    take(1),
    map((s) => s.isAuthenticated || router.createUrlTree(['/login'])),
  );
};
