import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'szb-move-money-hub',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">Move Money</h1>
      <p class="page-subtitle">Choose a transfer type to get started</p>
    </div>

    <div class="hub-grid">
      <a routerLink="/move-money/internal" class="hub-card hub-card--active" aria-label="Internal Transfer between your accounts">
        <div class="hub-icon-circle hub-icon-circle--primary" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 18 18" fill="none"><path d="M3 9H15M15 9L11 5M15 9L11 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h2 class="hub-title">Internal Transfer</h2>
        <p class="hub-desc">Move funds between your Fizzi Challenger Bank accounts instantly.</p>
        <span class="hub-arrow">Get started →</span>
      </a>

      <div class="hub-card hub-card--disabled" aria-disabled="true" title="Coming soon">
        <div class="hub-icon-circle hub-icon-circle--muted" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M14 5V4a2 2 0 00-2-2H8a2 2 0 00-2 2v1" stroke="currentColor" stroke-width="1.5"/></svg>
        </div>
        <h2 class="hub-title hub-title--muted">External Transfer (ACH)</h2>
        <p class="hub-desc hub-desc--muted">Transfer to or from linked external bank accounts (1–3 business days).</p>
        <span class="badge badge-gray hub-badge">Coming soon</span>
      </div>

      <div class="hub-card hub-card--disabled" aria-disabled="true" title="Coming soon">
        <div class="hub-icon-circle hub-icon-circle--muted" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M6 6l4-4 4 4M6 14l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h2 class="hub-title hub-title--muted">Send Money</h2>
        <p class="hub-desc hub-desc--muted">Send funds to individuals or businesses via wire or RTP.</p>
        <span class="badge badge-gray hub-badge">Coming soon</span>
      </div>
    </div>

    <div class="card manage-link mt-24">
      <div class="manage-row">
        <div class="manage-info">
          <div class="manage-icon-circle" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 12L12 8M10 4H6a4 4 0 000 8h2M10 16h4a4 4 0 000-8h-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div>
            <strong class="manage-title">Manage Linked Accounts</strong>
            <p class="manage-subtitle">Manage your linked bank accounts for ACH transfers.</p>
          </div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" disabled>
          Manage Accounts
        </button>
      </div>
    </div>
  `,
  styles: [
    `.hub-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .hub-card {
      background: var(--color-white); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 28px;
      min-height: 200px;
      display: flex; flex-direction: column; gap: 12px;
      text-decoration: none; color: var(--color-text);
      transition: border-color var(--transition), box-shadow var(--transition);
      position: relative;
    }
    .hub-card--active {
      border-left: 4px solid var(--color-primary);
      cursor: pointer;
    }
    .hub-card--active:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-md);
    }
    .hub-card--disabled { opacity: .7; cursor: not-allowed; }
    .hub-card--disabled:hover { opacity: .7; }
    .hub-icon-circle {
      width: 48px; height: 48px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .hub-icon-circle--primary { background: var(--color-primary-light); color: var(--color-primary); }
    .hub-icon-circle--muted { background: var(--color-bg); color: var(--color-text-light); }
    .hub-title { font-size: 18px; font-weight: 700; margin: 0; color: var(--color-text); }
    .hub-title--muted { color: var(--color-text-light); }
    .hub-desc { font-size: 14px; color: var(--color-text-muted); margin: 0; }
    .hub-desc--muted { color: var(--color-text-light); }
    .hub-arrow { font-size: 13px; color: var(--color-primary); margin-top: 8px; }
    .badge { background: var(--color-primary-light); color: var(--color-primary); font-weight: 600; border-radius: 999px; padding: 4px 12px; font-size: 13px; }
    .hub-badge { margin-top: 8px; }
    .manage-link { margin-top: 24px; }
    .manage-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .manage-info { display: flex; align-items: center; gap: 12px; }
    .manage-icon-circle { width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; }
    .manage-title { font-size: 15px; font-weight: 600; color: var(--color-text); }
    .manage-subtitle { font-size: 13px; color: var(--color-text-muted); }
    .btn-secondary { background: var(--color-white); color: var(--color-primary); border: 1px solid var(--color-primary); }
    .btn-secondary:hover:not(:disabled) { background: var(--color-primary-light); }
    @media (max-width: 767px) { .hub-grid { grid-template-columns: 1fr; } }
    @media (max-width: 480px) { .hub-card { padding: 12px; } }
  ],
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .hub-card {
      background: #fff; border: 1px solid #dde3ed;
      border-radius: var(--radius-lg); padding: 28px;
      min-height: 200px;
      display: flex; flex-direction: column; gap: 12px;
      text-decoration: none; color: var(--color-text);
      transition: border-color var(--transition), box-shadow var(--transition);
      position: relative;
    }
    .hub-card--active {
      border-left: 4px solid #003087;
      cursor: pointer;
    }
    .hub-card--active:hover {
      border-color: #003087;
      box-shadow: var(--shadow-md);
    }
    .hub-card--disabled { opacity: .7; cursor: not-allowed; }
    .hub-card--disabled:hover { opacity: .7; }

    .hub-icon-circle {
      width: 48px; height: 48px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .hub-icon-circle--primary { background: #e6edf8; color: #003087; }
    .hub-icon-circle--muted { background: #f5f7fa; color: #8b9ab0; }

    .hub-title { font-size: 18px; font-weight: 700; margin: 0; color: #0d1b2a; }
    .hub-title--muted { color: #8b9ab0; }
    .hub-desc { font-size: 14px; color: #5a6a7e; margin: 0; flex: 1; }
    .hub-desc--muted { color: #8b9ab0; }
    .hub-arrow { font-size: 14px; color: #003087; font-weight: 600; margin-top: auto; }
    .hub-badge { align-self: flex-start; }

    .mt-24 { margin-top: 24px; }
    .manage-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .manage-info { display: flex; align-items: center; gap: 14px; }
    .manage-icon-circle {
      width: 40px; height: 40px; border-radius: 50%;
      background: #e6edf8; color: #003087;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .manage-title { font-size: 15px; font-weight: 600; color: #0d1b2a; display: block; }
    .manage-subtitle { font-size: 13px; color: #5a6a7e; margin: 2px 0 0; }

    @media (max-width: 480px) {
      .hub-grid { grid-template-columns: 1fr; }
      .hub-card { padding: 20px; min-height: auto; }
      .manage-row { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class MoveMoneyHubComponent {}
