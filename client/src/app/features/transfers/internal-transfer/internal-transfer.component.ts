import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder, FormGroup, Validators, AbstractControl,
  ValidatorFn, ReactiveFormsModule,
} from '@angular/forms';
import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { TransferService } from '../../../core/services/transfer.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Account } from '../../../shared/models/account.model';
import { InternalTransfer } from '../../../shared/models/transfer.model';
import { HttpErrorResponse } from '@angular/common/http';

type Step = 'form' | 'review' | 'confirm';

const differentAccountsValidator: ValidatorFn = (ctrl: AbstractControl) => {
  const from = ctrl.get('fromAccountId')?.value as string;
  const to   = ctrl.get('toAccountId')?.value as string;
  return from && to && from === to ? { sameAccount: true } : null;
};

@Component({
  selector: 'szb-internal-transfer',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, CurrencyPipe, DatePipe, RouterLink],
  template: `
    <div class="back-link">
      <a routerLink="/move-money" class="btn btn-ghost btn-sm">← Back</a>
    </div>

    <div class="page-header">
      <h1 class="page-title">Internal Transfer</h1>
    </div>

    <!-- Stepper -->
    <div class="stepper" aria-label="Transfer steps">
      <div class="step" [class.active]="step === 'form'" [class.done]="stepIndex > 0">
        <span class="step-num">1</span> <span class="step-label">Details</span>
      </div>
      <div class="step-line"></div>
      <div class="step" [class.active]="step === 'review'" [class.done]="stepIndex > 1">
        <span class="step-num">2</span> <span class="step-label">Review</span>
      </div>
      <div class="step-line"></div>
      <div class="step" [class.active]="step === 'confirm'">
        <span class="step-num">3</span> <span class="step-label">Confirmed</span>
      </div>
    </div>

    <!-- Step 1: Form -->
    <div class="card" *ngIf="step === 'form'">
      <div class="alert alert-error" *ngIf="form.errors?.['sameAccount'] && form.touched" role="alert">
        From and To accounts must be different.
      </div>
      <div class="alert alert-error" *ngIf="apiError" role="alert">
        <span>⚠</span> {{ apiError }}
      </div>

      <form [formGroup]="form" (ngSubmit)="toReview()">
        <div class="form-group">
          <label for="fromAccount" class="form-label">From Account</label>
          <select
            id="fromAccount"
            formControlName="fromAccountId"
            class="form-control"
            [class.is-invalid]="isInvalid('fromAccountId')"
            aria-required="true"
          >
            <option value="">— Select account —</option>
            <option *ngFor="let acc of eligibleAccounts" [value]="acc.id">
              {{ acc.name }} (••••{{ acc.last4 }}) — {{ acc.availableBalance | currency:'USD' }}
            </option>
          </select>
          <span class="form-error" *ngIf="isInvalid('fromAccountId')">Please select a from account.</span>
        </div>

        <div class="form-group">
          <label for="toAccount" class="form-label">To Account</label>
          <select
            id="toAccount"
            formControlName="toAccountId"
            class="form-control"
            [class.is-invalid]="isInvalid('toAccountId')"
            aria-required="true"
          >
            <option value="">— Select account —</option>
            <option *ngFor="let acc of eligibleAccounts" [value]="acc.id">
              {{ acc.name }} (••••{{ acc.last4 }})
            </option>
          </select>
          <span class="form-error" *ngIf="isInvalid('toAccountId')">Please select a to account.</span>
          <span class="form-error" *ngIf="form.errors?.['sameAccount'] && form.get('toAccountId')?.touched">
            Must be different from source account.
          </span>
        </div>

        <div class="form-group">
          <label for="amount" class="form-label">Amount (USD)</label>
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            formControlName="amount"
            class="form-control"
            [class.is-invalid]="isInvalid('amount')"
            aria-required="true"
            placeholder="0.00"
          />
          <span class="form-error" *ngIf="isInvalid('amount')">Enter a valid amount greater than $0.</span>
          <span class="form-error" *ngIf="insufficientFunds" role="alert">
            Insufficient available balance in source account.
          </span>
        </div>

        <div class="form-group">
          <label for="memo" class="form-label">Memo <span class="text-muted">(optional)</span></label>
          <input
            id="memo"
            type="text"
            formControlName="memo"
            class="form-control"
            maxlength="255"
            placeholder="Optional note"
          />
        </div>

        <div class="form-group">
          <label for="date" class="form-label">Transfer Date</label>
          <input
            id="date"
            type="date"
            formControlName="requestedExecutionDate"
            class="form-control"
            [min]="minDate"
          />
          <span class="form-hint">Business days only. Leave blank for next available business day.</span>
        </div>

        <div class="form-actions">
          <a routerLink="/move-money" class="btn btn-ghost">Cancel</a>
          <button type="submit" class="btn btn-primary" [disabled]="accountsLoading">
            Review Transfer
          </button>
        </div>
      </form>
    </div>

    <!-- Step 2: Review -->
    <div class="card" *ngIf="step === 'review'">
      <h2 class="review-heading">Review Your Transfer</h2>

      <div class="review-grid">
        <div class="review-row">
          <span class="review-label">From</span>
          <span class="review-value">{{ fromAccount?.name }} (••••{{ fromAccount?.last4 }})</span>
        </div>
        <div class="review-row">
          <span class="review-label">To</span>
          <span class="review-value">{{ toAccount?.name }} (••••{{ toAccount?.last4 }})</span>
        </div>
        <div class="review-row">
          <span class="review-label">Amount</span>
          <span class="review-value fw-600">{{ form.value.amount | currency:'USD' }}</span>
        </div>
        <div class="review-row" *ngIf="form.value.memo">
          <span class="review-label">Memo</span>
          <span class="review-value">{{ form.value.memo }}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Date</span>
          <span class="review-value">{{ form.value.requestedExecutionDate || 'Next business day' }}</span>
        </div>
      </div>

      <div class="alert alert-info fdic-notice" role="note">
        🏛 FDIC insured up to $250,000 per depositor. Transfers settle on the next available business day.
      </div>

      <div class="alert alert-warning cutoff-notice" role="note">
        ⏰ Transfers submitted after <strong>1:00 PM ET</strong> will be posted the next business day.
      </div>

      <div class="alert alert-error" *ngIf="apiError" role="alert">
        <span>⚠</span> {{ apiError }}
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" (click)="backToForm()">← Back</button>
        <button
          type="button"
          class="btn btn-primary"
          [disabled]="submitting"
          (click)="submit()"
        >
          <span class="spinner" *ngIf="submitting" aria-hidden="true"></span>
          {{ submitting ? 'Processing…' : 'Confirm Transfer' }}
        </button>
      </div>
    </div>

    <!-- Step 3: Confirmation -->
    <div class="card confirm-card" *ngIf="step === 'confirm' && transferResult">
      <div class="confirm-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13l4 4L19 7" stroke="#00875a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2 class="confirm-title">Transfer Submitted!</h2>
      <p class="confirm-subtitle">Your transfer has been received and is being processed.</p>

      <div class="confirm-details">
        <div class="review-row">
          <span class="review-label">Reference ID</span>
          <span class="review-value mono">{{ transferResult.referenceId }}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Status</span>
          <span class="badge badge-yellow">{{ transferResult.status }}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Effective Date</span>
          <span class="review-value">{{ transferResult.effectiveDate | date:'mediumDate' }}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Submitted At</span>
          <span class="review-value">{{ transferResult.createdAt | date:'medium' }}</span>
        </div>
      </div>

      <div class="form-actions justify-center">
        <a routerLink="/dashboard" class="btn btn-primary">Return to Dashboard</a>
        <a routerLink="/move-money" class="btn btn-secondary">New Transfer</a>
      </div>
    </div>
  `,
  styles: [`
    .back-link { margin-bottom: 16px; }

    /* Stepper */
    .stepper {
      display: flex; align-items: center; gap: 0;
      margin-bottom: 28px; background: #fff;
      border: 1px solid #dde3ed; border-radius: var(--radius-lg);
      padding: 20px 28px;
    }
    .step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .step-num {
      width: 32px; height: 32px; border-radius: 50%;
      background: #f5f7fa; border: 2px solid #dde3ed;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 600; color: #8b9ab0;
    }
    .step.active .step-num { background: #003087; border-color: #003087; color: #fff; }
    .step.done .step-num   { background: #003087; border-color: #003087; color: #fff; }
    .step-label { font-size: 12px; font-weight: 500; color: #8b9ab0; white-space: nowrap; }
    .step.active .step-label { color: #003087; font-weight: 600; }
    .step.done  .step-label  { color: #003087; }
    .step-line  { flex: 1; height: 2px; background: #dde3ed; margin: 0 8px; margin-bottom: 18px; }
    .step.done ~ .step-line { background: #003087; }

    /* Form fields */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }
    .form-label { font-size: 13px; font-weight: 500; color: #5a6a7e; }
    .form-control {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid var(--color-border-dark, #b8c4d6);
      border-radius: var(--radius-md);
      background: var(--color-white, #fff);
      font-size: 15px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .form-control:focus { border-color: #003087; box-shadow: 0 0 0 3px rgba(0,48,135,.12); outline: none; }
    .form-control.is-invalid { border-color: var(--color-danger, #c0392b); }
    .form-error { font-size: 12px; color: var(--color-danger, #c0392b); }
    .form-hint { font-size: 12px; color: #5a6a7e; }

    /* Amount input with $ prefix */
    .amount-wrap { position: relative; }
    .amount-prefix {
      position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
      font-size: 15px; color: #5a6a7e; pointer-events: none;
    }
    .amount-input { padding-left: 28px; }

    /* Memo char counter */
    .memo-counter { font-size: 12px; color: #8b9ab0; text-align: right; margin-top: 4px; }

    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .justify-center { justify-content: center; }

    /* Review */
    .review-heading { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #0d1b2a; }
    .review-grid { display: flex; flex-direction: column; margin-bottom: 20px; }
    .review-row {
      display: flex; justify-content: space-between; align-items: center;
      gap: 16px; min-height: 48px;
      border-bottom: 1px solid #dde3ed; padding: 0 2px;
    }
    .review-row:last-child { border-bottom: none; }
    .review-label { font-size: 14px; color: #5a6a7e; }
    .review-value { font-size: 15px; font-weight: 500; color: #0d1b2a; }

    /* Confirmation */
    .confirm-card { text-align: center; padding: 48px 28px; }
    .confirm-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: #e3f5ef; color: #00875a;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
      font-size: 28px;
    }
    .confirm-title { font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #0d1b2a; }
    .confirm-subtitle { font-size: 14px; color: #5a6a7e; margin-bottom: 28px; }
    .confirm-ref {
      display: inline-block; background: #f5f7fa; border: 1px solid #dde3ed;
      border-radius: var(--radius-sm); font-family: monospace; font-size: 13px;
      padding: 4px 10px; color: #0d1b2a; margin-bottom: 8px;
    }
    .confirm-details { text-align: left; max-width: 420px; margin: 0 auto 32px; }
    .mono { font-family: monospace; font-size: 13px; }
    .fdic-notice { margin-top: 16px; }

    @media (max-width: 767px) {
      .stepper { padding: 14px 16px; }
      .step-label { font-size: 11px; }
      .form-actions { flex-wrap: wrap; }
      .form-actions .btn { flex: 1; min-width: 120px; }
      .review-row { flex-direction: column; align-items: flex-start; gap: 4px; min-height: auto; padding: 10px 2px; }
      .confirm-card { padding: 32px 16px; }
    }
  `],
})
export class InternalTransferComponent implements OnInit {
  step: Step = 'form';
  accounts: Account[] = [];
  accountsLoading = false;
  submitting = false;
  apiError = '';
  transferResult: InternalTransfer | null = null;

  form: FormGroup;
  minDate: string;

  get stepIndex(): number {
    return this.step === 'form' ? 0 : this.step === 'review' ? 1 : 2;
  }

  get eligibleAccounts(): Account[] {
    return this.accounts.filter((a) => a.isMoveMoneyEligible && !a.isClosed);
  }

  get fromAccount(): Account | undefined {
    return this.accounts.find((a) => a.id === this.form.value.fromAccountId);
  }

  get toAccount(): Account | undefined {
    return this.accounts.find((a) => a.id === this.form.value.toAccountId);
  }

  get insufficientFunds(): boolean {
    const from = this.fromAccount;
    const amount = Number(this.form.value.amount);
    return !!from && amount > from.availableBalance;
  }

  constructor(
    private fb: FormBuilder,
    private accountSvc: AccountService,
    private transferSvc: TransferService,
    private ws: WorkspaceService,
    private router: Router
  ) {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.form = this.fb.group(
      {
        fromAccountId:        ['', Validators.required],
        toAccountId:          ['', Validators.required],
        amount:               [null, [Validators.required, Validators.min(0.01)]],
        memo:                 [''],
        requestedExecutionDate: [''],
      },
      { validators: differentAccountsValidator }
    );
  }

  ngOnInit(): void {
    const wsId = this.ws.currentWorkspaceId;
    if (!wsId) { this.router.navigate(['/workspaces']); return; }
    this.accountsLoading = true;
    this.accountSvc.getAccounts(wsId).subscribe({
      next: (r) => { this.accounts = r.data; this.accountsLoading = false; },
      error: () => { this.apiError = 'Failed to load accounts.'; this.accountsLoading = false; },
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && c.touched);
  }

  toReview(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.insufficientFunds) return;
    this.apiError = '';
    this.step = 'review';
  }

  backToForm(): void { this.step = 'form'; }

  submit(): void {
    const wsId = this.ws.currentWorkspaceId;
    if (!wsId) return;
    this.submitting = true;
    this.apiError = '';

    const v = this.form.value as {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      memo: string;
      requestedExecutionDate: string;
    };

    this.transferSvc
      .submitInternalTransfer({
        workspaceId: wsId,
        fromAccountId: v.fromAccountId,
        toAccountId: v.toAccountId,
        amount: v.amount,
        memo: v.memo || undefined,
        requestedExecutionDate: v.requestedExecutionDate || undefined,
      })
      .subscribe({
        next: (res) => {
          this.submitting = false;
          this.transferResult = res;
          this.step = 'confirm';
        },
        error: (err: unknown) => {
          this.submitting = false;
          if (err instanceof HttpErrorResponse) {
            const body = err.error as { error?: { message?: string; code?: string } };
            if (body?.error?.code === 'LIMIT_BLOCKED') {
              this.apiError = `Transfer blocked: ${body.error.message ?? 'Limit exceeded.'}`;
            } else {
              this.apiError = body?.error?.message ?? 'Transfer failed. Please try again.';
            }
          } else {
            this.apiError = 'Transfer failed. Please try again.';
          }
        },
      });
  }
}
