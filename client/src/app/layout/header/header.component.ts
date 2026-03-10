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
          <span class="logo-icon">⬡</span>
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
              <span class="notif-icon">✉</span>
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
      height: 64px;
      background: var(--color-white);
      border-bottom: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }
    .header-inner {
      display: flex; align-items: center; gap: 16px;
      max-width: 1400px; margin: 0 auto;
      padding: 0 24px; height: 100%;
    }
    .logo {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; font-size: 18px;
      color: var(--color-primary); text-decoration: none;
    }
    .logo-icon { font-size: 22px; }
    .header-center { flex: 1; }
    .workspace-name {
      font-size: 13px; font-weight: 500;
      color: var(--color-text-muted);
      background: var(--color-primary-light);
      padding: 4px 12px; border-radius: 999px;
    }
    .header-right {
      display: flex; align-items: center; gap: 14px;
      margin-left: auto;
    }
    .last-login { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; }
    .notif-btn {
      position: relative; color: var(--color-text-muted);
      font-size: 18px; text-decoration: none;
      display: flex; align-items: center;
    }
    .notif-badge {
      position: absolute; top: -6px; right: -8px;
      background: var(--color-danger); color: #fff;
      font-size: 10px; font-weight: 600;
      border-radius: 999px; padding: 1px 5px;
      min-width: 16px; text-align: center;
    }
    .username { font-size: 14px; font-weight: 500; }
    .logout-btn { color: var(--color-text-muted); }
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
