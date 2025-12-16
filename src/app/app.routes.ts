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
  },
  {
    path: 'categories',
    loadComponent: () => import('@store/products').then(c => c.ProductsListContainerComponent),
    data: { displayType: 'categories' }
  },
  {
    path: 'cart',
    loadComponent: () => import('@store/cart').then(c => c.CartListContainerComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('@store/users').then(c => c.UsersListContainerComponent),
    canActivate: [canActivateAuth, adminGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('@store/dashboard').then(c => c.DashboardContainerComponent),
    canActivate: [canActivateAuth, adminGuard],
  },
  {
    path: 'dashboard/products',
    loadComponent: () => import('@store/dashboard/products').then(c => c.DashboardProductsComponent),
    canActivate: [canActivateAuth, adminGuard],
  },
  {
    path: 'dashboard/users',
    loadComponent: () => import('@store/users').then(c => c.UsersListContainerComponent),
    canActivate: [canActivateAuth, adminGuard],
  },
];
