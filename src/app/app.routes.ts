import { Routes } from '@angular/router';
import { canActivateAuth } from './core/auth/access.guard';
import { adminGuard } from './core/auth/admin.guard';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('@store/home').then(c => c.HomeComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('@store/products').then(c => c.ProductsListContainerComponent),
    data: { displayType: 'products' },
    canActivate: [canActivateAuth],
  },
  {
    path: 'categories',
    loadComponent: () => import('@store/products').then(c => c.ProductsListContainerComponent),
    data: { displayType: 'categories' }
  },
  {
    path: 'users',
    loadComponent: () => import('@store/users').then(c => c.UsersListContainerComponent),
    canActivate: [canActivateAuth, adminGuard],
  },
];
