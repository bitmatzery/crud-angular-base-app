import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {Theme, ThemeService} from '../../../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="themeMenu"
      matTooltip="Сменить тему"
      aria-label="Theme toggle"
      class="theme-toggle-btn"
      [class]="(appliedTheme$ | async) || 'light'"
    >
      <mat-icon>{{ getThemeIcon(currentTheme$ | async) }}</mat-icon>
    </button>

    <mat-menu #themeMenu="matMenu" class="theme-menu">
      <button
        mat-menu-item
        (click)="setTheme('light')"
        class="theme-option"
        [class.active]="(currentTheme$ | async) === 'light'"
      >
        <mat-icon>light_mode</mat-icon>
        <span>Светлая</span>
        <mat-icon *ngIf="(currentTheme$ | async) === 'light'" class="check-icon">check</mat-icon>
      </button>
      <button
        mat-menu-item
        (click)="setTheme('dark')"
        class="theme-option"
        [class.active]="(currentTheme$ | async) === 'dark'"
      >
        <mat-icon>dark_mode</mat-icon>
        <span>Темная</span>
        <mat-icon *ngIf="(currentTheme$ | async) === 'dark'" class="check-icon">check</mat-icon>
      </button>
      <button
        mat-menu-item
        (click)="setTheme('auto')"
        class="theme-option"
        [class.active]="(currentTheme$ | async) === 'auto'"
      >
        <mat-icon>brightness_auto</mat-icon>
        <span>Авто</span>
        <mat-icon *ngIf="(currentTheme$ | async) === 'auto'" class="check-icon">check</mat-icon>
      </button>
    </mat-menu>
  `,
  styles: [`
    .theme-toggle-btn {
      transition: all 0.3s ease;
      color: white;

      &:hover {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.1);
      }

      &.dark {
        color: #f3f4f6;
      }

      &.light {
        color: #374151;
      }
    }

    .theme-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;

      &.active {
        background: rgba(99, 102, 241, 0.1);

        .check-icon {
          color: #6366f1;
        }
      }
    }

    .theme-menu {
      min-width: 140px;
    }

    .check-icon {
      margin-left: auto;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  currentTheme$ = this.themeService.currentTheme$;
  appliedTheme$ = this.themeService.appliedTheme$;

  setTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  getThemeIcon(theme: Theme | null): string {
    switch (theme) {
      case 'light': return 'light_mode';
      case 'dark': return 'dark_mode';
      case 'auto': return 'brightness_auto';
      default: return 'palette';
    }
  }
}
