import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Workspace } from '../../../shared/models/workspace.model';

@Component({
  selector: 'szb-workspace-selector',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <div class="ws-page" role="main">
      <div class="ws-card">
        <div class="ws-header">
          <span class="ws-logo">⬡</span>
          <h1 class="ws-title">Select a Workspace</h1>
          <p class="ws-subtitle">Choose which account workspace to access</p>
        </div>

        <div class="alert alert-error" *ngIf="error" role="alert">
          <span>⚠</span> {{ error }}
        </div>

        <div class="ws-loading" *ngIf="loading" aria-busy="true">
          <span class="spinner spinner-lg" aria-hidden="true"></span>
          <p>Loading workspaces…</p>
        </div>

        <ul
          class="ws-list"
          role="listbox"
          aria-label="Available workspaces"
          *ngIf="!loading && workspaces.length > 0"
          (keydown)="onKeyDown($event)"
        >
          <li
            *ngFor="let ws of workspaces; let i = index"
            role="option"
            [attr.aria-selected]="i === focusIndex"
            [class.focused]="i === focusIndex"
            class="ws-item"
            tabindex="0"
            (click)="select(ws)"
            (focus)="focusIndex = i"
          >
            <div class="ws-item-inner">
              <span class="ws-item-icon">🏦</span>
              <div class="ws-item-info">
                <span class="ws-item-name">{{ ws.name }}</span>
                <span class="ws-item-role badge badge-blue">{{ ws.role }}</span>
              </div>
              <span class="ws-item-arrow" aria-hidden="true">›</span>
            </div>
          </li>
        </ul>

        <div class="ws-empty" *ngIf="!loading && workspaces.length === 0 && !error">
          <p>No workspaces available. Please contact support.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ws-page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--color-primary) 0%, #0f3388 100%);
      padding: 24px;
    }
    .ws-card {
      background: var(--color-white); border-radius: var(--radius-xl);
      padding: 40px; width: 100%; max-width: 480px;
      box-shadow: var(--shadow-lg);
    }
    .ws-header { text-align: center; margin-bottom: 28px; }
    .ws-logo { font-size: 40px; display: block; margin-bottom: 8px; }
    .ws-title { font-size: 22px; font-weight: 700; margin: 0 0 4px; color: var(--color-primary); }
    .ws-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }
    .ws-loading { text-align: center; padding: 32px; color: var(--color-text-muted); }
    .ws-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .ws-item {
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      cursor: pointer; transition: border-color var(--transition), box-shadow var(--transition);
    }
    .ws-item:hover, .ws-item.focused {
      border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(26,86,219,.12);
    }
    .ws-item-inner {
      display: flex; align-items: center; gap: 12px; padding: 16px;
    }
    .ws-item-icon { font-size: 24px; }
    .ws-item-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .ws-item-name { font-weight: 600; font-size: 15px; }
    .ws-item-arrow { font-size: 20px; color: var(--color-text-muted); }
    .ws-empty { text-align: center; color: var(--color-text-muted); padding: 24px; }

    @media (max-width: 480px) {
      .ws-card { padding: 28px 20px; }
      .ws-item-inner { padding: 12px; }
    }
  `],
})
export class WorkspaceSelectorComponent implements OnInit {
  workspaces: Workspace[] = [];
  loading = false;
  error = '';
  focusIndex = 0;

  constructor(
    private wsService: WorkspaceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.wsService.loadWorkspaces().subscribe({
      next: (res) => {
        this.workspaces = res.data;
        this.loading = false;
        if (res.data.length === 1) this.select(res.data[0]);
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load workspaces. Please try again.';
      },
    });
  }

  select(ws: Workspace): void {
    this.wsService.selectWorkspace(ws);
    this.router.navigate(['/dashboard']);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusIndex = Math.min(this.focusIndex + 1, this.workspaces.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusIndex = Math.max(this.focusIndex - 1, 0);
    } else if (event.key === 'Enter') {
      this.select(this.workspaces[this.focusIndex]);
    }
  }
}
