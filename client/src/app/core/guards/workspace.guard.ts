import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { WorkspaceService } from '../services/workspace.service';

export const workspaceGuard: CanActivateFn = () => {
  const ws = inject(WorkspaceService);
  const router = inject(Router);

  if (ws.currentWorkspace$.value !== null) {
    return true;
  }
  return router.createUrlTree(['/workspaces']);
};
