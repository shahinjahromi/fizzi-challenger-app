import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import('./features/accounts/accounts.component').then((m) => m.AccountsComponent),
      },
      {
        path: 'accounts/:id',
        loadComponent: () =>
          import('./features/accounts/account-detail/account-detail.component').then(
            (m) => m.AccountDetailComponent,
          ),
      },
      {
        path: 'transfers',
        loadComponent: () =>
          import('./features/transfers/transfers.component').then((m) => m.TransfersComponent),
      },
      {
        path: 'statements',
        loadComponent: () =>
          import('./features/statements/statements.component').then((m) => m.StatementsComponent),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/messages/messages.component').then((m) => m.MessagesComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
