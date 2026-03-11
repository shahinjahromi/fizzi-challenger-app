import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf, PercentPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AccountService } from '../../../core/services/account.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { Account } from '../../../shared/models/account.model';
import { Transaction, TransactionPage } from '../../../shared/models/transaction.model';

type SortField = 'date' | 'amount';
type SortDir   = 'asc' | 'desc';

@Component({
  selector: 'szb-account-detail',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, CurrencyPipe, DatePipe, PercentPipe, RouterLink, ReactiveFormsModule],
  template: `
    <div class="back-link">
      <a routerLink="/dashboard" class="btn btn-ghost btn-sm">← Back to Dashboard</a>
    </div>

    <!-- Loading -->
    <div class="loading-center" *ngIf="loading" aria-busy="true">
      <span class="spinner spinner-lg" aria-hidden="true"></span>
    </div>

    <div class="alert alert-error" *ngIf="error && !account" role="alert">
      <span>⚠</span> {{ error }}
    </div>

    <ng-container *ngIf="account">
      <!-- Account header -->
      <div class="card account-header-card">
        <div class="account-title-row">
          <div>
            <h1 class="page-title mb-0">{{ account.name }}</h1>
            <span class="badge mt-4" [ngClass]="statusBadge(account.status)">{{ account.status }}</span>
          </div>
          <div class="account-type-badge">{{ account.type }}</div>
        </div>

        <div class="account-details-grid">
          <div class="detail-item">
            <span class="detail-label">Account #</span>
            <span class="detail-value mono">••••{{ account.last4 }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Routing #</span>
            <span class="detail-value mono">••••{{ account.routingLast4 }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Available Balance</span>
            <span class="detail-value balance-avail">{{ account.availableBalance | currency:'USD' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Current Balance</span>
            <span class="detail-value">{{ account.currentBalance | currency:'USD' }}</span>
          </div>
          <div class="detail-item" *ngIf="account.interestRate">
            <span class="detail-label">Interest Rate (APY)</span>
            <span class="detail-value">{{ account.interestRate / 100 | percent:'1.2-2' }}</span>
          </div>
          <div class="detail-item" *ngIf="account.interestEarned">
            <span class="detail-label">Interest Earned</span>
            <span class="detail-value text-success">{{ account.interestEarned | currency:'USD' }}</span>
          </div>
        </div>
      </div>

      <!-- Transactions -->
      <div class="card mt-24">
        <div class="txn-header">
          <h2 class="section-title">Transactions</h2>
          <span class="txn-total text-muted text-small" *ngIf="txnPage">
            {{ txnPage.total }} total
          </span>
        </div>

        <!-- Search + sort controls -->
        <div class="txn-controls">
          <input
            type="search"
            class="form-control search-input"
            placeholder="Search transactions…"
            [formControl]="searchCtrl"
            aria-label="Search transactions"
          />
          <div class="sort-controls">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              (click)="toggleSort('date')"
              [attr.aria-pressed]="sortField === 'date'"
            >
              Date {{ sortField === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              (click)="toggleSort('amount')"
              [attr.aria-pressed]="sortField === 'amount'"
            >
              Amount {{ sortField === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
            </button>
          </div>
        </div>

        <div class="alert alert-error" *ngIf="txnError" role="alert">
          <span>⚠</span> {{ txnError }}
        </div>

        <div class="loading-center" *ngIf="txnLoading" aria-busy="true">
          <span class="spinner" aria-hidden="true"></span>
        </div>

        <div class="table-wrapper" *ngIf="!txnLoading">
          <table class="table" aria-label="Transaction history">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Status</th>
                <th scope="col" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let txn of sortedTransactions">
                <td>{{ (txn.postedAt || txn.createdAt) | date:'MMM d, y' }}</td>
                <td>
                  <div>{{ txn.description || '—' }}</div>
                  <div class="text-small text-muted" *ngIf="txn.counterpart">{{ txn.counterpart }}</div>
                </td>
                <td>
                  <span class="badge" [ngClass]="txnStatusBadge(txn.status)">{{ txn.status }}</span>
                </td>
                <td class="text-right" [ngClass]="txn.direction === 'Credit' ? 'text-success' : ''">
                  <span>{{ txn.direction === 'Credit' ? '+' : '-' }}</span>
                  <span class="fw-600">{{ txn.amount | currency:'USD' }}</span>
                </td>
              </tr>
              <tr *ngIf="sortedTransactions.length === 0 && !txnLoading">
                <td colspan="4" class="text-center text-muted" style="padding:32px">
                  No transactions found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="txnPage">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            [disabled]="!canPrev"
            (click)="prevPage()"
            aria-label="Previous page"
          >
            ← Previous
          </button>
          <span class="page-info text-muted text-small">
            Showing {{ sortedTransactions.length }} of {{ txnPage.total }}
          </span>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            [disabled]="!txnPage.nextCursor"
            (click)="nextPage()"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .back-link { margin-bottom: 16px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .account-header-card { margin-bottom: 0; }
    .account-title-row {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 20px; flex-wrap: wrap; gap: 8px;
    }
    .mt-4 { margin-top: 4px; display: inline-flex; }
    .account-type-badge {
      font-size: 13px; font-weight: 500; color: var(--color-text-muted);
      background: var(--color-bg); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: 4px 12px; align-self: flex-start;
    }
    .account-details-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;
    }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-label { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .04em; }
    .detail-value { font-size: 16px; font-weight: 600; }
    .mono { font-family: monospace; letter-spacing: .05em; }
    .balance-avail { color: var(--color-primary); font-size: 20px; }
    .mt-24 { margin-top: 24px; }
    .txn-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .section-title { font-size: 16px; font-weight: 600; margin: 0; }
    .txn-controls {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 16px; flex-wrap: wrap;
    }
    .search-input { max-width: 280px; }
    .sort-controls { display: flex; gap: 8px; }
    .pagination {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 16px; border-top: 1px solid var(--color-border); margin-top: 8px;
      flex-wrap: wrap; gap: 8px;
    }
    .page-info { font-size: 13px; }

    @media (max-width: 480px) {
      .account-details-grid { grid-template-columns: 1fr 1fr; }
      .txn-controls { flex-direction: column; align-items: stretch; }
      .search-input { max-width: 100%; }
      .sort-controls { flex-wrap: wrap; }
    }
  `],
})
export class AccountDetailComponent implements OnInit {
  account: Account | null = null;
  loading = false;
  error = '';

  transactions: Transaction[] = [];
  txnPage: TransactionPage | null = null;
  txnLoading = false;
  txnError = '';

  searchCtrl = new FormControl('');
  sortField: SortField = 'date';
  sortDir: SortDir = 'desc';

  private cursorStack: (string | null)[] = [null];
  private currentCursorIdx = 0;

  get canPrev(): boolean { return this.currentCursorIdx > 0; }

  get sortedTransactions(): Transaction[] {
    return [...this.transactions].sort((a, b) => {
      let cmp = 0;
      if (this.sortField === 'date') {
        cmp = new Date(a.postedAt ?? a.createdAt).getTime()
            - new Date(b.postedAt ?? b.createdAt).getTime();
      } else {
        cmp = a.amount - b.amount;
      }
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  constructor(
    private route: ActivatedRoute,
    private accountSvc: AccountService,
    private txnSvc: TransactionService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loading = true;
    this.accountSvc.getAccount(id).subscribe({
      next: (acc) => { this.account = acc; this.loading = false; this.loadTransactions(); },
      error: () => { this.error = 'Failed to load account.'; this.loading = false; },
    });

    this.searchCtrl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap((q) => {
        this.cursorStack = [null]; this.currentCursorIdx = 0;
        return of(q);
      })
    ).subscribe(() => this.loadTransactions());
  }

  loadTransactions(): void {
    if (!this.account) return;
    this.txnLoading = true;
    this.txnError = '';
    const cursor = this.cursorStack[this.currentCursorIdx] ?? undefined;
    const search = this.searchCtrl.value ?? undefined;
    this.txnSvc.getTransactions(this.account.id, { cursor, limit: 20, search }).subscribe({
      next: (page) => {
        this.txnPage = page;
        this.transactions = page.data;
        this.txnLoading = false;
      },
      error: () => { this.txnError = 'Failed to load transactions.'; this.txnLoading = false; },
    });
  }

  nextPage(): void {
    if (!this.txnPage?.nextCursor) return;
    this.currentCursorIdx++;
    if (this.currentCursorIdx >= this.cursorStack.length) {
      this.cursorStack.push(this.txnPage.nextCursor);
    }
    this.loadTransactions();
  }

  prevPage(): void {
    if (!this.canPrev) return;
    this.currentCursorIdx--;
    this.loadTransactions();
  }

  toggleSort(field: SortField): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'desc';
    }
  }

  statusBadge(status: string): string {
    return status === 'Active'  ? 'badge-green'
         : status === 'Frozen'  ? 'badge-yellow'
         : status === 'Closed'  ? 'badge-gray'
         : 'badge-gray';
  }

  txnStatusBadge(status: string): string {
    return status === 'Posted'    ? 'badge-green'
         : status === 'Pending'   ? 'badge-yellow'
         : status === 'Returned'  ? 'badge-red'
         : status === 'Cancelled' ? 'badge-gray'
         : 'badge-gray';
  }
}
