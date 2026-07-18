import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';

export interface CartItem {
  productId: number;
  quantity: number;
  addedAt: string;
}

export interface CartItemDetails {
  productId: number;
  quantity: number;
  title: string;
  price: number;
  image: string;
  description?: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly CART_COOKIE_KEY = 'AlwaysMarket_cart';
  private cookieService = inject(CookieService);
  private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.getCartFromCookies());

  cartItems$ = this.cartItemsSubject.asObservable();
  cartCount$ = this.cartItems$.pipe(
    map(items => items.reduce((sum, item) => sum + item.quantity, 0))
  );

  constructor() {
    // Восстановление корзины из Cookies
    this.initializeCart();
  }

  private initializeCart(): void {
    const savedCart = this.getCartFromCookies();
    this.cartItemsSubject.next(savedCart);
  }

  private getCartFromCookies(): CartItem[] {
    const cartJson = this.cookieService.get(this.CART_COOKIE_KEY);
    if (cartJson) {
      try {
        return JSON.parse(cartJson);
      } catch (e) {
        console.error('Error parsing cart cookie', e);
        return [];
      }
    }
    return [];
  }

  private saveCartToCookies(cartItems: CartItem[]): void {
    const cartJson = JSON.stringify(cartItems);
    // Устанавливаем куку на 30 дней с путем /
    this.cookieService.set(this.CART_COOKIE_KEY, cartJson, 30, '/');
    this.cartItemsSubject.next(cartItems);
    // Эмитируем событие для обновления в других компонентах
    window.dispatchEvent(new Event('cartUpdated'));
  }

  // Добавить товар в корзину
  addToCart(productId: number, quantity: number = 1): void {
    const currentCart = this.getCartFromCookies();
    const existingItemIndex = currentCart.findIndex(item => item.productId === productId);

    if (existingItemIndex >= 0) {
      // Увеличиваем количество существующего товара
      currentCart[existingItemIndex].quantity += quantity;
      currentCart[existingItemIndex].addedAt = new Date().toISOString();
    } else {
      currentCart.push({
        productId,
        quantity,
        addedAt: new Date().toISOString()
      });
    }

    this.saveCartToCookies(currentCart);
  }

  // Удалить товар из корзины
  removeFromCart(productId: number): void {
    const currentCart = this.getCartFromCookies();
    const updatedCart = currentCart.filter(item => item.productId !== productId);
    this.saveCartToCookies(updatedCart);
  }

  // Обновить количество товара
  updateQuantity(productId: number, quantity: number): void {
    if (quantity < 1) {
      this.removeFromCart(productId);
      return;
    }

    const currentCart = this.getCartFromCookies();
    const itemIndex = currentCart.findIndex(item => item.productId === productId);

    if (itemIndex >= 0) {
      currentCart[itemIndex].quantity = quantity;
      currentCart[itemIndex].addedAt = new Date().toISOString();
      this.saveCartToCookies(currentCart);
    }
  }

  // Получить все товары в корзине
  getCartItems(): CartItem[] {
    return this.getCartFromCookies();
  }

  // Получить количество конкретного товара
  getItemQuantity(productId: number): number {
    const cart = this.getCartFromCookies();
    const item = cart.find(i => i.productId === productId);
    return item ? item.quantity : 0;
  }

  // Проверить, есть ли товар в корзине
  isInCart(productId: number): boolean {
    return this.getItemQuantity(productId) > 0;
  }

  // Очистить корзину
  clearCart(): void {
    this.saveCartToCookies([]);
  }

  // Получить общее количество товаров
  getTotalItemsCount(): number {
    const cart = this.getCartFromCookies();
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  // Получить общую стоимость
  getTotalPrice(productsMap: Map<number, { price: number }>): number {
    const cart = this.getCartFromCookies();
    return cart.reduce((total, item) => {
      const product = productsMap.get(item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  }

  // Получить количество уникальных товаров
  getUniqueItemsCount(): number {
    return this.getCartFromCookies().length;
  }

  // Подписка на изменения корзины
  onCartUpdate(): Observable<void> {
    return new Observable(subscriber => {
      const handler = () => subscriber.next();
      window.addEventListener('cartUpdated', handler);
      return () => window.removeEventListener('cartUpdated', handler);
    });
  }
}
