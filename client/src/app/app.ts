import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { filter, map } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { HeaderComponent } from './layout/header/header.component';
import { NavComponent } from './layout/nav/nav.component';
import { FooterComponent } from './layout/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, NgIf, HeaderComponent, NavComponent, FooterComponent],
  template: `
    <ng-container *ngIf="showShell$ | async; else bare">
      <szb-header [menuOpen]="menuOpen" (menuToggle)="toggleMenu()"></szb-header>
      <div class="app-body">
        <div class="nav-overlay" *ngIf="menuOpen" (click)="closeMenu()" aria-hidden="true"></div>
        <szb-nav [menuOpen]="menuOpen" (navClose)="closeMenu()"></szb-nav>
        <main class="app-main" id="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
      <szb-footer></szb-footer>
    </ng-container>

    <ng-template #bare>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .app-body {
      display: flex;
      min-height: calc(100vh - var(--header-height) - 56px);
      position: relative;
    }
    .app-main {
      flex: 1;
      padding: 24px;
      overflow: auto;
      min-width: 0;
    }
    @media (max-width: 767px) {
      .app-main { padding: 16px; }
    }
  `],
})
export class AppComponent implements OnInit {
  menuOpen = false;

  showShell$ = this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    map((e) => !e.urlAfterRedirects.startsWith('/login') && this.auth.isAuthenticated())
  );

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Nothing to restore here since we keep accessToken in memory only
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }
}
