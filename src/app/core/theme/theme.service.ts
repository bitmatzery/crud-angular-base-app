import { Injectable, inject, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  cookieService = inject(CookieService);
  private renderer: Renderer2;
  private currentTheme = new BehaviorSubject<Theme>('light');
  public currentTheme$ = this.currentTheme.asObservable();
  private mediaQuery: MediaQueryList;
  private darkModeListener?: (event: MediaQueryListEvent) => void;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    this.loadInitialTheme();
  }

  private loadInitialTheme(): void {
    const savedTheme = this.cookieService.get('theme') as Theme;

    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Если нет сохраненной темы, используем системную
      this.setTheme('auto');
    }
  }

  setTheme(theme: Theme): void {
    this.currentTheme.next(theme);
    this.applyThemeToAppRoot(theme);
    this.cookieService.set('theme', theme, {
      path: '/',
      sameSite: 'Strict',
      secure: window.location.protocol === 'https:'
    });
  }

  private applyThemeToAppRoot(theme: Theme): void {
    // Находим app-root элемент
    const appRoot = document.querySelector('app-root');
    if (!appRoot) return;

    // Удаляем все тематические классы
    this.renderer.removeClass(appRoot, 'light-theme');
    this.renderer.removeClass(appRoot, 'dark-theme');
    this.renderer.removeClass(appRoot, 'auto-theme'); // Для отслеживания системной темы

    // Удаляем слушатель, если он был
    this.removeSystemThemeListener();

    if (theme === 'auto') {
      this.renderer.addClass(appRoot, 'auto-theme');

      // Применяем текущую системную тему
      this.applySystemTheme();

      // Устанавливаем слушатель для изменений системной темы
      this.setupSystemThemeListener();
    } else {
      this.renderer.addClass(appRoot, theme + '-theme');
    }
  }

  private applySystemTheme(): void {
    const appRoot = document.querySelector('app-root');
    if (!appRoot) return;

    if (this.mediaQuery.matches) {
      this.renderer.addClass(appRoot, 'system-dark');
    } else {
      this.renderer.removeClass(appRoot, 'system-dark');
    }
  }

  private setupSystemThemeListener(): void {
    this.darkModeListener = (event: MediaQueryListEvent) => {
      if (this.currentTheme.value === 'auto') {
        this.applySystemTheme();
      }
    };

    this.mediaQuery.addEventListener('change', this.darkModeListener);
  }

  private removeSystemThemeListener(): void {
    if (this.darkModeListener) {
      this.mediaQuery.removeEventListener('change', this.darkModeListener);
      this.darkModeListener = undefined;
    }
  }

  toggleTheme(): void {
    const current = this.currentTheme.value;
    const themes: Theme[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  getCurrentTheme(): Theme {
    return this.currentTheme.value;
  }

  getResolvedTheme(): 'light' | 'dark' {
    const current = this.currentTheme.value;

    if (current === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }

    return current;
  }

  isSystemDark(): boolean {
    return this.mediaQuery.matches;
  }

  ngOnDestroy(): void {
    this.removeSystemThemeListener();
  }
}
