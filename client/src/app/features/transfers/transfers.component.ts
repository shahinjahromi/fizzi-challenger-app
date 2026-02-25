import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspacesService } from '../../core/api/workspaces.service';
import { AccountsService, Account } from '../../core/api/accounts.service';
import { TransfersService } from '../../core/api/transfers.service';
import { ExternalAccountsService, ExternalAccount } from '../../core/api/external-accounts.service';

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <h2 class="text-2xl font-semibold text-gray-900">Transfers</h2>

      @if (workspaceError) {
        <p class="text-sm text-red-600">{{ workspaceError }}</p>
      }

      <!-- Internal: between your Sixert accounts -->
      <section class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-1">Internal transfer</h3>
        <p class="text-sm text-gray-500 mb-4">Move money between your Sixert accounts.</p>

        <form (ngSubmit)="submitInternal()" class="space-y-4 max-w-md">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">From account</label>
            <select
              [(ngModel)]="internal.fromAccountId"
              name="fromAccount"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Select account</option>
              @for (a of accounts; track a.id) {
                <option [value]="a.id">{{ a.name }} ({{ formatCents(a.availableCents) }})</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">To account</label>
            <select
              [(ngModel)]="internal.toAccountId"
              name="toAccount"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Select account</option>
              @for (a of accounts; track a.id) {
                <option [value]="a.id">{{ a.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
            <input
              type="number"
              [(ngModel)]="internal.amountDollars"
              name="amount"
              min="0.01"
              step="0.01"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Memo (optional)</label>
            <input
              type="text"
              [(ngModel)]="internal.description"
              name="description"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. Operating reserve"
            />
          </div>
          @if (internalError) {
            <p class="text-sm text-red-600">{{ internalError }}</p>
          }
          @if (internalSuccess) {
            <p class="text-sm text-green-600">{{ internalSuccess }}</p>
          }
          <button
            type="submit"
            [disabled]="internalSubmitting || accounts.length < 2"
            class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ internalSubmitting ? 'Transferring…' : 'Transfer' }}
          </button>
        </form>
      </section>

      <!-- External: to an external bank account (ACH / Stripe) -->
      <section class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-1">Transfer to external bank</h3>
        <p class="text-sm text-gray-500 mb-4">
          Send money to or from a linked external bank account. External connectivity uses Stripe (sandbox); add your Stripe details in server .env when ready.
        </p>

        @if (externalAccounts.length === 0 && !loadingExternal) {
          <p class="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            No external accounts linked yet. Link an external account (e.g. via Stripe) to enable transfers.
          </p>
        } @else {
          <form (ngSubmit)="submitExternal()" class="space-y-4 max-w-md">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sixert account</label>
              <select
                [(ngModel)]="external.accountId"
                name="account"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Select account</option>
                @for (a of accounts; track a.id) {
                  <option [value]="a.id">{{ a.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Direction</label>
              <select
                [(ngModel)]="external.direction"
                name="direction"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="DEBIT">From Sixert → To external bank</option>
                <option value="CREDIT">From external bank → To Sixert</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">External account</label>
              <select
                [(ngModel)]="external.externalAccountId"
                name="externalAccount"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Select external account</option>
                @for (ext of externalAccounts; track ext.id) {
                  <option [value]="ext.id">{{ ext.nickname || ext.maskedNumber }} {{ ext.isVerified ? '' : '(unverified)' }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
              <input
                type="number"
                [(ngModel)]="external.amountDollars"
                name="amount"
                min="0.01"
                step="0.01"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="0.00"
                required
              />
            </div>
            @if (externalError) {
              <p class="text-sm text-red-600">{{ externalError }}</p>
            }
            @if (externalSuccess) {
              <p class="text-sm text-green-600">{{ externalSuccess }}</p>
            }
            <button
              type="submit"
              [disabled]="externalSubmitting || externalAccounts.length === 0"
              class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ externalSubmitting ? 'Submitting…' : 'Submit transfer' }}
            </button>
          </form>
        }
      </section>
    </div>
  `,
})
export class TransfersComponent implements OnInit {
  private workspaces = inject(WorkspacesService);
  private accountsApi = inject(AccountsService);
  private transfersApi = inject(TransfersService);
  private externalAccountsApi = inject(ExternalAccountsService);

  workspaceId: string | null = null;
  workspaceError: string | null = null;
  accounts: Account[] = [];
  externalAccounts: ExternalAccount[] = [];
  loadingExternal = false;

  internal = {
    fromAccountId: '',
    toAccountId: '',
    amountDollars: 0 as number | null,
    description: '',
  };
  internalSubmitting = false;
  internalError: string | null = null;
  internalSuccess: string | null = null;

  external = {
    accountId: '',
    externalAccountId: '',
    direction: 'DEBIT' as 'CREDIT' | 'DEBIT',
    amountDollars: 0 as number | null,
  };
  externalSubmitting = false;
  externalError: string | null = null;
  externalSuccess: string | null = null;

  formatCents(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }

  ngOnInit(): void {
    this.workspaces.getMyWorkspaces().subscribe({
      next: (workspaces) => {
        if (workspaces.length === 0) {
          this.workspaceError = 'No workspace found.';
          return;
        }
        this.workspaceId = workspaces[0].id;
        this.accountsApi.getWorkspaceAccounts(workspaces[0].id).subscribe({
          next: (acc) => (this.accounts = acc),
          error: () => (this.accounts = []),
        });
        this.loadingExternal = true;
        this.externalAccountsApi.list(workspaces[0].id).subscribe({
          next: (ext) => (this.externalAccounts = ext),
          error: () => (this.externalAccounts = []),
          complete: () => (this.loadingExternal = false),
        });
      },
      error: (err) => (this.workspaceError = err?.error?.message ?? 'Failed to load workspaces.'),
    });
  }

  submitInternal(): void {
    this.internalError = null;
    this.internalSuccess = null;
    const amountCents = this.internal.amountDollars != null ? Math.round(this.internal.amountDollars * 100) : 0;
    if (amountCents <= 0 || !this.internal.fromAccountId || !this.internal.toAccountId) {
      this.internalError = 'Please select from, to, and a positive amount.';
      return;
    }
    this.internalSubmitting = true;
    this.transfersApi
      .initiateInternal({
        fromAccountId: this.internal.fromAccountId,
        toAccountId: this.internal.toAccountId,
        amountCents,
        description: this.internal.description || undefined,
      })
      .subscribe({
        next: () => {
          this.internalSuccess = 'Transfer completed.';
          this.internal.amountDollars = null;
          this.internal.description = '';
          this.internalSubmitting = false;
          this.accountsApi.getWorkspaceAccounts(this.workspaceId!).subscribe((acc) => (this.accounts = acc));
        },
        error: (err) => {
          this.internalError = err?.error?.message ?? 'Transfer failed.';
          this.internalSubmitting = false;
        },
      });
  }

  submitExternal(): void {
    this.externalError = null;
    this.externalSuccess = null;
    const amountCents = this.external.amountDollars != null ? Math.round(this.external.amountDollars * 100) : 0;
    if (amountCents <= 0 || !this.external.accountId || !this.external.externalAccountId) {
      this.externalError = 'Please select account, external account, and a positive amount.';
      return;
    }
    this.externalSubmitting = true;
    this.transfersApi
      .initiateAch({
        accountId: this.external.accountId,
        externalAccountId: this.external.externalAccountId,
        direction: this.external.direction,
        amountCents,
      })
      .subscribe({
        next: (res) => {
          this.externalSuccess = res.note ?? 'Transfer submitted.';
          this.external.amountDollars = null;
          this.externalSubmitting = false;
          this.accountsApi.getWorkspaceAccounts(this.workspaceId!).subscribe((acc) => (this.accounts = acc));
        },
        error: (err) => {
          this.externalError = err?.error?.message ?? 'Transfer failed.';
          this.externalSubmitting = false;
        },
      });
  }
}
