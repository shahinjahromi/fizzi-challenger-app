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
    <div>
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
  `,
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
