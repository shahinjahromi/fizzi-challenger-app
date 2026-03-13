import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from '../../../core/services/message.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { AuthService } from '../../../core/services/auth.service';
import { Thread, Message } from '../../../shared/models/message.model';

const MAX_BODY = 2000;

@Component({
  selector: 'szb-thread',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, RouterLink, ReactiveFormsModule],
  template: `
    <div class="back-link">
      <a routerLink="/messages" class="btn btn-ghost btn-sm">← Back to Inbox</a>
    </div>

    <div class="loading-center" *ngIf="loading" aria-busy="true">
      <span class="spinner spinner-lg" aria-hidden="true"></span>
    </div>

    <div class="alert alert-error" *ngIf="error && !thread" role="alert">
      <span>⚠</span> {{ error }}
    </div>

    <ng-container *ngIf="thread">
      <div class="page-header">
        <h1 class="page-title">{{ thread.subject }}</h1>
        <p class="page-subtitle text-muted text-small">Started {{ thread.createdAt | date:'medium' }}</p>
      </div>

      <div class="messages-list">
        <ng-container *ngIf="thread.messages && thread.messages.length > 0; else noMessages">
          <div
            *ngFor="let msg of thread.messages"
            class="message-bubble"
            [class.mine]="isMine(msg)"
            [class.theirs]="!isMine(msg)"
          >
            <div class="msg-meta">
              <span class="msg-from fw-600">{{ msg.fromDisplay }}</span>
              <span class="msg-time text-small text-muted">{{ (msg.sentAt || msg.createdAt) | date:'medium' }}</span>
            </div>
            <div class="msg-body">{{ msg.body }}</div>
          </div>
        </ng-container>
        <ng-template #noMessages>
          <div class="no-messages text-center text-muted" style="padding:32px">
            No messages in this thread yet. Start the conversation below.
          </div>
        </ng-template>
      </div>

      <!-- Compose -->
      <div class="compose-card card">
        <label for="replyBody" class="form-label">Reply</label>
        <textarea
          id="replyBody"
          class="form-control compose-area"
          [formControl]="bodyCtrl"
          [maxlength]="maxBody"
          rows="4"
          placeholder="Type your message…"
          aria-label="Compose message"
        ></textarea>
        <div class="compose-footer">
          <span class="char-count text-small text-muted" [class.text-danger]="remaining < 100">
            {{ remaining }} characters remaining
          </span>
          <div class="compose-actions">
            <div class="alert alert-error compact" *ngIf="sendError" role="alert">
              {{ sendError }}
            </div>
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="bodyCtrl.invalid || sending"
              (click)="send()"
            >
              <span class="spinner" *ngIf="sending" aria-hidden="true"></span>
              {{ sending ? 'Sending…' : 'Send' }}
            </button>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [
    `.back-link { margin-bottom: 16px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--color-text); margin: 0; }
    .page-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }
    .messages-list { margin-bottom: 24px; }
    .message-bubble { background: var(--color-primary-light); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 12px; box-shadow: var(--shadow-sm); }
    .message-bubble.mine { background: var(--color-success-light); color: var(--color-success); }
    .message-bubble.theirs { background: var(--color-primary-light); color: var(--color-primary); }
    .msg-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .msg-from { font-weight: 600; font-size: 14px; }
    .msg-time { font-size: 12px; color: var(--color-text-muted); }
    .msg-body { font-size: 15px; color: var(--color-text); }
    .no-messages { color: var(--color-text-muted); }
    .compose-card { background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 24px; margin-top: 24px; }
    .form-label { font-size: 14px; font-weight: 500; color: var(--color-secondary); margin-bottom: 8px; }
    .compose-area { border-radius: var(--radius-md); border: 1px solid var(--color-border-dark); padding: 10px 12px; font-size: 15px; margin-bottom: 12px; }
    .compose-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
    .char-count { font-size: 12px; color: var(--color-text-muted); }
    .compose-actions { display: flex; gap: 8px; }
    .alert-error { color: var(--color-danger); background: var(--color-danger-light); border-radius: var(--radius-md); padding: 8px; margin-bottom: 8px; }
    .compact { padding: 4px 8px; font-size: 12px; }
    @media (max-width: 767px) { .compose-card { padding: 12px; } }
    @media (max-width: 480px) { .compose-card { padding: 8px; } }
  ],
    .messages-list {
      display: flex; flex-direction: column; gap: 16px;
      margin-bottom: 24px;
    }
    .message-bubble {
      max-width: 70%; padding: 14px 18px;
      border-radius: var(--radius-lg); position: relative;
    }
    .message-bubble.mine {
      align-self: flex-end;
      background: var(--color-primary); color: #fff;
    }
    .message-bubble.theirs {
      align-self: flex-start;
      background: var(--color-white); border: 1px solid var(--color-border);
    }
    .message-bubble.mine .msg-meta,
    .message-bubble.mine .msg-time { color: rgba(255,255,255,.75); }
    .msg-meta { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; font-size: 13px; flex-wrap: wrap; }
    .msg-body { font-size: 15px; white-space: pre-wrap; word-break: break-word; }
    .form-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-secondary, #1a1a2e);
      display: block;
      margin-bottom: 6px;
    }
    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--color-border-dark, #b8c4d6);
      border-radius: var(--radius-md, 10px);
      background: var(--color-white, #fff);
      font-size: 15px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .form-control:focus {
      border-color: var(--color-primary, #003087);
      box-shadow: 0 0 0 3px rgba(0,48,135,.15);
      outline: none;
    }
    .compose-card { margin-top: 0; }
    .compose-area { resize: vertical; min-height: 80px; }
    .compose-footer {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-top: 8px; flex-wrap: wrap; gap: 8px;
    }
    .compose-actions { display: flex; align-items: center; gap: 12px; }
    .alert.compact { margin: 0; padding: 8px 12px; font-size: 13px; }

    @media (max-width: 767px) {
      .message-bubble { max-width: 90%; padding: 10px 14px; }
      .compose-footer { flex-direction: column; }
      .compose-actions { width: 100%; justify-content: flex-end; }
    }
  `],
})
export class ThreadComponent implements OnInit {
  thread: Thread | null = null;
  loading = false;
  error = '';
  sending = false;
  sendError = '';
  maxBody = MAX_BODY;

  bodyCtrl = new FormControl('', [Validators.required, Validators.maxLength(MAX_BODY)]);

  get remaining(): number {
    return MAX_BODY - (this.bodyCtrl.value?.length ?? 0);
  }

  constructor(
    private route: ActivatedRoute,
    private msgSvc: MessageService,
    private ws: WorkspaceService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const threadId = this.route.snapshot.paramMap.get('threadId') ?? '';
    const wsId = this.ws.currentWorkspaceId;
    if (!wsId) return;

    this.loading = true;
    this.msgSvc.getThread(threadId, wsId).subscribe({
      next: (t) => {
        this.thread = t;
        this.loading = false;
        this.msgSvc.markRead(threadId, wsId).subscribe();
      },
      error: () => { this.error = 'Failed to load thread.'; this.loading = false; },
    });
  }

  isMine(msg: Message): boolean {
    const user = this.auth.currentUser$.value;
    return !!user && msg.fromDisplay === user.username;
  }

  send(): void {
    if (!this.thread || this.bodyCtrl.invalid) return;
    const wsId = this.ws.currentWorkspaceId;
    if (!wsId) return;
    this.sending = true;
    this.sendError = '';
    this.msgSvc.sendMessage(this.thread.id, wsId, this.bodyCtrl.value ?? '').subscribe({
      next: (msg) => {
        this.sending = false;
        this.bodyCtrl.reset('');
        if (this.thread) {
          this.thread = {
            ...this.thread,
            messages: [...(this.thread.messages ?? []), msg],
          };
        }
      },
      error: () => { this.sending = false; this.sendError = 'Failed to send. Please try again.'; },
    });
  }
}
