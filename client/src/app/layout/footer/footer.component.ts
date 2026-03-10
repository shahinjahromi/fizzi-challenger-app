import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'szb-footer',
  standalone: true,
  imports: [DatePipe],
  template: `
    <footer class="footer" role="contentinfo">
      <div class="footer-inner">
        <span class="copyright">© {{ now | date:'yyyy' }} Fizzi Challenger Bank. Member FDIC.</span>
        <nav class="footer-links" aria-label="Footer links">
          <a href="#" class="footer-link">Privacy Policy</a>
          <a href="#" class="footer-link">Terms of Use</a>
          <a href="#" class="footer-link">FDIC Notice</a>
          <a href="#" class="footer-link">Accessibility</a>
        </nav>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      height: 48px;
      background: var(--color-white);
      border-top: 1px solid var(--color-border);
      display: flex; align-items: center;
    }
    .footer-inner {
      display: flex; align-items: center; justify-content: space-between;
      max-width: 1400px; margin: 0 auto;
      padding: 0 24px; width: 100%;
    }
    .copyright { font-size: 12px; color: var(--color-text-muted); }
    .footer-links { display: flex; gap: 16px; }
    .footer-link { font-size: 12px; color: var(--color-text-muted); }
    .footer-link:hover { color: var(--color-primary); }
  `],
})
export class FooterComponent {
  now = new Date();
}
