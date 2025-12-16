import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {AsyncPipe, CommonModule, TitleCasePipe} from '@angular/common';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDividerModule} from '@angular/material/divider';
import {MatBadgeModule} from '@angular/material/badge';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../../../core/auth/auth.service';
import {AccessAttemptLog, LogService} from '../../../../core/auth/log.service';
import {HeaderSearchComponent} from '../header-search/header-search.component';
import {ThemeToggleComponent} from '../theme-toggle/theme-toggle.component';
import {LogoComponent} from '../logo/logo.component';
import {ProductsService} from '../../../../modules/products/services/data-services/products.service';
import {IProduct} from '../../../../modules/products/models/product.interface';
import {CartService} from '../../../../core/cart/cart.service';
import {Observable, Subscription} from 'rxjs';

@Component({
  selector: 'header-navbar-ui',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    AsyncPipe,
    HeaderSearchComponent,
    ThemeToggleComponent,
    MatTooltipModule,
    LogoComponent,
    MatMenuModule,
    MatDividerModule,
    TitleCasePipe,
    MatBadgeModule
  ],
  templateUrl: './header-navbar.component.html',
  styleUrls: ['./header-navbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderNavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  logService = inject(LogService);
  cartService = inject(CartService);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private cdr = inject(ChangeDetectorRef);

  isLoggedIn$ = this.authService.isAuth$;
  userEmail$ = this.authService.userEmail$;
  userRole$: Observable<string | null> = this.authService.userRole$;
  showLogs = false;

  cartItemsCount = 0;
  private cartSubscription?: Subscription;

  form = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', [Validators.required])
  });

  ngOnInit() {
    const accessLogs = this.logService.getLogs();
    this.logService.printLogs();

    // Подписываемся на изменения корзины
    this.cartSubscription = this.cartService.cartCount$.subscribe(count => {
      this.cartItemsCount = count;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }

  formatLogEntry(log: AccessAttemptLog): string {
    return `${log.email || 'Guest'} tried to access ${log.targetUrl} at ${new Date(log.timestamp).toLocaleString()}`;
  }

  onSubmit() {
    if (this.form.valid) {
      const credentials = {
        email: this.form.value.email ?? '',
        password: this.form.value.password ?? ''
      };

      this.authService.login(credentials).subscribe({
        next: () => {
          this.form.reset();
        },
        error: (error) => {
          console.error('Login failed:', error);
        }
      });
    }
  }

  onLogout() {
    this.authService.logout();
  }

  // Перейти в корзину
  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  // Обработка поиска из хедера
  onSearch(searchTerm: string): void {
    console.log('Search from header:', searchTerm);

    if (searchTerm.length > 2) {
      this.productsService.searchProducts(searchTerm);
    } else if (!searchTerm) {
      this.productsService.clearAllFilters();
    }

    if (this.router.url.includes('/products')) {
      this.router.navigate([], {
        queryParams: {search: searchTerm || null},
        queryParamsHandling: 'merge'
      });
    } else if (searchTerm) {
      this.router.navigate(['/products'], {
        queryParams: {search: searchTerm}
      });
    }
  }

  // Обработка выбора продукта из поиска
  onSearchProduct(product: IProduct): void {
    console.log('Product selected from search:', product);
    this.router.navigate(['/products', product.id]);
  }
}
