import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="flex flex-col w-64 h-full bg-gray-900 text-white">
      <div class="p-6 border-b border-gray-700">
        <h1 class="text-xl font-bold tracking-tight">Sixert Bank</h1>
        <p class="text-xs text-gray-400 mt-1">SMB Banking Platform</p>
      </div>

      <ul class="flex-1 py-4 space-y-1 px-3">
        @for (item of navItems; track item.route) {
          <li>
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-gray-700 text-white"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <span class="text-lg">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          </li>
        }
      </ul>

      <div class="p-4 border-t border-gray-700">
        <p class="text-xs text-gray-400 truncate mb-2">{{ state()?.email }}</p>
        <button
          (click)="logout()"
          class="w-full text-sm text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors text-left"
        >
          Sign out
        </button>
      </div>
    </nav>
  `,
})
export class SidebarComponent {
  private authService = inject(AuthService);
  readonly state = toSignal(this.authService.state$);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '🏠' },
    { label: 'Accounts', route: '/accounts', icon: '🏦' },
    { label: 'Transfers', route: '/transfers', icon: '↔️' },
    { label: 'Statements', route: '/statements', icon: '📄' },
    { label: 'Messages', route: '/messages', icon: '✉️' },
    { label: 'Profile', route: '/profile', icon: '👤' },
  ];

  logout() {
    this.authService.logout();
  }
}
