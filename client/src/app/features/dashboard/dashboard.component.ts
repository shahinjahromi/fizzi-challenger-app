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
        <div class="summary-current">
          Total Current Balance: {{ totalCurrent | currency:'USD' }}
        </div>
      </div>

      <!-- Quick actions grid -->
      <div class="quick-actions-grid">
        <button class="qa-card" type="button" routerLink="/move-money" aria-label="Move Money">
          <span class="qa-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M3 9H15M15 9L11 5M15 9L11 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span class="qa-label">Move Money</span>
        </button>
        <button class="qa-card" type="button" routerLink="/statements" aria-label="Statements">
          <span class="qa-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><rect x="3" y="1" width="12" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 6H12M6 9H12M6 12H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <span class="qa-label">Statements</span>
        </button>
        <button class="qa-card" type="button" routerLink="/move-money" aria-label="Linked Accounts">
          <span class="qa-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 12L12 8M10 4H6a4 4 0 000 8h2M10 16h4a4 4 0 000-8h-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <span class="qa-label">Linked Accounts</span>
        </button>
        <button class="qa-card" type="button" routerLink="/messages" aria-label="Support">
          <span class="qa-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10a6 6 0 0112 0" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="10" width="4" height="6" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="10" width="4" height="6" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>
          </span>
          <span class="qa-label">Support</span>
        </button>
      </div>

      <!-- Accounts -->
      <div class="card mt-24">
        <div class="accounts-header">
          <h2 class="section-title">Your Accounts</h2>
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
                *ngFor="let acc of displayedAccounts; let odd = odd"
                class="account-row"
                [class.row-alt]="odd"
                [routerLink]="['/accounts', acc.id]"
                tabindex="0"
                (keydown.enter)="navigate(acc.id)"
                role="link"
                [attr.aria-label]="acc.name + ' – ' + (acc.availableBalance | currency:'USD') + ' available'"
              >
                <td>
                  <div class="acc-name-row">
                    <span class="acc-name">{{ acc.name }}</span>
                  <span *ngIf="!acc.isMoveMoneyEligible" class="ineligible-indicator" title="Not eligible for money movement" aria-label="Not eligible for money movement">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  </span>
                  </div>
                  <div class="acc-last4">••••{{ acc.last4 }}</div>
                </td>
                <td>{{ acc.type }}</td>
                <td>
                  <span class="badge" [ngClass]="statusBadge(acc.status)">{{ acc.status }}</span>
                </td>
                <td class="text-right fw-600">{{ acc.availableBalance | currency:'USD' }}</td>
                <td class="text-right acc-current">{{ acc.currentBalance | currency:'USD' }}</td>
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
    .loading-center { display: flex; justify-content: center; padding: 60px; }

    /* Summary card */
    .summary-card {
      margin-bottom: 0;
      border-left: 4px solid #003087;
    }
    .summary-label {
      font-size: 11px; color: #5a6a7e;
      text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px;
    }
    .summary-amount { font-size: 32px; font-weight: 700; color: #003087; margin: 0 0 6px; }
    .summary-current { font-size: 13px; color: #5a6a7e; }

    /* Quick actions grid */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 16px;
    }
    .qa-card {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px;
      width: 100%; aspect-ratio: 1;
      max-height: 80px;
      background: #fff; border: 1px solid #dde3ed;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: border-color 150ms ease, box-shadow 150ms ease;
      padding: 12px 8px;
    }
    .qa-card:hover {
      border-color: #003087;
      box-shadow: var(--shadow-md);
    }
    .qa-icon {
      display: flex; align-items: center; justify-content: center;
      color: #003087;
    }
    .qa-label { font-size: 12px; font-weight: 500; color: #0d1b2a; text-align: center; }

    .mt-24 { margin-top: 24px; }
    .accounts-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .section-title { font-size: 16px; font-weight: 600; margin: 0; }

    /* Account table overrides */
    .table th {
      font-size: 11px; text-transform: uppercase; letter-spacing: .05em;
      font-weight: 600; color: #5a6a7e;
    }
    .account-row { cursor: pointer; }
    .row-alt td { background: #f5f7fa; }
    .acc-name-row { display: flex; align-items: center; gap: 6px; }
    .acc-name { font-weight: 600; }
    .acc-last4 { font-size: 13px; color: #5a6a7e; font-family: ui-monospace, monospace; }
    .acc-current { color: #5a6a7e; }
    .ineligible-indicator { font-size: 13px; color: #b45309; }
    .account-row:hover .row-chevron { opacity: 1; }
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
