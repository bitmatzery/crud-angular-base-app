import { Injectable, inject, Renderer2, RendererFactory2, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable, filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private router = inject(Router);
  private renderer: Renderer2;
  private currentRouteSubject = new BehaviorSubject<string>('');
  public currentRoute$ = this.currentRouteSubject.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.setupRouteTracking();
  }

  private setupRouteTracking(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        this.updateRouteClass(url);
        this.currentRouteSubject.next(url);
      });

    // Инициализируем текущий роут
    this.updateRouteClass(this.router.url);
    this.currentRouteSubject.next(this.router.url);
  }

  private updateRouteClass(url: string): void {
    const appRoot = document.querySelector('app-root');
    if (!appRoot) return;

    // Удаляем все route-классы
    this.renderer.removeClass(appRoot, 'dashboard-route');
    this.renderer.removeClass(appRoot, 'home-route');
    this.renderer.removeClass(appRoot, 'products-route');
    this.renderer.removeClass(appRoot, 'users-route');

    // Добавляем соответствующий класс
    if (url.includes('/dashboard')) {
      this.renderer.addClass(appRoot, 'dashboard-route');
    } else if (url === '/home' || url === '/') {
      this.renderer.addClass(appRoot, 'home-route');
    } else if (url.includes('/products')) {
      this.renderer.addClass(appRoot, 'products-route');
    } else if (url.includes('/users')) {
      this.renderer.addClass(appRoot, 'users-route');
    }
  }

  getCurrentRoute(): string {
    return this.currentRouteSubject.value;
  }

  isDashboard(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      const sub = this.currentRoute$.subscribe(route => {
        observer.next(route.includes('/dashboard'));
      });
      return () => sub.unsubscribe();
    });
  }
}
