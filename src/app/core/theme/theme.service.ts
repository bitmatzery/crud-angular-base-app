import { Injectable, inject, Renderer2, RendererFactory2, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  cookieService = inject(CookieService);
  private renderer: Renderer2;
  private currentThemeSubject = new BehaviorSubject<Theme>('light');
  public currentTheme$ = this.currentThemeSubject.asObservable();
  private mediaQuery: MediaQueryList;
  private mediaQuerySubscription?: Subscription;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.loadInitialTheme();
  }

  private loadInitialTheme(): void {
    const savedTheme = this.cookieService.get('theme') as Theme;

    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('auto');
    }
  }

  setTheme(theme: Theme): void {
    this.currentThemeSubject.next(theme);
    this.applyThemeToAppRoot(theme);
    this.cookieService.set('theme', theme, {
      path: '/',
      sameSite: 'Strict',
      secure: window.location.protocol === 'https:'
    });
  }

  private applyThemeToAppRoot(theme: Theme): void {
    const appRoot = document.querySelector('app-root');
    if (!appRoot) return;

    // Удаляем все тематические классы
    this.renderer.removeClass(appRoot, 'light-theme');
    this.renderer.removeClass(appRoot, 'dark-theme');
    this.renderer.removeClass(appRoot, 'auto-theme');

    if (this.mediaQuerySubscription) {
      this.mediaQuery.removeEventListener('change', () => this.handleSystemThemeChange());
      this.mediaQuerySubscription.unsubscribe();
    }

    if (theme === 'auto') {
      this.renderer.addClass(appRoot, 'auto-theme');
      // Добавляем слушатель для изменений системной темы
      this.mediaQuery.addEventListener('change', () => this.handleSystemThemeChange());
    } else {
      this.renderer.addClass(appRoot, theme + '-theme');
    }
  }

  private handleSystemThemeChange(): void {
    if (this.currentThemeSubject.value === 'auto') {
      // Просто уведомляем подписчиков, что нужно пересчитать resolved theme
      this.currentThemeSubject.next('auto');
    }
  }

  toggleTheme(): void {
    const current = this.currentThemeSubject.value;
    const themes: Theme[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  getResolvedTheme(): 'light' | 'dark' {
    const current = this.currentThemeSubject.value;

    if (current === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }

    return current;
  }

  isSystemDark(): boolean {
    return this.mediaQuery.matches;
  }

  ngOnDestroy(): void {
    if (this.mediaQuerySubscription) {
      this.mediaQuerySubscription.unsubscribe();
    }
  }
}
