import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { MessageService } from '../../core/services/message.service';

@Component({
  selector: 'szb-header',
  standalone: true,
  imports: [RouterLink, AsyncPipe, DatePipe, NgIf],
  template: `
    <header class="header" role="banner">
      <div class="header-inner">
        <a routerLink="/dashboard" class="logo" aria-label="Fizzi Challenger Bank – go to dashboard">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="40" height="40" rx="10" fill="#003087"/>
            <path d="M20 8L32 14V16H8V14L20 8Z" fill="white"/>
            <rect x="10" y="18" width="4" height="10" fill="white"/>
            <rect x="18" y="18" width="4" height="10" fill="white"/>
            <rect x="26" y="18" width="4" height="10" fill="white"/>
            <rect x="8" y="30" width="24" height="2" fill="white"/>
          </svg>
          <span class="logo-text">Fizzi Challenger Bank</span>
        </a>

        <div class="header-center" *ngIf="currentWorkspace$ | async as ws">
          <span class="workspace-name">{{ ws.name }}</span>
        </div>

        <div class="header-right">
          <ng-container *ngIf="currentUser$ | async as user">
            <div class="last-login" *ngIf="user.lastLoginAt">
              Last login: {{ user.lastLoginAt | date:'medium' }}
            </div>
            <a routerLink="/messages" class="notif-btn" aria-label="Messages">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2 6.5L10 11.5L18 6.5" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span class="notif-badge" *ngIf="unreadCount > 0" [attr.aria-label]="unreadCount + ' unread'">
                {{ unreadCount }}
              </span>
            </a>
            <span class="username">{{ user.username }}</span>
            <button class="btn btn-ghost btn-sm logout-btn" (click)="logout()" type="button">
              Sign out
            </button>
          </ng-container>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: sticky; top: 0; z-index: 100;
      height: var(--header-height);
      background: #ffffff;
      border-bottom: 1px solid #dde3ed;
    }
    .header-inner {
      display: flex; align-items: center; gap: 16px;
      max-width: 1400px; margin: 0 auto;
      padding: 0 24px; height: 100%;
    }
    .logo {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; font-size: 17px;
      color: #003087; text-decoration: none;
    }
    .header-center { flex: 1; }
    .workspace-name {
      font-size: 13px; font-weight: 500;
      color: #003087;
      background: #e6edf8;
      border: 1px solid #b8c4d6;
      padding: 3px 12px; border-radius: 999px;
    }
    .header-right {
      display: flex; align-items: center; gap: 14px;
      margin-left: auto;
    }
    .last-login { font-size: 12px; color: #5a6a7e; white-space: nowrap; }
    .notif-btn {
      position: relative; color: #5a6a7e;
      text-decoration: none;
      display: flex; align-items: center;
    }
    .notif-badge {
      position: absolute; top: -6px; right: -8px;
      background: #c0392b; color: #fff;
      font-size: 10px; font-weight: 600;
      border-radius: 999px; padding: 1px 5px;
      min-width: 16px; text-align: center;
    }
    .username { font-size: 14px; font-weight: 600; color: #0d1b2a; }
    .logout-btn {
      color: #5a6a7e;
      border-color: #dde3ed;
    }
    .logout-btn:hover:not(:disabled) { background: #f5f7fa; }
  `],
})
export class HeaderComponent implements OnInit {
  currentUser$  = this.auth.currentUser$;
  currentWorkspace$ = this.ws.currentWorkspace$;
  unreadCount = 0;

  constructor(
    private auth: AuthService,
    private ws: WorkspaceService,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    const wsId = this.ws.currentWorkspaceId;
    if (wsId) {
      this.msg.getThreads(wsId).subscribe({
        next: (res) => {
          this.unreadCount = res.data.reduce((sum, t) => sum + t.unreadCount, 0);
        },
      });
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
