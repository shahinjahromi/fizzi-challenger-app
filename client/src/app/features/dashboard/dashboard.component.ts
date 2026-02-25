import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspacesService } from '../../core/api/workspaces.service';
import { AccountsService, Account } from '../../core/api/accounts.service';
import { TransactionsService, Transaction } from '../../core/api/transactions.service';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-900">Dashboard</h2>

      @if (error) {
        <p class="text-sm text-red-600">{{ error }}</p>
      }

      @if (loading) {
        <p class="text-sm text-gray-500">Loading…</p>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p class="text-sm text-gray-500">Total Available</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ totalAvailableFormatted }}</p>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p class="text-sm text-gray-500">Total Current</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ totalCurrentFormatted }}</p>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p class="text-sm text-gray-500">Open Accounts</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ accounts.length }}</p>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p class="text-sm font-medium text-gray-700 mb-3">Recent Transactions</p>
          @if (recentTransactions.length === 0) {
            <p class="text-sm text-gray-400">No recent transactions.</p>
          } @else {
            <ul class="divide-y divide-gray-100">
              @for (tx of recentTransactions; track tx.id) {
                <li class="py-3 flex items-center justify-between gap-4">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ tx.description || 'Transaction' }}</p>
                    <p class="text-xs text-gray-500">{{ tx.accountName }} · {{ (tx.postedAt || tx.createdAt) | date:'short' }}</p>
                  </div>
                  <span class="text-sm font-medium shrink-0" [class.text-green-600]="tx.direction === 'CREDIT'" [class.text-red-600]="tx.direction === 'DEBIT'">
                    {{ tx.direction === 'CREDIT' ? '+' : '-' }}{{ formatCents(tx.amountCents) }}
                  </span>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private workspaces = inject(WorkspacesService);
  private accountsApi = inject(AccountsService);
  private transactionsApi = inject(TransactionsService);

  loading = true;
  error: string | null = null;
  accounts: Account[] = [];
  recentTransactions: (Transaction & { accountName: string })[] = [];

  get totalAvailableFormatted(): string {
    const total = this.accounts.reduce((s, a) => s + a.availableCents, 0);
    return this.formatCents(total);
  }

  get totalCurrentFormatted(): string {
    const total = this.accounts.reduce((s, a) => s + a.currentCents, 0);
    return this.formatCents(total);
  }

  formatCents(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
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
            this.loadRecentTransactions();
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            this.error = err?.error?.message || 'Failed to load accounts.';
          },
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load workspaces.';
      },
    });
  }

  private loadRecentTransactions(): void {
    if (this.accounts.length === 0) {
      this.recentTransactions = [];
      return;
    }
    const accountIds = this.accounts.map((a) => a.id);
    const byId = new Map(this.accounts.map((a) => [a.id, a]));

    forkJoin(
      accountIds.map((id) =>
        this.transactionsApi.getAccountTransactions(id, { limit: 8 }).pipe(map((page) => page.items)),
      ),
    ).subscribe({
      next: (pages) => {
        const all: (Transaction & { accountName: string })[] = [];
        pages.forEach((items, i) => {
          const account = byId.get(accountIds[i]);
          const name = account?.name ?? 'Account';
          items.forEach((tx) => all.push({ ...tx, accountName: name }));
        });
        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.recentTransactions = all.slice(0, 15);
      },
    });
  }
}
