import { Injectable, inject, Renderer2, RendererFactory2, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
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
  private mediaQueryListener: (() => void) | null = null;

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
    this.applyThemeToElements(theme);
    this.cookieService.set('theme', theme, {
      path: '/',
      sameSite: 'Strict',
      secure: window.location.protocol === 'https:'
    });
    this.updateTailwindDarkClass(theme);
  }

  private applyThemeToElements(theme: Theme): void {
    const appRoot = document.querySelector('app-root');
    // Работаем и с body, и с app-root (для обратной совместимости)
    const elementsToUpdate = [appRoot, document.body].filter(el => el !== null);

    if (elementsToUpdate.length === 0) return;

    // Удаляем все тематические классы со всех элементов
    elementsToUpdate.forEach(el => {
      this.renderer.removeClass(el, 'light-theme');
      this.renderer.removeClass(el, 'dark-theme');
      this.renderer.removeClass(el, 'auto-theme');
    });

    if (this.mediaQuerySubscription) {
      this.mediaQuery.removeEventListener('change', () => this.handleSystemThemeChange());
      this.mediaQuerySubscription.unsubscribe();
    }

    if (theme === 'auto') {
      elementsToUpdate.forEach(el => {
        this.renderer.addClass(el, 'auto-theme');
      });
      this.mediaQueryListener = () => this.updateTailwindDarkClass('auto');
      // Добавляем слушатель для изменений системной темы
      this.mediaQuery.addEventListener('change', () => this.handleSystemThemeChange());
    } else {
      elementsToUpdate.forEach(el => {
        this.renderer.addClass(el, theme + '-theme');
      });
    }
  }

  // Обновление класса dark на html для Tailwind
  private updateTailwindDarkClass(theme: Theme): void {
    const html = document.documentElement;
    const shouldBeDark = theme === 'dark' || (theme === 'auto' && this.mediaQuery.matches);
    if (shouldBeDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
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
