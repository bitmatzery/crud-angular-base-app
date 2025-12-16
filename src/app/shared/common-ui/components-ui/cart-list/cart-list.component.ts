import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {CartItemDetails} from '../../../../core/cart/cart.service';
import {MatTooltipModule} from '@angular/material/tooltip';


@Component({
  selector: 'cart-list-ui',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatTooltipModule
  ],
  templateUrl: './cart-list.component.html',
  styleUrls: ['./cart-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartListComponent {
  @Input() cartItems: CartItemDetails[] = [];
  @Input() subtotal: number = 0;
  @Input() shipping: number = 0;
  @Input() total: number = 0;

  @Output() updateQuantity = new EventEmitter<{ productId: number; quantity: number }>();
  @Output() removeItem = new EventEmitter<number>();
  @Output() proceedToCheckout = new EventEmitter<void>();
  @Output() continueShopping = new EventEmitter<void>();

  // Временная переменная для количества (для двухстороннего связывания)
  quantityInputs: { [key: number]: number } = {};

  ngOnInit(): void {
    // Инициализируем quantityInputs
    this.cartItems.forEach(item => {
      this.quantityInputs[item.productId] = item.quantity;
    });
  }

  ngOnChanges(): void {
    // Обновляем quantityInputs при изменении cartItems
    this.cartItems.forEach(item => {
      if (this.quantityInputs[item.productId] === undefined) {
        this.quantityInputs[item.productId] = item.quantity;
      }
    });
  }

  onIncreaseQuantity(productId: number): void {
    const currentQuantity = this.quantityInputs[productId] || 1;
    const newQuantity = currentQuantity + 1;
    this.quantityInputs[productId] = newQuantity;
    this.updateQuantity.emit({productId, quantity: newQuantity});
  }

  onDecreaseQuantity(productId: number): void {
    const currentQuantity = this.quantityInputs[productId] || 1;
    if (currentQuantity > 1) {
      const newQuantity = currentQuantity - 1;
      this.quantityInputs[productId] = newQuantity;
      this.updateQuantity.emit({productId, quantity: newQuantity});
    }
  }

  onQuantityChange(productId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    if (!isNaN(value) && value >= 1) {
      this.quantityInputs[productId] = value;
      this.updateQuantity.emit({productId, quantity: value});
    } else {
      // Восстанавливаем предыдущее значение
      input.value = this.quantityInputs[productId].toString();
    }
  }

  onRemove(productId: number): void {
    if (confirm('Удалить товар из корзины?')) {
      this.removeItem.emit(productId);
    }
  }

  onProceedToCheckout(): void {
    this.proceedToCheckout.emit();
  }

  onContinueShopping(): void {
    this.continueShopping.emit();
  }

  getItemTotal(price: number, quantity: number): number {
    return price * quantity;
  }

  trackByProductId(index: number, item: CartItemDetails): number {
    return item.productId;
  }
}
