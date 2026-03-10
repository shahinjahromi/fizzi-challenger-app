import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'szb-footer',
  standalone: true,
  imports: [DatePipe],
  template: `
    <footer class="footer" role="contentinfo">
      <div class="footer-inner">
        <div class="footer-left">
          <span class="fdic-badge">FDIC</span>
          <span class="copyright">© {{ now | date:'yyyy' }} Fizzi Challenger Bank. Member FDIC.</span>
        </div>
        <nav class="footer-links" aria-label="Footer links">
          <a href="#" class="footer-link">Privacy Policy</a>
          <span class="footer-divider" aria-hidden="true">·</span>
          <a href="#" class="footer-link">Terms of Use</a>
          <span class="footer-divider" aria-hidden="true">·</span>
          <a href="#" class="footer-link">FDIC Notice</a>
          <span class="footer-divider" aria-hidden="true">·</span>
          <a href="#" class="footer-link">Accessibility</a>
        </nav>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      height: 56px;
      background: #ffffff;
      border-top: 1px solid #dde3ed;
      display: flex; align-items: center;
    }
    .footer-inner {
      display: flex; align-items: center; justify-content: space-between;
      max-width: 1400px; margin: 0 auto;
      padding: 0 24px; width: 100%;
    }
    .footer-left { display: flex; align-items: center; gap: 0; }
    .fdic-badge {
      display: inline-flex; align-items: center; justify-content: center;
      border: 1.5px solid #5a6a7e; border-radius: 4px;
      font-size: 10px; font-weight: 700; color: #5a6a7e;
      padding: 1px 5px; letter-spacing: 0.05em; margin-right: 8px;
    }
    .copyright { font-size: 12px; color: #8b9ab0; }
    .footer-links { display: flex; align-items: center; gap: 8px; }
    .footer-link { font-size: 12px; color: #5a6a7e; text-decoration: none; }
    .footer-link:hover { color: #003087; }
    .footer-divider { font-size: 12px; color: #8b9ab0; }
  `],
})
export class FooterComponent {
  now = new Date();
}
