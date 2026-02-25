import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/accounts': 'Accounts',
  '/transfers': 'Transfers',
  '/statements': 'Statements',
  '/messages': 'Messages',
  '/profile': 'Profile',
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
      <h2 class="text-lg font-semibold text-gray-800">{{ pageTitle() }}</h2>
    </header>
  `,
})
export class TopbarComponent {
  private router = inject(Router);

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => {
        const base = '/' + e.urlAfterRedirects.split('/')[1];
        return PAGE_TITLES[base] ?? 'Sixert Bank';
      }),
      startWith(PAGE_TITLES['/' + this.router.url.split('/')[1]] ?? 'Sixert Bank'),
    ),
    { initialValue: 'Sixert Bank' }
  );
}
