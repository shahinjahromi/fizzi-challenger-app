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
      <div class="login-card">
        <div class="login-header">
          <span class="login-logo">⬡</span>
          <h1 class="login-title">Sixert Bank</h1>
          <p class="login-subtitle">Sign in to your account</p>
        </div>

        <div class="alert alert-error" *ngIf="errorMsg" role="alert" aria-live="assertive">
          <span>⚠</span> {{ errorMsg }}
        </div>

        <div class="demo-credentials" *ngIf="showTestCredentials">
          <p class="demo-credentials__title">Local test credentials</p>
          <div class="demo-credentials__row" *ngFor="let cred of demoCredentials">
            <span class="demo-credentials__username">{{ cred.username }}</span>
            <span class="demo-credentials__password">{{ cred.password }}</span>
            <span class="demo-credentials__note">{{ cred.note }}</span>
          </div>
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
            <p class="form-hint">🔐 Two-step verification required. Enter your code:</p>
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
            class="btn btn-primary btn-full"
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
          <span aria-hidden="true">·</span>
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
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--color-primary) 0%, #0f3388 100%);
      padding: 24px;
    }
    .login-card {
      background: var(--color-white);
      border-radius: var(--radius-xl);
      padding: 40px;
      width: 100%; max-width: 420px;
      box-shadow: var(--shadow-lg);
    }
    .login-header { text-align: center; margin-bottom: 32px; }
    .login-logo { font-size: 48px; display: block; margin-bottom: 8px; }
    .login-title { font-size: 24px; font-weight: 700; margin: 0 0 4px; color: var(--color-primary); }
    .login-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }
    .mfa-placeholder {
      background: var(--color-primary-light); border: 1px solid #bfdbfe;
      border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 16px;
    }
    .login-links {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; margin-top: 20px; font-size: 13px;
    }
    .demo-credentials {
      margin: 0 0 16px;
      padding: 10px 12px;
      border: 1px dashed var(--color-border, #d1d5db);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      opacity: 0.9;
      font-size: 12px;
    }
    .demo-credentials__title {
      margin: 0 0 8px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .demo-credentials__row {
      display: grid;
      grid-template-columns: 72px 88px 1fr;
      gap: 8px;
      line-height: 1.35;
      margin-bottom: 4px;
    }
    .demo-credentials__row:last-child { margin-bottom: 0; }
    .demo-credentials__username,
    .demo-credentials__password {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    .link-btn {
      background: none; border: none; padding: 0;
      color: var(--color-primary); cursor: pointer; font-size: 13px;
    }
    .link-btn:hover { text-decoration: underline; }
    .link-btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class LoginComponent {
  readonly showTestCredentials =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  readonly demoCredentials = [
    { username: 'bob', password: 'demo1234', note: 'Single workspace flow' },
    { username: 'alice', password: 'demo1234', note: 'Workspace selector flow' },
    { username: 'carol', password: 'demo1234', note: 'Beta LLC test user' },
    { username: 'dave', password: 'demo1234', note: 'Authorized user view' },
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
