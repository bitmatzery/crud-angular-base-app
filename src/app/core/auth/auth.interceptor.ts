import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { AuthService } from './auth.service';

let isRefreshing$ = new BehaviorSubject<boolean>(false);

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Interceptor called for URL:', req.url);

  const authService = inject(AuthService);
  const token = authService.token;

  console.log('Token in interceptor:', token);

  if (!token) return next(req);

  if (isRefreshing$.value) {
    return refreshAndProceed(authService, req, next);
  }

  return next(addToken(req, token)).pipe(
    catchError((error) => {
      if (error.status === 401) {
        return refreshAndProceed(authService, req, next);
      }

      return throwError(error);
    })
  );
};

const refreshAndProceed = (
  authService: AuthService,
  req: HttpRequest<any>,
  next: HttpHandlerFn
) => {
  if (!isRefreshing$.value) {
    isRefreshing$.next(true);
    return authService.refreshAuthToken().pipe(
      switchMap((res) => {
        return next(addToken(req, res.access_token)).pipe(
          tap(() => isRefreshing$.next(false))
        );
      })
    );
  }

  if (req.url.includes('refresh'))
    return next(addToken(req, authService.token!));

  return isRefreshing$.pipe(
    filter((isRefreshing) => !isRefreshing),
    switchMap((res) => {
      return next(addToken(req, authService.token!));
    })
  );
};

const addToken = (req: HttpRequest<any>, token: string) => {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
};
