import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Sixert Bank</h1>
          <p class="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          @if (error()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {{ error() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email or Username
              </label>
              <input
                formControlName="identifier"
                type="text"
                autocomplete="username"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="alice@acmecorp.com or alice"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                formControlName="password"
                type="password"
                autocomplete="current-password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              [disabled]="form.invalid || submitting()"
              class="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              @if (submitting()) {
                Signing in...
              } @else {
                Sign in
              }
            </button>
          </form>
        </div>

        <div class="mt-6 p-4 bg-white border border-dashed border-gray-300 rounded-xl text-sm text-gray-600">
          <p class="font-medium text-gray-700 mb-2">Demo credentials (password: demo1234)</p>
          <ul class="space-y-1">
            <li><span class="font-mono text-blue-700">alice</span> — Acme Corp OWNER, 180-day tenure</li>
            <li><span class="font-mono text-blue-700">bob</span> — Acme Corp ADMIN, 30-day tenure</li>
            <li><span class="font-mono text-blue-700">carol</span> — Global Ventures OWNER, elevated limits</li>
            <li><span class="font-mono text-blue-700">dave</span> — Global Ventures MEMBER, restricted limits</li>
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;

    this.error.set(null);
    this.submitting.set(true);

    try {
      const { identifier, password } = this.form.getRawValue();
      await this.authService.login(identifier, password);
      this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      const body = (err as { error?: { error?: string; details?: Array<{ message?: string }> } })?.error;
      const msg =
        body?.details?.[0]?.message ?? body?.error ?? 'Invalid credentials';
      this.error.set(msg);
    } finally {
      this.submitting.set(false);
    }
  }
}
