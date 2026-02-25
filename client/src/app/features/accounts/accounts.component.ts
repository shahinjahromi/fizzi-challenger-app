import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkspacesService } from '../../core/api/workspaces.service';
import { AccountsService, Account } from '../../core/api/accounts.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-900">Accounts</h2>

      @if (error) {
        <p class="text-sm text-red-600">{{ error }}</p>
      }

      @if (loading) {
        <p class="text-sm text-gray-500">Loading…</p>
      } @else if (accounts.length === 0) {
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p class="text-sm text-gray-500">No accounts in this workspace.</p>
        </div>
      } @else {
        <div class="grid gap-4">
          @for (account of accounts; track account.id) {
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="p-6">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">{{ account.name }}</h3>
                    <p class="text-sm text-gray-500 mt-0.5">{{ accountTypeLabel(account.type) }}</p>
                  </div>
                  <a
                    [routerLink]="['/accounts', account.id]"
                    class="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    View details →
                  </a>
                </div>

                <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Available balance</p>
                    <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ formatCents(account.availableCents) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Current balance</p>
                    <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ formatCents(account.currentCents) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Account number</p>
                    <p class="text-sm font-mono text-gray-900 mt-0.5">{{ maskAccountNumber(account.accountNumber) }}</p>
                    <button
                      type="button"
                      (click)="copyToClipboard(account.accountNumber, 'Account number')"
                      class="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                    >
                      Copy full number
                    </button>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Routing number</p>
                    <p class="text-sm font-mono text-gray-900 mt-0.5">{{ account.routingNumber }}</p>
                  </div>
                </div>

                @if (account.interestRate > 0) {
                  <p class="text-sm text-gray-500 mt-3">APY {{ (account.interestRate * 100).toFixed(2) }}%</p>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AccountsComponent implements OnInit {
  private workspaces = inject(WorkspacesService);
  private accountsApi = inject(AccountsService);

  loading = true;
  error: string | null = null;
  accounts: Account[] = [];

  accountTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      CHECKING: 'Checking',
      SAVINGS: 'Savings',
      MONEY_MARKET: 'Money Market',
    };
    return labels[type] ?? type;
  }

  formatCents(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }

  maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) return '••••';
    return '••••' + accountNumber.slice(-4);
  }

  copyToClipboard(value: string, label: string): void {
    navigator.clipboard.writeText(value).then(
      () => {
        // Could show a small toast
      },
      () => {},
    );
  }

  ngOnInit(): void {
    this.workspaces.getMyWorkspaces().subscribe({
      next: (workspaces) => {
        if (workspaces.length === 0) {
          this.loading = false;
          this.error = 'No workspace found.';
          return;
        }
        const workspaceId = workspaces[0].id;
        this.accountsApi.getWorkspaceAccounts(workspaceId).subscribe({
          next: (accounts) => {
            this.accounts = accounts;
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            this.error = err?.error?.message ?? 'Failed to load accounts.';
          },
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Failed to load workspaces.';
      },
    });
  }
}
