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

    <div class="card" *ngIf="!loading">
      <div class="sec-row">
        <div class="sec-item">
          <span class="sec-icon" aria-hidden="true">👤</span>
          <div class="sec-info">
            <span class="sec-label">Username</span>
            <span class="sec-value">{{ username }}</span>
          </div>
        </div>
        <span class="badge badge-green">Active</span>
      </div>

      <div class="divider"></div>

      <div class="sec-row">
        <div class="sec-item">
          <span class="sec-icon" aria-hidden="true">🔑</span>
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

      <div class="divider"></div>

      <div class="sec-row">
        <div class="sec-item">
          <span class="sec-icon" aria-hidden="true">🔐</span>
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

      <div class="divider"></div>

      <div class="sec-row">
        <div class="sec-item">
          <span class="sec-icon" aria-hidden="true">💻</span>
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

      <div class="divider"></div>

      <div class="sec-row sec-row--info">
        <div class="sec-item">
          <span class="sec-icon" aria-hidden="true">🛡</span>
          <div class="sec-info">
            <span class="sec-label">Step-Up Authentication</span>
            <span class="sec-value text-muted text-small">Required for sensitive operations</span>
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
    .sec-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 4px 0; gap: 16px; flex-wrap: wrap;
    }
    .sec-item { display: flex; align-items: center; gap: 14px; }
    .sec-icon { font-size: 22px; width: 32px; text-align: center; }
    .sec-info { display: flex; flex-direction: column; gap: 2px; }
    .sec-label { font-size: 13px; color: var(--color-text-muted); }
    .sec-value { font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
    .password-dots { font-size: 20px; letter-spacing: 2px; color: var(--color-text-muted); }
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
