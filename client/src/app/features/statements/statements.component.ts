import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspacesService } from '../../core/api/workspaces.service';
import { AccountsService, Account } from '../../core/api/accounts.service';
import { StatementsService, Statement } from '../../core/api/statements.service';

@Component({
  selector: 'app-statements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-900">Statements</h2>

      @if (workspaceError) {
        <p class="text-sm text-red-600">{{ workspaceError }}</p>
      }

      @if (accounts.length === 0 && !loading) {
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p class="text-sm text-gray-500">No accounts in this workspace.</p>
        </div>
      } @else {
        <div class="space-y-6">
          @for (account of accounts; track account.id) {
            <section class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100">
                <h3 class="text-lg font-semibold text-gray-900">{{ account.name }}</h3>
                <p class="text-sm text-gray-500">{{ accountTypeLabel(account.type) }}</p>
              </div>
              <div class="p-6">
                @if (loadingStatements[account.id]) {
                  <p class="text-sm text-gray-500">Loading statements…</p>
                } @else if (getStatements(account.id).length === 0) {
                  <p class="text-sm text-gray-500">No statements yet for this account.</p>
                } @else {
                  <ul class="divide-y divide-gray-100">
                    @for (st of getStatements(account.id); track st.id) {
                      <li class="py-3 flex items-center justify-between gap-4">
                        <span class="text-sm font-medium text-gray-900">{{ monthYear(st) }}</span>
                        <button
                          type="button"
                          (click)="downloadStatement(st)"
                          class="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Download PDF
                        </button>
                      </li>
                    }
                  </ul>
                }
              </div>
            </section>
          }
        </div>
      }
    </div>
  `,
})
export class StatementsComponent implements OnInit {
  private workspaces = inject(WorkspacesService);
  private accountsApi = inject(AccountsService);
  private statementsApi = inject(StatementsService);

  workspaceError: string | null = null;
  accounts: Account[] = [];
  loading = true;
  statementsByAccount: Record<string, Statement[]> = {};
  loadingStatements: Record<string, boolean> = {};

  accountTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      CHECKING: 'Checking',
      SAVINGS: 'Savings',
      MONEY_MARKET: 'Money Market',
    };
    return labels[type] ?? type;
  }

  monthYear(st: Statement): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[st.month - 1]} ${st.year}`;
  }

  getStatements(accountId: string): Statement[] {
    return this.statementsByAccount[accountId] ?? [];
  }

  downloadStatement(st: Statement): void {
    this.statementsApi.downloadPdf(st.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statement-${this.monthYear(st).replace(/\s+/g, '-')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  ngOnInit(): void {
    this.workspaces.getMyWorkspaces().subscribe({
      next: (workspaces) => {
        if (workspaces.length === 0) {
          this.loading = false;
          this.workspaceError = 'No workspace found.';
          return;
        }
        this.accountsApi.getWorkspaceAccounts(workspaces[0].id).subscribe({
          next: (acc) => {
            this.accounts = acc;
            this.loading = false;
            acc.forEach((a) => this.loadStatements(a.id));
          },
          error: () => {
            this.loading = false;
            this.workspaceError = 'Failed to load accounts.';
          },
        });
      },
      error: (err) => {
        this.loading = false;
        this.workspaceError = err?.error?.message ?? 'Failed to load workspaces.';
      },
    });
  }

  private loadStatements(accountId: string): void {
    this.loadingStatements[accountId] = true;
    this.statementsApi.listStatements(accountId).subscribe({
      next: (list) => {
        this.statementsByAccount[accountId] = list;
        this.loadingStatements[accountId] = false;
      },
      error: () => {
        this.statementsByAccount[accountId] = [];
        this.loadingStatements[accountId] = false;
      },
    });
  }
}
