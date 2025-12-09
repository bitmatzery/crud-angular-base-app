import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Theme, ThemeService } from '../../../../core/theme/theme.service';
import { RouteService } from '../../../../core/routes/route.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'theme-toggle-ui',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  private themeService = inject(ThemeService);
  private routeService = inject(RouteService);

  currentTheme: Theme = 'light';
  isDashboardRoute = false;

  private themeSubscription?: Subscription;
  private routeSubscription?: Subscription;

  ngOnInit() {
    // Подписываемся на изменения темы
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    // Подписываемся на изменения роута
    this.routeSubscription = this.routeService.currentRoute$.subscribe(route => {
      this.isDashboardRoute = route.includes('/dashboard');
    });
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  getIcon(): string {
    const resolvedTheme = this.themeService.getResolvedTheme();

    if (this.currentTheme === 'auto') {
      return resolvedTheme === 'dark' ? 'dark_mode' : 'light_mode';
    }

    return this.currentTheme === 'dark' ? 'dark_mode' : 'light_mode';
  }

  getTooltip(): string {
    switch (this.currentTheme) {
      case 'dark': return 'Темная тема';
      case 'auto': return `Авто тема (системная: ${this.isSystemDark() ? 'темная' : 'светлая'})`;
      default: return 'Светлая тема';
    }
  }

  isSystemDark(): boolean {
    return this.themeService.isSystemDark();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}
