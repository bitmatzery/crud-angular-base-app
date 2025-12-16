import {Component, DestroyRef, inject, OnInit, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Router} from '@angular/router';

import {CartListComponent} from '../../../../shared/common-ui/components-ui/cart-list/cart-list.component';
import {CartItemDetails, CartService} from '../../../../core/cart/cart.service';
import {ProductsService} from '../../services/data-services/products.service';
import {forkJoin} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'cart-list-container',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    CartListComponent
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './cart-list-container.component.html',
  styleUrls: ['./cart-list-container.component.scss']
})
export class CartListContainerComponent implements OnInit {
  private router = inject(Router);
  private cartService = inject(CartService);
  private productsService = inject(ProductsService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  cartItemsDetails: CartItemDetails[] = [];
  isLoading = true;
  subtotal = 0;
  shipping = 0;
  total = 0;

  ngOnInit(): void {
    this.loadCartItems();

    // Подписываемся на обновления корзины с автоматической отпиской
    this.cartService.onCartUpdate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadCartItems();
      });
  }

  private loadCartItems(): void {
    this.isLoading = true;
    const cartItems = this.cartService.getCartItems();

    if (cartItems.length === 0) {
      this.cartItemsDetails = [];
      this.calculateTotals();
      this.isLoading = false;
      return;
    }

    // Загружаем информацию о продуктах с автоматической отпиской
    const productObservables = cartItems.map(item =>
      this.productsService.getProductById(item.productId).pipe(
        map(product => ({
          item,
          product
        }))
      )
    );

    forkJoin(productObservables)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          this.cartItemsDetails = results
            .filter(({product}) => product !== null)
            .map(({item, product}) => ({
              productId: item.productId,
              quantity: item.quantity,
              title: product!.title || 'Неизвестный товар',
              price: product!.price || 0,
              image: product!.images?.[0] || 'assets/images/svg/placeholder.svg',
              description: product!.description,
              category: product!.category?.name
            }));

          this.calculateTotals();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading cart products:', error);
          this.snackBar.open('Ошибка при загрузке товаров', 'Закрыть', {duration: 3000});
          this.isLoading = false;
        }
      });
  }

  private calculateTotals(): void {
    this.subtotal = this.cartItemsDetails.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // Бесплатная доставка от $ 1000
    this.shipping = this.subtotal >= 1000 ? 0 : 100;
    this.total = this.subtotal + this.shipping;
  }

  // Методы для обработки событий от дочернего компонента
  onUpdateQuantity(event: { productId: number; quantity: number }): void {
    this.cartService.updateQuantity(event.productId, event.quantity);
    this.snackBar.open('Количество обновлено', 'OK', {duration: 2000});
  }

  onRemoveItem(productId: number): void {
    this.cartService.removeFromCart(productId);
    this.snackBar.open('Товар удален из корзины', 'OK', {duration: 2000});
  }

  onClearCart(): void {
    this.cartService.clearCart();
    this.snackBar.open('Корзина очищена', 'OK', {duration: 2000});
  }

  onProceedToCheckout(): void {
    if (this.cartItemsDetails.length === 0) {
      this.snackBar.open('Корзина пуста', 'OK', {duration: 2000});
      return;
    }

    this.snackBar.open('Функция оформления заказа в разработке', 'OK', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  onContinueShopping(): void {
    this.router.navigate(['/products']);
    console.log('Продолжить покупки');
  }
}
