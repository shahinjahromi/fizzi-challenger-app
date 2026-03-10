import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe, CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { AccountService } from '../../core/services/account.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { AuthService } from '../../core/services/auth.service';
import { Account } from '../../shared/models/account.model';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'szb-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, AsyncPipe, CurrencyPipe, DatePipe, RouterLink],
  template: `
    <div class="page-header">
      <div class="welcome-row">
        <div>
          <h1 class="page-title">Welcome back, {{ (currentUser$ | async)?.username }}</h1>
          <p class="page-subtitle" *ngIf="lastLogin">
            Last login: {{ lastLogin | date:'medium' }}
          </p>
        </div>
        <div class="quick-actions">
          <button class="btn btn-primary btn-sm" routerLink="/move-money">Move Money</button>
          <button class="btn btn-secondary btn-sm" routerLink="/statements">Statements</button>
          <button class="btn btn-ghost btn-sm" routerLink="/messages">Support</button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-center" *ngIf="loading" aria-busy="true">
      <span class="spinner spinner-lg" aria-hidden="true"></span>
    </div>

    <!-- Error -->
    <div class="alert alert-error" *ngIf="error" role="alert">
      <span>⚠</span> {{ error }}
    </div>

    <ng-container *ngIf="!loading && !error">
      <!-- Summary card -->
      <div class="card summary-card">
        <div class="summary-label">Total Available Balance</div>
        <div class="summary-amount">{{ totalAvailable | currency:'USD' }}</div>
        <div class="summary-current text-muted text-small">
          Total Current: {{ totalCurrent | currency:'USD' }}
        </div>
      </div>

      <!-- Accounts -->
      <div class="card mt-24">
        <div class="accounts-header">
          <h2 class="section-title">Accounts</h2>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            (click)="showClosed = !showClosed"
          >
            {{ showClosed ? 'Hide Closed' : 'Show Closed' }}
          </button>
        </div>

        <div class="table-wrapper">
          <table class="table" aria-label="Account list">
            <thead>
              <tr>
                <th scope="col">Account</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
                <th scope="col" class="text-right">Available</th>
                <th scope="col" class="text-right">Current</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let acc of displayedAccounts"
                class="account-row"
                [routerLink]="['/accounts', acc.id]"
                tabindex="0"
                (keydown.enter)="navigate(acc.id)"
                role="link"
                [attr.aria-label]="acc.name + ' – ' + (acc.availableBalance | currency:'USD') + ' available'"
              >
                <td>
                  <div class="acc-name">{{ acc.name }}</div>
                  <div class="acc-last4 text-muted text-small">••••{{ acc.last4 }}</div>
                </td>
                <td>{{ acc.type }}</td>
                <td>
                  <span class="badge" [ngClass]="statusBadge(acc.status)">{{ acc.status }}</span>
                </td>
                <td class="text-right fw-600">{{ acc.availableBalance | currency:'USD' }}</td>
                <td class="text-right text-muted">{{ acc.currentBalance | currency:'USD' }}</td>
              </tr>
              <tr *ngIf="displayedAccounts.length === 0">
                <td colspan="5" class="text-center text-muted" style="padding:32px">
                  No accounts found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .welcome-row {
      display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px;
    }
    .quick-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .summary-card { margin-bottom: 0; }
    .summary-label { font-size: 13px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em; }
    .summary-amount { font-size: 36px; font-weight: 700; color: var(--color-primary); margin: 4px 0; }
    .mt-24 { margin-top: 24px; }
    .accounts-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .section-title { font-size: 16px; font-weight: 600; margin: 0; }
    .account-row { cursor: pointer; }
    .acc-name { font-weight: 500; }
  `],
})
export class DashboardComponent implements OnInit {
  accounts: Account[] = [];
  loading = false;
  error = '';
  showClosed = false;

  currentUser$ = this.auth.currentUser$;
  lastLogin: string | null = null;

  get totalAvailable(): number {
    return this.activeAccounts.reduce((s, a) => s + a.availableBalance, 0);
  }
  get totalCurrent(): number {
    return this.activeAccounts.reduce((s, a) => s + a.currentBalance, 0);
  }
  get activeAccounts(): Account[] {
    return this.accounts.filter((a) => !a.isClosed);
  }
  get displayedAccounts(): Account[] {
    return this.showClosed
      ? this.accounts
      : this.accounts.filter((a) => !a.isClosed);
  }

  constructor(
    private accountSvc: AccountService,
    private ws: WorkspaceService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const wsId = this.ws.currentWorkspaceId;
    if (!wsId) { this.router.navigate(['/workspaces']); return; }

    this.auth.currentUser$.subscribe((user: User | null) => {
      this.lastLogin = user?.lastLoginAt ?? null;
    });

    this.loading = true;
    this.accountSvc.getAccounts(wsId).subscribe({
      next: (res) => { this.accounts = res.data; this.loading = false; },
      error: () => { this.error = 'Failed to load accounts.'; this.loading = false; },
    });
  }

  navigate(id: string): void { this.router.navigate(['/accounts', id]); }

  statusBadge(status: string): string {
    return status === 'Active'  ? 'badge-green'
         : status === 'Frozen'  ? 'badge-yellow'
         : status === 'Closed'  ? 'badge-gray'
         : 'badge-gray';
  }

  // ngClass needs a method returning a string in this case – alias for clarity
  protected ngClass(cls: string): Record<string, boolean> {
    return { [cls]: true };
  }
}
