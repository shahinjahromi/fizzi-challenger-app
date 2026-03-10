import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ProfileService, SecurityCenter } from '../../core/services/profile.service';

@Component({
  selector: 'szb-security-center',
  standalone: true,
  imports: [NgIf, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">Security Center</h1>
      <p class="page-subtitle">Review your security settings</p>
    </div>

    <div class="loading-center" *ngIf="loading" aria-busy="true">
      <span class="spinner spinner-lg" aria-hidden="true"></span>
    </div>

    <div class="alert alert-error" *ngIf="error" role="alert">
      <span>⚠</span> {{ error }}
    </div>

    <div class="card sec-card" *ngIf="!loading">

      <!-- Username row -->
      <div class="sec-row">
        <div class="sec-item">
          <span class="sec-icon-circle sec-icon-circle--blue" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <div class="sec-info">
            <span class="sec-label">Username</span>
            <span class="sec-value">{{ username }}</span>
          </div>
        </div>
        <span class="badge badge-green">Active</span>
      </div>

      <div class="sec-divider"></div>

      <!-- Password row -->
      <div class="sec-row">
        <div class="sec-item">
          <span class="sec-icon-circle sec-icon-circle--blue" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="8" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 8V5a3 3 0 016 0v3" stroke="currentColor" stroke-width="1.5"/></svg>
          </span>
          <div class="sec-info">
            <span class="sec-label">Password</span>
            <span class="sec-value password-dots" aria-label="Password hidden">••••••••••••••••</span>
          </div>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          disabled
          title="Password change requires step-up authentication (coming soon)"
        >
          Change
        </button>
      </div>

      <div class="sec-divider"></div>

      <!-- 2-Step Verification row -->
      <div class="sec-row">
        <div class="sec-item">
          <span class="sec-icon-circle sec-icon-circle--green" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L16 4V9C16 13 9 17 9 17C9 17 2 13 2 9V4L9 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 9l2.5 2.5L12 6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <div class="sec-info">
            <span class="sec-label">2-Step Verification</span>
            <span class="sec-value" *ngIf="security?.twoStepEnabled">
              <span class="badge badge-green">Enabled</span>
              <span class="text-muted text-small" *ngIf="security?.twoStepMethod">
                ({{ security!.twoStepMethod }})
              </span>
            </span>
            <span class="sec-value" *ngIf="!security?.twoStepEnabled">
              <span class="badge badge-yellow">Not enabled</span>
            </span>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" disabled title="Manage 2FA (coming soon)">
          Manage
        </button>
      </div>

      <div class="sec-divider"></div>

      <!-- Trusted Devices row -->
      <div class="sec-row">
        <div class="sec-item">
          <span class="sec-icon-circle sec-icon-circle--gray" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="3" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 17h6M9 14v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <div class="sec-info">
            <span class="sec-label">Trusted Devices</span>
            <span class="sec-value">
              <ng-container *ngIf="security && security.trustedDevicesCount > 0; else noDevices">
                <span class="badge badge-blue">{{ security.trustedDevicesCount }} device{{ security.trustedDevicesCount !== 1 ? 's' : '' }}</span>
              </ng-container>
              <ng-template #noDevices>
                <span class="text-muted">No trusted devices</span>
              </ng-template>
            </span>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" disabled title="Manage devices (coming soon)">
          Review
        </button>
      </div>

      <div class="sec-divider"></div>

      <!-- Step-up Authentication row (last — no divider after) -->
      <div class="sec-row">
        <div class="sec-item">
          <span class="sec-icon-circle sec-icon-circle--warning" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L16 4V9C16 13 9 17 9 17C9 17 2 13 2 9V4L9 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
          </span>
          <div class="sec-info">
            <span class="sec-label">Step-Up Authentication</span>
            <span class="sec-desc">Required for sensitive operations</span>
          </div>
        </div>
        <span class="badge badge-gray">Placeholder</span>
      </div>
    </div>

    <div class="mt-16">
      <a routerLink="/profile" class="btn btn-ghost btn-sm">← Back to Profile</a>
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .sec-card { padding: 0; overflow: hidden; }
    .sec-row {
      display: flex; align-items: center; justify-content: space-between;
      min-height: 64px; padding: 0 24px; gap: 16px; flex-wrap: wrap;
    }
    .sec-item { display: flex; align-items: center; gap: 14px; }
    .sec-icon-circle {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .sec-icon-circle--blue    { background: #e6edf8; color: #003087; }
    .sec-icon-circle--green   { background: #e3f5ef; color: #00875a; }
    .sec-icon-circle--gray    { background: #f5f7fa; color: #5a6a7e; }
    .sec-icon-circle--warning { background: #fef3c7; color: #b45309; }
    .sec-info { display: flex; flex-direction: column; gap: 2px; }
    .sec-label { font-size: 14px; font-weight: 600; color: #0d1b2a; }
    .sec-desc { font-size: 12px; color: #5a6a7e; }
    .sec-value { font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; color: #0d1b2a; }
    .password-dots { font-size: 18px; letter-spacing: 2px; color: #5a6a7e; }
    .sec-divider { height: 1px; background: #dde3ed; margin: 0 24px; }
    .mt-16 { margin-top: 16px; }
  `],
})
export class SecurityCenterComponent implements OnInit {
  security: SecurityCenter | null = null;
  loading = false;
  error = '';
  username = '';

  constructor(private profileSvc: ProfileService) {}

  ngOnInit(): void {
    this.loading = true;
    this.profileSvc.getSecurityCenter().subscribe({
      next: (s) => {
        this.security = s;
        this.username = s.username;
        this.loading = false;
      },
      error: () => {
        // Fall back gracefully on error
        this.loading = false;
        this.error = 'Failed to load security settings.';
      },
    });
  }
}
