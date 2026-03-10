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
      <a routerLink="/move-money/internal" class="hub-card" aria-label="Internal Transfer between your accounts">
        <div class="hub-icon">↔</div>
        <h2 class="hub-title">Internal Transfer</h2>
        <p class="hub-desc">Move funds between your Sixert Bank accounts instantly.</p>
        <span class="hub-arrow">Get started →</span>
      </a>

      <div class="hub-card hub-card--disabled" aria-disabled="true" title="Coming soon">
        <div class="hub-icon">🏦</div>
        <h2 class="hub-title">External Transfer (ACH)</h2>
        <p class="hub-desc">Transfer to or from linked external bank accounts (1–3 business days).</p>
        <span class="hub-badge badge badge-gray">Coming soon</span>
      </div>

      <div class="hub-card hub-card--disabled" aria-disabled="true" title="Coming soon">
        <div class="hub-icon">💸</div>
        <h2 class="hub-title">Send Money</h2>
        <p class="hub-desc">Send funds to individuals or businesses via wire or RTP.</p>
        <span class="hub-badge badge badge-gray">Coming soon</span>
      </div>
    </div>

    <div class="card manage-link mt-24">
      <div class="manage-row">
        <div>
          <strong>Linked External Accounts</strong>
          <p class="text-muted text-small mb-0">Manage your linked bank accounts for ACH transfers.</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" disabled>
          Manage Accounts
        </button>
      </div>
    </div>
  `,
  styles: [`
    .hub-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .hub-card {
      background: var(--color-white); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 28px;
      display: flex; flex-direction: column; gap: 10px;
      text-decoration: none; color: var(--color-text);
      transition: border-color var(--transition), box-shadow var(--transition);
      cursor: pointer;
    }
    a.hub-card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(26,86,219,.1);
    }
    .hub-card--disabled { opacity: .65; cursor: not-allowed; }
    .hub-icon { font-size: 32px; }
    .hub-title { font-size: 18px; font-weight: 600; margin: 0; }
    .hub-desc { font-size: 14px; color: var(--color-text-muted); margin: 0; flex: 1; }
    .hub-arrow { font-size: 14px; color: var(--color-primary); font-weight: 500; }
    .hub-badge { align-self: flex-start; }
    .mt-24 { margin-top: 24px; }
    .manage-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  `],
})
export class MoveMoneyHubComponent {}
