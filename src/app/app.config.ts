import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import {provideRouter, withEnabledBlockingInitialNavigation} from '@angular/router';

import { appRoutes } from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authTokenInterceptor} from './core/auth/auth.interceptor';
import {API_URL} from './core/http/api-url.token';
import {environment} from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    {
      provide: API_URL,
      useValue: environment.api_url,
    },
  ]
};
