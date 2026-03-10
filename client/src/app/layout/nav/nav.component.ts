import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'szb-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor],
  template: `
    <nav class="sidebar" aria-label="Main navigation">
      <ul class="nav-list" role="list">
        <li *ngFor="let item of navItems">
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-link"
            [attr.aria-label]="item.label"
          >
            <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </li>
      </ul>
    </nav>
  `,
  styles: [`
    .sidebar {
      width: 220px; flex-shrink: 0;
      background: var(--color-white);
      border-right: 1px solid var(--color-border);
      padding: 16px 0;
      min-height: 100%;
    }
    .nav-list { list-style: none; margin: 0; padding: 0; }
    .nav-link {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 20px;
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: 14px; font-weight: 500;
      border-radius: 0;
      transition: background var(--transition), color var(--transition);
    }
    .nav-link:hover { background: var(--color-bg); color: var(--color-text); }
    .nav-link.active {
      background: var(--color-primary-light);
      color: var(--color-primary);
      border-right: 3px solid var(--color-primary);
    }
    .nav-icon { font-size: 18px; width: 22px; text-align: center; }
  `],
})
export class NavComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: '⊞', route: '/dashboard'   },
    { label: 'Move Money', icon: '↔', route: '/move-money'  },
    { label: 'Statements', icon: '📄', route: '/statements'  },
    { label: 'Messages',   icon: '✉',  route: '/messages'    },
    { label: 'Profile',    icon: '👤', route: '/profile'     },
    { label: 'Security',   icon: '🔒', route: '/security'    },
  ];
}
