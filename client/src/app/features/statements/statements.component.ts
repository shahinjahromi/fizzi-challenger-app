import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../core/services/account.service';
import { StatementService } from '../../core/services/statement.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Account } from '../../shared/models/account.model';
import { Statement } from '../../shared/models/statement.model';

@Component({
  selector: 'szb-statements',
  standalone: true,
  imports: [NgFor, NgIf, SlicePipe, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Statements</h1>
      <p class="page-subtitle">Download monthly account statements</p>
    </div>

    <div class="card">
      <div class="form-group" style="max-width:320px">
        <label for="acctSelect" class="form-label">Select Account</label>
        <select
          id="acctSelect"
          class="form-control"
          [(ngModel)]="selectedAccountId"
          (ngModelChange)="onAccountChange()"
        >
          <option value="">— Choose account —</option>
          <option *ngFor="let acc of accounts" [value]="acc.id">
            {{ acc.name }} (••••{{ acc.last4 }})
          </option>
        </select>
      </div>

      <div class="alert alert-error" *ngIf="error" role="alert">
        <span>⚠</span> {{ error }}
      </div>

      <div class="loading-center" *ngIf="loading" aria-busy="true">
        <span class="spinner" aria-hidden="true"></span>
      </div>

      <div class="stmts-empty" *ngIf="!loading && selectedAccountId && statements.length === 0 && !error">
        <p class="text-muted">No statements available for this account yet.</p>
      </div>

      <div class="stmts-hint" *ngIf="!selectedAccountId">
        <p class="text-muted">Select an account above to view available statements.</p>
      </div>

      <div class="table-wrapper" *ngIf="!loading && statements.length > 0">
        <table class="table" aria-label="Statement list">
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Generated</th>
              <th scope="col" class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let stmt of statements">
              <td class="fw-600">{{ formatMonth(stmt.month) }}</td>
              <td class="text-muted">{{ stmt.createdAt | slice:0:10 }}</td>
              <td class="text-right">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  [disabled]="downloadingId === stmt.id"
                  (click)="download(stmt)"
                  [attr.aria-label]="'Download statement for ' + formatMonth(stmt.month)"
                >
                  <span class="spinner" *ngIf="downloadingId === stmt.id" aria-hidden="true"></span>
                  {{ downloadingId === stmt.id ? 'Downloading…' : '⬇ Download PDF' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="alert alert-error" *ngIf="downloadError" role="alert" style="margin-top:12px">
        <span>⚠</span> {{ downloadError }}
      </div>
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 32px; }
    .stmts-empty, .stmts-hint { padding: 24px 0; }
  `],
})
export class StatementsComponent implements OnInit {
  accounts: Account[] = [];
  statements: Statement[] = [];
  selectedAccountId = '';
  loading = false;
  error = '';
  downloadingId: string | null = null;
  downloadError = '';

  constructor(
    private accountSvc: AccountService,
    private stmtSvc: StatementService,
    private ws: WorkspaceService
  ) {}

  ngOnInit(): void {
    const wsId = this.ws.currentWorkspaceId;
    if (!wsId) return;
    this.accountSvc.getAccounts(wsId).subscribe({
      next: (r) => { this.accounts = r.data.filter((a) => !a.isClosed); },
      error: () => { this.error = 'Failed to load accounts.'; },
    });
  }

  onAccountChange(): void {
    if (!this.selectedAccountId) { this.statements = []; return; }
    this.loading = true;
    this.error = '';
    this.stmtSvc.getStatements(this.selectedAccountId).subscribe({
      next: (r) => { this.statements = r.data; this.loading = false; },
      error: () => { this.error = 'Failed to load statements.'; this.loading = false; },
    });
  }

  download(stmt: Statement): void {
    this.downloadingId = stmt.id;
    this.downloadError = '';
    this.stmtSvc.downloadStatement(stmt.id).subscribe({
      next: (res) => {
        this.downloadingId = null;
        // Open download URL in new tab (stub integration)
        window.open(res.downloadUrl, '_blank', 'noopener,noreferrer');
      },
      error: () => {
        this.downloadingId = null;
        this.downloadError = 'Failed to download statement. Please try again.';
      },
    });
  }

  formatMonth(month: string): string {
    const [year, m] = month.split('-');
    const date = new Date(Number(year), Number(m) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}
