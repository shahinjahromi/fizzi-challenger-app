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
    styles: [
      `.welcome-row { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 24px; }
      .page-title { font-size: 36px; font-weight: 700; color: var(--color-primary); margin: 0 0 12px 0; }
      .page-subtitle { font-size: 16px; color: var(--color-text-muted); margin-bottom: 24px; }
      .loading-center { display: flex; justify-content: center; padding: 60px; }
      .summary-card { background: var(--color-white); border-radius: var(--radius-lg); box-shadow: none; border: 1px solid var(--color-border); padding: 32px 24px; margin-bottom: 32px; }
      .summary-label { font-size: 13px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px; font-weight: 500; }
      .summary-amount { font-size: 40px; font-weight: 700; color: var(--color-primary); margin: 0 0 8px; }
      .summary-current { font-size: 15px; color: var(--color-text-muted); }
      .quick-actions-grid { display: flex; gap: 24px; margin-top: 32px; }
      .qa-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; min-width: 220px; min-height: 100px; background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-lg); cursor: pointer; transition: border-color 150ms ease; padding: 24px 16px; box-shadow: none; }
      .qa-card:hover { border-color: var(--color-primary); }
      .qa-icon { display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-size: 24px; }
      .qa-label { font-size: 16px; font-weight: 500; color: var(--color-primary); text-align: center; }
      .mt-24 { margin-top: 32px; }
      .accounts-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
      .section-title { font-size: 20px; font-weight: 700; margin: 0; color: var(--color-text); }
      .table-wrapper { overflow-x: auto; }
      .table { width: 100%; border-collapse: collapse; font-size: 16px; background: var(--color-white); }
      .table th { padding: 12px 16px; font-size: 13px; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; color: var(--color-text-muted); background: var(--color-bg); }
      .table td { padding: 12px 16px; font-size: 16px; color: var(--color-text); }
      .account-row { cursor: pointer; border-bottom: 1px solid var(--color-border); }
      .row-alt td { background: var(--color-bg); }
      .acc-name-row { display: flex; align-items: center; gap: 6px; }
      .acc-name { font-weight: 700; font-size: 16px; color: var(--color-text); }
      .acc-last4 { font-size: 14px; color: var(--color-text-muted); font-family: ui-monospace, monospace; }
      .acc-current { color: var(--color-text-muted); }
      .ineligible-indicator { font-size: 14px; color: var(--color-warning); }
      .account-row:hover { background: var(--color-primary-light); }
      .badge { background: var(--color-primary-light); color: var(--color-primary); font-weight: 600; border-radius: 999px; padding: 4px 12px; font-size: 14px; }
      .text-right { text-align: right; }
      .fw-600 { font-weight: 600; }
      .text-center { text-align: center; }
      .text-muted { color: var(--color-text-muted); }
      @media (max-width: 1024px) { .quick-actions-grid { flex-direction: column; gap: 16px; } .qa-card { min-width: 100%; } }
      @media (max-width: 767px) { .summary-card { padding: 16px 8px; } .quick-actions-grid { flex-direction: column; gap: 12px; } .qa-card { min-width: 100%; padding: 12px 8px; } .section-title { font-size: 16px; } .table th, .table td { font-size: 14px; padding: 8px; } }
      @media (max-width: 480px) { .summary-amount { font-size: 28px; } .qa-label { font-size: 14px; } }
    ],
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

    /* Responsive */
    @media (max-width: 767px) {
      .quick-actions-grid { grid-template-columns: repeat(2, 1fr); }
      .summary-amount { font-size: 26px; }
    }
    @media (max-width: 480px) {
      .quick-actions-grid { gap: 8px; }
      .qa-card { max-height: 72px; padding: 8px; }
    }
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
