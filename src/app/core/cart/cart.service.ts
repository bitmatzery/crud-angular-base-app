import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

export interface CartItem {
  productId: number;
  quantity: number;
  addedAt: Date;
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

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_STORAGE_KEY = 'AlwaysMarket_cart';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.getCartFromStorage());

  cartItems$ = this.cartItemsSubject.asObservable();
  cartCount$ = this.cartItems$.pipe(
    map(items => items.reduce((sum, item) => sum + item.quantity, 0))
  );

  constructor() {
    // Восстановление корзины из localStorage
    this.initializeCart();
  }

  private initializeCart(): void {
    const savedCart = this.getCartFromStorage();
    this.cartItemsSubject.next(savedCart);
  }

  private getCartFromStorage(): CartItem[] {
    try {
      const cartJson = localStorage.getItem(this.CART_STORAGE_KEY);
      return cartJson ? JSON.parse(cartJson) : [];
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
      return [];
    }
  }

  private saveCartToStorage(cartItems: CartItem[]): void {
    try {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cartItems));
      this.cartItemsSubject.next(cartItems);
      // Эмитируем событие для обновления в других компонентах
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  // Добавить товар в корзину
  addToCart(productId: number, quantity: number = 1): void {
    const currentCart = this.getCartFromStorage();
    const existingItemIndex = currentCart.findIndex(item => item.productId === productId);

    if (existingItemIndex >= 0) {
      // Увеличиваем количество существующего товара
      currentCart[existingItemIndex].quantity += quantity;
      currentCart[existingItemIndex].addedAt = new Date();
    } else {
      // Добавляем новый товар
      currentCart.push({
        productId,
        quantity,
        addedAt: new Date()
      });
    }

    this.saveCartToStorage(currentCart);
  }

  // Удалить товар из корзины
  removeFromCart(productId: number): void {
    const currentCart = this.getCartFromStorage();
    const updatedCart = currentCart.filter(item => item.productId !== productId);
    this.saveCartToStorage(updatedCart);
  }

  // Обновить количество товара
  updateQuantity(productId: number, quantity: number): void {
    if (quantity < 1) {
      this.removeFromCart(productId);
      return;
    }

    const currentCart = this.getCartFromStorage();
    const itemIndex = currentCart.findIndex(item => item.productId === productId);

    if (itemIndex >= 0) {
      currentCart[itemIndex].quantity = quantity;
      currentCart[itemIndex].addedAt = new Date();
      this.saveCartToStorage(currentCart);
    }
  }

  // Получить все товары в корзине
  getCartItems(): CartItem[] {
    return this.getCartFromStorage();
  }

  // Получить количество конкретного товара
  getItemQuantity(productId: number): number {
    const cart = this.getCartFromStorage();
    const item = cart.find(i => i.productId === productId);
    return item ? item.quantity : 0;
  }

  // Проверить, есть ли товар в корзине
  isInCart(productId: number): boolean {
    return this.getItemQuantity(productId) > 0;
  }

  // Очистить корзину
  clearCart(): void {
    this.saveCartToStorage([]);
  }

  // Получить общее количество товаров
  getTotalItemsCount(): number {
    const cart = this.getCartFromStorage();
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  // Получить общую стоимость (нужен сервис продуктов для расчета)
  getTotalPrice(productsMap: Map<number, { price: number }>): number {
    const cart = this.getCartFromStorage();
    return cart.reduce((total, item) => {
      const product = productsMap.get(item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  }

  // Получить количество уникальных товаров
  getUniqueItemsCount(): number {
    return this.getCartFromStorage().length;
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
