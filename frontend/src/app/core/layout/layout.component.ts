import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly breakpoint = inject(BreakpointObserver);

  protected readonly isMobile = signal(false);
  protected readonly menuOpen = signal(true);
  protected readonly navItems = [
    { label: 'Panel', route: '/dashboard', icon: 'dashboard', adminOnly: false },
    { label: 'Escaneos', route: '/scans', icon: 'radar', adminOnly: false },
    { label: 'Resultados', route: '/results', icon: 'fact_check', adminOnly: false },
    { label: 'Usuarios', route: '/admin/users', icon: 'manage_accounts', adminOnly: true },
  ];

  constructor() {
    this.breakpoint
      .observe('(max-width: 899px)')
      .pipe(takeUntilDestroyed())
      .subscribe(({ matches }) => {
        this.isMobile.set(matches);
        this.menuOpen.set(!matches);
      });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenuOnMobile(): void {
    if (this.isMobile()) {
      this.menuOpen.set(false);
    }
  }

  logout(): void {
    this.closeMenuOnMobile();
    this.auth.logout();
  }
}
