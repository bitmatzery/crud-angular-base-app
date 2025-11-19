import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, distinctUntilChanged, startWith } from 'rxjs/operators';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);

  private themeSubject = new BehaviorSubject<Theme>(this.getInitialTheme());
  public currentTheme$: Observable<Theme> = this.themeSubject.asObservable();

  // Observable для примененной темы (с учетом auto)
  public appliedTheme$: Observable<'light' | 'dark'> = this.currentTheme$.pipe(
    map(theme => this.getAppliedTheme(theme)),
    distinctUntilChanged()
  );

  constructor() {
    // Следим за системными настройками для авто-темы
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      fromEvent<MediaQueryListEvent>(mediaQuery, 'change')
        .pipe(
          map(event => event.matches ? 'dark' : 'light'),
          startWith(mediaQuery.matches ? 'dark' : 'light'),
          distinctUntilChanged()
        )
        .subscribe(() => {
          if (this.themeSubject.value === 'auto') {
            this.applyTheme('auto');
          }
        });
    }
  }

  private getInitialTheme(): Theme {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'auto';
  }

  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    const html = this.document.documentElement;

    // Удаляем все классы тем
    html.classList.remove('light-theme', 'dark-theme', 'auto-theme');

    if (theme === 'auto') {
      // Определяем системную тему
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.add(isDark ? 'dark-theme' : 'light-theme');
      html.classList.add('auto-theme');
    } else {
      html.classList.add(`${theme}-theme`);
    }

    // Обновляем meta theme-color для мобильных браузеров
    this.updateThemeColor(theme);
  }

  private updateThemeColor(theme: Theme): void {
    const themeColorMeta = this.document.querySelector('meta[name="theme-color"]');
    let color = '#6366f1'; // По умолчанию

    const appliedTheme = this.getAppliedTheme(theme);
    if (appliedTheme === 'dark') {
      color = '#1f2937';
    } else {
      color = '#6366f1';
    }

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', color);
    } else {
      // Создаем meta тег если его нет
      const meta = this.document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      this.document.head.appendChild(meta);
    }
  }

  private getAppliedTheme(theme: Theme): 'light' | 'dark' {
    if (theme === 'auto') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme as 'light' | 'dark';
  }

  toggleTheme(): void {
    const themes: Theme[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.themeSubject.value);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }
}
