import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import {Theme, ThemeService} from '../../../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
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
export class ThemeToggleComponent implements OnInit {
  private themeService = inject(ThemeService);
  currentTheme: Theme = 'light';

  ngOnInit() {
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
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
}
