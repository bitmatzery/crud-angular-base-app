import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { map, catchError, of } from 'rxjs';
import { LogService } from './log.service';

const ADMIN_ROLE = 'admin' as const;
const DEFAULT_REDIRECT = '/home' as const;

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const logService = inject(LogService);

  const section = route.queryParams['section'] || 'default';

  // Вспомогательная функция для создания redirect URL
  const createRedirect = (path: string = DEFAULT_REDIRECT) =>
    router.createUrlTree([path]);

  // Проверка наличия токена
  if (!authService.token) {
    console.warn('No auth token found');
    // Логируем попытку неавторизованного доступа
    logService.logAccessAttempt({
      userId: -1,
      email: null,
      targetUrl: state.url,
      timestamp: new Date(),
      userRole: 'guest'
    });
    return createRedirect();
  }

  return authService.getMe().pipe(
    map((user) => {
      const isAdmin = user.role === ADMIN_ROLE;

      if (isAdmin) {
        console.log(`Admin access granted for ${user.email}`);
        return true;
      }
      // Логируем неудачную попытку доступа
      logService.logAccessAttempt({
        userId: user.id,
        email: user.email,
        targetUrl: state.url,
        timestamp: new Date(),
        userRole: user.role
      });

      // Можно добавить различные пути редиректа в зависимости от роли
      const redirectPath = user.role === 'user'
        ? '/access-denied'
        : '/home';

      console.warn(`Access denied for user ${user.email} with role ${user.role}`);

      return router.createUrlTree([redirectPath], {
        queryParams: {
          message: 'Admin access required',
          attempted: state.url
        }
      });

      // return createRedirect();
    }),
    catchError((error) => {
      console.error('Admin guard error:', error);

// Логируем ошибку аутентификации
      logService.logAccessAttempt({
        userId: -1,
        email: null,
        targetUrl: state.url,
        timestamp: new Date(),
        userRole: 'unauthorized'
      });

      return of(createRedirect());
    })
  );
};
