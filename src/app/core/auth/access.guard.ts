import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LogService } from './log.service';

export const canActivateAuth: CanActivateFn = (route, state) => {
  const logService = inject(LogService);
  const isLoggedIn = inject(AuthService).isAuth;

  if (isLoggedIn) {
    return true;
  } else {
    // Логируем неудачную попытку доступа
   logService.logAccessAttempt({
      userId: -1,
      email: null,
      targetUrl: state.url,
      timestamp: new Date(),
      userRole: 'guest'
    });
    return inject(Router).createUrlTree(['/home']);
  }
};
