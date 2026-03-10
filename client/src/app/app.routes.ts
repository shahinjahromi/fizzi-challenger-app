import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { workspaceGuard } from './core/guards/workspace.guard';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'workspaces',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './features/workspaces/workspace-selector/workspace-selector.component'
      ).then((m) => m.WorkspaceSelectorComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, workspaceGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'accounts/:id',
    canActivate: [authGuard, workspaceGuard],
    loadComponent: () =>
      import(
        './features/accounts/account-detail/account-detail.component'
      ).then((m) => m.AccountDetailComponent),
  },
  {
    path: 'move-money',
    canActivate: [authGuard, workspaceGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/transfers/move-money-hub/move-money-hub.component'
          ).then((m) => m.MoveMoneyHubComponent),
      },
      {
        path: 'internal',
        loadComponent: () =>
          import(
            './features/transfers/internal-transfer/internal-transfer.component'
          ).then((m) => m.InternalTransferComponent),
      },
    ],
  },
  {
    path: 'statements',
    canActivate: [authGuard, workspaceGuard],
    loadComponent: () =>
      import('./features/statements/statements.component').then(
        (m) => m.StatementsComponent
      ),
  },
  {
    path: 'messages',
    canActivate: [authGuard, workspaceGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/messaging/inbox/inbox.component').then(
            (m) => m.InboxComponent
          ),
      },
      {
        path: ':threadId',
        loadComponent: () =>
          import('./features/messaging/thread/thread.component').then(
            (m) => m.ThreadComponent
          ),
      },
    ],
  },
  {
    path: 'profile',
    canActivate: [authGuard, workspaceGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
  },
  {
    path: 'security',
    canActivate: [authGuard, workspaceGuard],
    loadComponent: () =>
      import('./features/security/security-center.component').then(
        (m) => m.SecurityCenterComponent
      ),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
