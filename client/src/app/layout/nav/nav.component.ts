import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface NavItem {
  label: string;   // also used as key for icon lookup via getIcon()
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
            <span class="nav-icon" aria-hidden="true" [innerHTML]="getIcon(item.label)"></span>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </li>
      </ul>
    </nav>
  `,
  styles: [`
    .sidebar {
      width: var(--nav-width); flex-shrink: 0;
      background: #ffffff;
      border-right: 1px solid #dde3ed;
      padding: 16px 0;
      min-height: 100%;
    }
    .nav-list { list-style: none; margin: 0; padding: 0; }
    .nav-link {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px;
      height: 44px;
      color: #5a6a7e;
      text-decoration: none;
      font-size: 14px; font-weight: 500;
      border-radius: 0;
      transition: background var(--transition), color var(--transition);
    }
    .nav-link:hover { background: #f5f7fa; color: #0d1b2a; }
    .nav-link.active {
      background: #e6edf8;
      color: #003087;
      font-weight: 600;
      border-left: 3px solid #003087;
      padding-left: 17px;
    }
    .nav-icon { width: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  `],
})
export class NavComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard',  route: '/dashboard'   },
    { label: 'Move Money', route: '/move-money'  },
    { label: 'Statements', route: '/statements'  },
    { label: 'Messages',   route: '/messages'    },
    { label: 'Profile',    route: '/profile'     },
    { label: 'Security',   route: '/security'    },
  ];

  private readonly icons: Record<string, string> = {
    'Dashboard':  '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="11" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>',
    'Move Money': '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9H15M15 9L11 5M15 9L11 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'Statements': '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="1" width="12" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 6H12M6 9H12M6 12H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    'Messages':   '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 3H16V13H10L6 16V13H2V3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    'Profile':    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    'Security':   '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L16 4V9C16 13 9 17 9 17C9 17 2 13 2 9V4L9 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  };

  constructor(private sanitizer: DomSanitizer) {}

  getIcon(label: string): SafeHtml {
    const svg = this.icons[label] ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
