import { Injectable, inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { CartItemDetails } from './cart.service';

export interface Order {
  id: string;
  date: string;
  items: Omit<CartItemDetails, 'description' | 'category'>[]; // храним минимум
  total: number;
  status: 'completed' | 'processing' | 'cancelled';
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly ORDERS_COOKIE_KEY = 'AlwaysMarket_orders';
  private cookieService = inject(CookieService);

  getOrders(): Order[] {
    const ordersJson = this.cookieService.get(this.ORDERS_COOKIE_KEY);
    if (ordersJson) {
      try {
        return JSON.parse(ordersJson);
      } catch (e) {
        console.error('Error parsing orders cookie', e);
        return [];
      }
    }
    return [];
  }

  addOrder(order: Omit<Order, 'id' | 'date'>): void {
    const orders = this.getOrders();
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    orders.unshift(newOrder);
    // Оставляем только последние 10 заказов в год (для экономии места)
    const trimmedOrders = orders.slice(0, 10);
    this.cookieService.set(this.ORDERS_COOKIE_KEY, JSON.stringify(trimmedOrders), 365, '/');
  }

  getLastOrders(limit: number = 3): Order[] {
    return this.getOrders().slice(0, limit);
  }

  clearOrders(): void {
    this.cookieService.delete(this.ORDERS_COOKIE_KEY, '/');
  }
}
