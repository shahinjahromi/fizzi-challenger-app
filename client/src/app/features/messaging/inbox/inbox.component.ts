import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { MessageService } from '../../../core/services/message.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Thread } from '../../../shared/models/message.model';

@Component({
  selector: 'szb-inbox',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, RouterLink],
  template: `
    <div class="page-header">
      <div class="inbox-title-row">
        <h1 class="page-title">Messages</h1>
        <button type="button" class="btn btn-primary btn-sm" (click)="newThread()">
          + New Message
        </button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="error" role="alert">
      <span>⚠</span> {{ error }}
    </div>

    <div class="loading-center" *ngIf="loading" aria-busy="true">
      <span class="spinner spinner-lg" aria-hidden="true"></span>
    </div>

    <div class="card" *ngIf="!loading">
      <div class="inbox-empty" *ngIf="threads.length === 0 && !error">
        <p class="text-muted text-center" style="padding:32px">No messages yet.</p>
      </div>

      <ul class="thread-list" role="list" *ngIf="threads.length > 0">
        <li
          *ngFor="let t of threads"
          class="thread-item"
          [class.unread]="t.unreadCount > 0"
          [routerLink]="['/messages', t.id]"
          tabindex="0"
          role="listitem"
          (keydown.enter)="navigate(t.id)"
        >
          <div class="thread-inner">
            <div class="thread-icon" aria-hidden="true">✉</div>
            <div class="thread-body">
              <div class="thread-subject-row">
                <span class="thread-subject">{{ t.subject }}</span>
                <span class="badge badge-blue unread-badge" *ngIf="t.unreadCount > 0">
                  {{ t.unreadCount }}
                </span>
              </div>
              <div class="thread-meta">
                <span class="thread-from" *ngIf="t.latestMessage">
                  {{ t.latestMessage.fromDisplay }}
                </span>
                <span class="thread-date text-muted text-small" *ngIf="t.latestMessage?.sentAt">
                  {{ t.latestMessage!.sentAt | date:'MMM d' }}
                </span>
              </div>
            </div>
            <span class="thread-arrow" aria-hidden="true">›</span>
          </div>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .inbox-title-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .thread-list { list-style: none; margin: 0; padding: 0; }
    .thread-item {
      border-bottom: 1px solid var(--color-border); cursor: pointer;
      transition: background var(--transition);
    }
    .thread-item:last-child { border-bottom: none; }
    .thread-item:hover { background: var(--color-bg); }
    .thread-item.unread { background: var(--color-primary-light); }
    .thread-inner { display: flex; align-items: center; gap: 14px; padding: 14px 16px; }
    .thread-icon { font-size: 20px; color: var(--color-primary); width: 32px; text-align: center; }
    .thread-body { flex: 1; min-width: 0; }
    .thread-subject-row { display: flex; align-items: center; gap: 8px; }
    .thread-subject { font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .thread-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px; }
    .thread-from { font-size: 13px; color: var(--color-text-muted); }
    .thread-arrow { font-size: 20px; color: var(--color-text-muted); }
  `],
})
export class InboxComponent implements OnInit {
  threads: Thread[] = [];
  loading = false;
  error = '';

  constructor(
    private msgSvc: MessageService,
    private ws: WorkspaceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const wsId = this.ws.currentWorkspaceId;
    if (!wsId) return;
    this.loading = true;
    this.msgSvc.getThreads(wsId).subscribe({
      next: (r) => { this.threads = r.data; this.loading = false; },
      error: () => { this.error = 'Failed to load messages.'; this.loading = false; },
    });
  }

  navigate(id: string): void { this.router.navigate(['/messages', id]); }

  newThread(): void {
    const wsId = this.ws.currentWorkspaceId;
    if (!wsId) return;
    const subject = window.prompt('Enter message subject:');
    if (!subject?.trim()) return;
    this.msgSvc.createThread(wsId, subject.trim()).subscribe({
      next: (t) => this.router.navigate(['/messages', t.id]),
      error: () => { this.error = 'Failed to create thread.'; },
    });
  }
}
