import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, NgIf } from '@angular/common';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'szb-profile',
  standalone: true,
  imports: [NgIf, DatePipe, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">My Profile</h1>
      <p class="page-subtitle">View your account information</p>
    </div>

    <div class="loading-center" *ngIf="loading" aria-busy="true">
      <span class="spinner spinner-lg" aria-hidden="true"></span>
    </div>

    <div class="alert alert-error" *ngIf="error" role="alert">
      <span>⚠</span> {{ error }}
    </div>

    <div class="card" *ngIf="user">
      <div class="profile-avatar" aria-hidden="true">👤</div>
      <div class="profile-grid">
        <div class="profile-row">
          <span class="profile-label">Username</span>
          <span class="profile-value">{{ user.username }}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Email</span>
          <span class="profile-value">{{ user.email }}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Role</span>
          <span class="profile-value">
            <span class="badge badge-blue">{{ user.role }}</span>
          </span>
        </div>
        <div class="profile-row" *ngIf="user.lastLoginAt">
          <span class="profile-label">Last Login</span>
          <span class="profile-value text-muted">{{ user.lastLoginAt | date:'medium' }}</span>
        </div>
        <div class="profile-row" *ngIf="user.tenureStartDate">
          <span class="profile-label">Member Since</span>
          <span class="profile-value text-muted">{{ user.tenureStartDate | date:'mediumDate' }}</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="security-link-row">
        <div>
          <strong>Security Center</strong>
          <p class="text-muted text-small mb-0">Manage your password, 2FA, and trusted devices.</p>
        </div>
        <a routerLink="/security" class="btn btn-secondary btn-sm">Go to Security →</a>
      </div>
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .profile-avatar { font-size: 56px; text-align: center; margin-bottom: 20px; }
    .profile-grid { display: flex; flex-direction: column; }
    .profile-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid var(--color-border);
    }
    .profile-row:last-child { border-bottom: none; }
    .profile-label { font-size: 14px; color: var(--color-text-muted); }
    .profile-value { font-size: 15px; font-weight: 500; }
    .security-link-row {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }
  `],
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  loading = false;
  error = '';

  constructor(private profileSvc: ProfileService, private auth: AuthService) {}

  ngOnInit(): void {
    // Try from cached user first
    const cached = this.auth.currentUser$.value;
    if (cached) { this.user = cached; return; }

    this.loading = true;
    this.profileSvc.getProfile().subscribe({
      next: (u) => { this.user = u; this.loading = false; },
      error: () => { this.error = 'Failed to load profile.'; this.loading = false; },
    });
  }
}
