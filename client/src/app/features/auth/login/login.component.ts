import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'szb-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  template: `
    <div class="login-page" role="main">
      <!-- Left brand panel -->
      <div class="login-brand" aria-hidden="true">
        <div class="brand-content">
          <div class="brand-logo-wrap">
            <svg width="56" height="56" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="white" fill-opacity="0.15"/>
              <path d="M20 8L32 14V16H8V14L20 8Z" fill="white"/>
              <rect x="10" y="18" width="4" height="10" fill="white"/>
              <rect x="18" y="18" width="4" height="10" fill="white"/>
              <rect x="26" y="18" width="4" height="10" fill="white"/>
              <rect x="8" y="30" width="24" height="2" fill="white"/>
            </svg>
          </div>
          <h2 class="brand-name">Fizzi Challenger Bank</h2>
          <p class="brand-tagline">Secure. Modern. Built for you.</p>
        </div>
      </div>

      <!-- Right form panel -->
      <div class="login-form-panel">
        <div class="login-form-inner">
          <div class="login-header">
            <div class="login-logo-row">
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect width="40" height="40" rx="10" fill="#003087"/>
                <path d="M20 8L32 14V16H8V14L20 8Z" fill="white"/>
                <rect x="10" y="18" width="4" height="10" fill="white"/>
                <rect x="18" y="18" width="4" height="10" fill="white"/>
                <rect x="26" y="18" width="4" height="10" fill="white"/>
                <rect x="8" y="30" width="24" height="2" fill="white"/>
              </svg>
              <span class="login-logo-text">Fizzi Challenger Bank</span>
            </div>
            <h1 class="login-title">Sign in to your account</h1>
          </div>

          <div class="alert-error-accent" *ngIf="errorMsg" role="alert" aria-live="assertive">
            <span>⚠</span> {{ errorMsg }}
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="form-group">
              <label for="identifier" class="form-label">Username or Email</label>
              <input
                id="identifier"
                type="text"
                formControlName="identifier"
                class="form-control"
                [class.is-invalid]="isFieldInvalid('identifier')"
                autocomplete="username"
                aria-required="true"
                [attr.aria-describedby]="isFieldInvalid('identifier') ? 'identifier-error' : null"
                placeholder="Enter username or email"
              />
              <span
                id="identifier-error"
                class="form-error"
                *ngIf="isFieldInvalid('identifier')"
                role="alert"
              >
                Username or email is required.
              </span>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="form-control"
                [class.is-invalid]="isFieldInvalid('password')"
                autocomplete="current-password"
                aria-required="true"
                [attr.aria-describedby]="isFieldInvalid('password') ? 'password-error' : null"
                placeholder="Enter password"
              />
              <span
                id="password-error"
                class="form-error"
                *ngIf="isFieldInvalid('password')"
                role="alert"
              >
                Password is required.
              </span>
            </div>

            <!-- MFA placeholder -->
            <div class="mfa-placeholder" *ngIf="mfaRequired">
              <div class="mfa-header">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 1L16 4V9C16 13 9 17 9 17C9 17 2 13 2 9V4L9 1Z" stroke="#003087" stroke-width="1.5" stroke-linejoin="round"/></svg>
                <span class="mfa-title">Two-step verification</span>
              </div>
              <p class="form-hint">Enter the 6-digit code from your authenticator app.</p>
              <input
                id="mfa"
                type="text"
                class="form-control"
                inputmode="numeric"
                maxlength="6"
                autocomplete="one-time-code"
                placeholder="6-digit code"
              />
            </div>

            <button
              type="submit"
              class="btn-signin"
              [disabled]="loading"
              aria-label="Sign in"
            >
              <span class="spinner" *ngIf="loading" aria-hidden="true"></span>
              {{ loading ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>

          <div class="login-links">
            <button
              type="button"
              class="link-btn"
              (click)="onForgotPassword()"
              [disabled]="forgotLoading"
            >
              Forgot Password?
            </button>
            <button
              type="button"
              class="link-btn"
              (click)="onForgotUsername()"
              [disabled]="forgotLoading"
            >
              Forgot Username?
            </button>
          </div>

          <div class="alert alert-success" *ngIf="forgotMsg" role="status" aria-live="polite">
            {{ forgotMsg }}
          </div>

          <div class="demo-credentials" *ngIf="showTestCredentials" aria-label="Local demo accounts">
            <p class="demo-credentials__title">Local demo accounts</p>
            <div class="demo-credentials__row" *ngFor="let cred of demoCredentials">
              <span class="demo-credentials__username">{{ cred.username }}</span>
              <span class="demo-credentials__email">{{ cred.email }}</span>
              <span class="demo-credentials__password">{{ cred.password }}</span>
            </div>
          </div>

          <div class="demo-credentials demo-credentials--nymbus" *ngIf="showTestCredentials" aria-label="Nymbus sandbox accounts">
            <p class="demo-credentials__title">Nymbus sandbox accounts</p>
            <div class="demo-credentials__row" *ngFor="let cred of nymbusCredentials">
              <span class="demo-credentials__username">{{ cred.username }}</span>
              <span class="demo-credentials__email">{{ cred.email }}</span>
              <span class="demo-credentials__password">{{ cred.password }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
    }
    /* Left brand panel */
    .login-brand {
      flex: 0 0 420px;
      background: #003087;
      display: flex; align-items: center; justify-content: center;
      padding: 48px 40px;
    }
    .brand-content { text-align: center; color: #fff; }
    .brand-logo-wrap { margin-bottom: 24px; display: flex; justify-content: center; }
    .brand-name { font-size: 24px; font-weight: 700; margin: 0 0 10px; color: #fff; }
    .brand-tagline { font-size: 15px; color: rgba(255,255,255,0.72); margin: 0; }

    /* Right form panel */
    .login-form-panel {
      flex: 1;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      padding: 48px 40px;
    }
    .login-form-inner { width: 100%; max-width: 400px; }
    .login-header { margin-bottom: 32px; }
    .login-logo-row {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px;
    }
    .login-logo-text { font-size: 17px; font-weight: 700; color: #003087; }
    .login-title { font-size: 22px; font-weight: 700; margin: 0; color: #0d1b2a; }

    .alert-error-accent {
      background: #fdecea;
      border-left: 4px solid #c0392b;
      color: #c0392b;
      border-radius: var(--radius-md);
      padding: 12px 16px;
      font-size: 14px;
      display: flex; align-items: flex-start; gap: 8px;
      margin-bottom: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }
    .form-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-secondary, #1a1a2e);
    }
    .form-control {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid var(--color-border-dark, #b8c4d6);
      border-radius: var(--radius-md);
      background: var(--color-white, #fff);
      font-size: 15px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .form-control.is-invalid { border-color: var(--color-danger, #c0392b); }
    .form-error {
      font-size: 12px;
      color: var(--color-danger, #c0392b);
    }
    .form-control:focus {
      border-color: #003087;
      box-shadow: 0 0 0 3px rgba(0,48,135,.15);
    }

    .btn-signin {
      width: 100%; height: 48px;
      background: #003087; color: #fff;
      border: none; border-radius: var(--radius-md);
      font-size: 14px; font-weight: 600; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      transition: background 150ms ease;
      margin-top: 4px;
    }
    .btn-signin:hover:not(:disabled) { background: #00256b; }
    .btn-signin:disabled { opacity: .5; cursor: not-allowed; }

    .mfa-placeholder {
      background: var(--color-primary-light); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 16px;
    }
    .mfa-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .mfa-title { font-size: 14px; font-weight: 600; color: #003087; }

    .login-links {
      display: flex; flex-direction: column; gap: 6px;
      margin-top: 20px; font-size: 13px;
    }
    .demo-credentials {
      margin: 18px 0 0;
      padding-top: 10px;
      border-top: 1px solid rgba(107, 114, 128, 0.2);
      color: var(--color-text-muted);
      opacity: 0.55;
      font-size: 11px;
    }
    .demo-credentials__title {
      margin: 0 0 6px;
      font-weight: 500;
      letter-spacing: 0.01em;
    }
    .demo-credentials__row {
      display: grid;
      grid-template-columns: 54px 1fr 78px;
      gap: 6px;
      line-height: 1.35;
      margin-bottom: 2px;
    }
    .demo-credentials__row:last-child { margin-bottom: 0; }
    .demo-credentials__username,
    .demo-credentials__password {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    .demo-credentials__email {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .demo-credentials--nymbus {
      border-top: 1px dashed rgba(107, 114, 128, 0.2);
    }
    .link-btn {
      background: none; border: none; padding: 0;
      color: #003087; cursor: pointer; font-size: 13px; text-align: left;
    }
    .link-btn:hover { text-decoration: underline; }
    .link-btn:disabled { opacity: .5; cursor: not-allowed; }

    /* Mobile: stack columns */
    @media (max-width: 768px) {
      .login-page { flex-direction: column; }
      .login-brand { flex: none; padding: 32px 24px; }
      .login-form-panel { padding: 32px 24px; }
    }
    @media (max-width: 480px) {
      .login-brand { padding: 20px 16px; }
      .login-form-panel { padding: 20px 16px; }
    }
  `],
})
export class LoginComponent {
  readonly showTestCredentials =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  readonly demoCredentials = [
    { username: 'alice', email: 'alice@example.com', password: 'demo1234' },
    { username: 'bob', email: 'bob@example.com', password: 'demo1234' },
    { username: 'carol', email: 'carol@example.com', password: 'demo1234' },
    { username: 'dave', email: 'dave@example.com', password: 'demo1234' },
  ];

  readonly nymbusCredentials = [
    { username: 'emily', email: 'emily.nymbus@fizzibank.test', password: 'demo1234' },
    { username: 'marcus', email: 'marcus.nymbus@fizzibank.test', password: 'demo1234' },
    { username: 'jordan', email: 'jordan.smith@example.com', password: 'demo1234' },
    { username: 'alex', email: 'alex.chen@example.com', password: 'demo1234' },
  ];

  form: FormGroup;
  loading = false;
  forgotLoading = false;
  errorMsg = '';
  forgotMsg = '';
  mfaRequired = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private ws: WorkspaceService,
    private router: Router
  ) {
    this.form = this.fb.group({
      identifier: ['', Validators.required],
      password:   ['', Validators.required],
    });
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    const { identifier, password } = this.form.value as { identifier: string; password: string };

    this.auth.login(identifier, password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.user.workspaces.length === 1) {
          const wsList = res.user.workspaces;
          this.ws.loadWorkspaces().subscribe({
            next: (wsRes) => {
              const single = wsRes.data.find((w) => w.id === wsList[0].id);
              if (single) this.ws.selectWorkspace(single);
              this.router.navigate(['/dashboard']);
            },
            error: () => this.router.navigate(['/workspaces']),
          });
        } else {
          this.router.navigate(['/workspaces']);
        }
      },
      error: (err: unknown) => {
        this.loading = false;
        if (err instanceof HttpErrorResponse) {
          if (err.status === 0) {
            this.errorMsg = 'Cannot reach the server. Start the API on port 4001 and try again.';
          } else if (err.status === 401 || err.status === 400) {
            this.errorMsg = 'Invalid credentials. Please try again.';
          } else if (err.status === 429) {
            this.errorMsg = 'Too many attempts. Please wait before trying again.';
          } else {
            this.errorMsg = 'An error occurred. Please try again later.';
          }
        } else {
          this.errorMsg = 'An error occurred. Please try again later.';
        }
      },
    });
  }

  onForgotPassword(): void {
    const identifier = this.form.get('identifier')?.value as string;
    if (!identifier) {
      this.forgotMsg = 'Enter your username or email first.';
      return;
    }
    this.forgotLoading = true;
    this.auth.forgotPassword(identifier).subscribe({
      next: (res) => { this.forgotLoading = false; this.forgotMsg = res.message; },
      error: () => {
        this.forgotLoading = false;
        this.forgotMsg = 'If an account with that email exists, a reset link has been sent.';
      },
    });
  }

  onForgotUsername(): void {
    const identifier = this.form.get('identifier')?.value as string;
    if (!identifier) {
      this.forgotMsg = 'Enter your email first.';
      return;
    }
    this.forgotLoading = true;
    this.auth.forgotUsername(identifier).subscribe({
      next: (res) => { this.forgotLoading = false; this.forgotMsg = res.message; },
      error: () => {
        this.forgotLoading = false;
        this.forgotMsg = 'If an account with that email exists, the username has been sent.';
      },
    });
  }
}
