import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ApiService } from '../http/api.service';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';
import { LoginPayload, TokenResponse, UserDTO } from './auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  apiService = inject(ApiService);
  http = inject(HttpClient);
  router = inject(Router);
  cookieService = inject(CookieService);
  authApiUrl = '/auth/login';
  baseApiUrl = 'https://api.escuelajs.co/api/v1/auth/';

  token: string | null = null;
  refreshToken: string | null = null;

  private isAuthSubject = new BehaviorSubject<boolean>(false);
  private userEmailSubject = new BehaviorSubject<string | null>(null);
  private userRoleSubject = new BehaviorSubject<string | null>(null); // Добавлено

  isAuth$ = this.isAuthSubject.asObservable();
  userEmail$ = this.userEmailSubject.asObservable();
  userRole$ = this.userRoleSubject.asObservable(); // Добавлено

  constructor() {
    // Проверяем начальное состояние авторизации
    this.checkInitialAuth();
  }

  private checkInitialAuth() {
    const token = this.cookieService.get('token');
    const email = this.cookieService.get('userEmail');
    const role = this.cookieService.get('userRole'); // Добавлено

    this.isAuthSubject.next(!!token);
    this.userEmailSubject.next(email || null);
    this.userRoleSubject.next(role || null); // Добавлено
  }

  get isAuth() {
    if (!this.token) {
      this.token = this.cookieService.get('token');
      this.refreshToken = this.cookieService.get('refreshToken');
    }

    return !!this.token;
  }

  getMe() {
    return this.http.get<UserDTO>(`${this.baseApiUrl}profile`)
      .pipe(
        tap(profile => {
          console.log('profile.role = ', profile.role);
          this.userRoleSubject.next(profile.role); // Сохраняем роль
          this.cookieService.set('userRole', profile.role); // Сохраняем в cookie
        }),
      );
  }

  login(payload: LoginPayload) {
    // Отправляем данные как JSON объект
    return this.apiService
      .post<TokenResponse, LoginPayload>(`${this.authApiUrl}`, payload)
      .pipe(
        tap((response) => {
          this.saveTokens(response); // Сохраняем токены
          this.isAuthSubject.next(true); // Устанавливаем состояние авторизации в true
          this.userEmailSubject.next(payload.email); // Сохраняем email пользователя
          this.cookieService.set('userEmail', payload.email); // Сохраняем email в Cookie
          console.log('User logged in:', payload.email);

          // Получаем данные пользователя для получения роли
          this.getMe().subscribe();
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error); // Обработка ошибок авторизации
        })
      );
  }

  refreshAuthToken() {
    return this.http
      .post<TokenResponse>(`${this.baseApiUrl}refresh-token`, {
        refresh_token: this.refreshToken,
      })
      .pipe(
        tap((val) => this.saveTokens(val)),
        catchError((err) => {
          this.logout();
          return throwError(err);
        })
      );
  }

  logout() {
    this.cookieService.deleteAll();
    this.token = null;
    this.refreshToken = null;
    this.isAuthSubject.next(false);
    this.userEmailSubject.next(null); // Очищаем email
    this.userRoleSubject.next(null); // Очищаем роль
    // Переходим на страницу входа
    this.router.navigate(['/home']).then(() => {
      console.log(
        'Logout выполнен:',
        'isAuthSubject = ', this.isAuthSubject.value,
        'userEmailSubject = ', this.userEmailSubject.value,
        'userRoleSubject = ', this.userRoleSubject.value,
        'cookieService.token = ', this.cookieService.get('token'),
        'cookieService.userEmail = ', this.cookieService.get('userEmail')
      );
    });
  }

  saveTokens(res: TokenResponse) {
    console.log('Saving tokens:', res);
    this.token = res.access_token;
    this.refreshToken = res.refresh_token;

    this.cookieService.set('token', this.token);
    this.cookieService.set('refreshToken', this.refreshToken);
  }
}
