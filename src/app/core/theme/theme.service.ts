import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  cookieService = inject(CookieService);
  private currentTheme = new BehaviorSubject<Theme>('light');
  public currentTheme$ = this.currentTheme.asObservable();
  private mediaQuery: MediaQueryList;

  constructor() {
    // Слушаем изменения системной темы
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));

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

  private handleSystemThemeChange(event: MediaQueryListEvent): void {
    if (this.currentTheme.value === 'auto') {
      this.applyThemeToBody('auto');
    }
  }

  setTheme(theme: Theme): void {
    this.currentTheme.next(theme);
    this.applyThemeToBody(theme);
    this.cookieService.set('theme', theme);
  }

  private applyThemeToBody(theme: Theme): void {
    // Удаляем все тематические классы
    document.body.classList.remove('light-theme', 'dark-theme', 'auto-theme');

    if (theme === 'auto') {
      document.body.classList.add('auto-theme');
    } else {
      document.body.classList.add(theme + '-theme');
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

  // Метод для получения актуальной темы (для автотемы возвращает системную)
  getResolvedTheme(): 'light' | 'dark' {
    const current = this.currentTheme.value;

    if (current === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }

    return current;
  }

  // Проверка, использует ли система темную тему
  isSystemDark(): boolean {
    return this.mediaQuery.matches;
  }
}
