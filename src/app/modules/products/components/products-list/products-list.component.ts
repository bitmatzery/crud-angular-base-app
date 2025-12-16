import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProductCardComponent} from '../product-card/product-card.component';
import {ICategory, IProduct} from '../../models/product.interface';
import {CategoryProductCardComponent} from '../category-product-card/category-product-card.component';
import {DisplayType} from '../../models/display-type.enum';
import {CartService} from '../../../../core/cart/cart.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'product-list-ui',
  standalone: true,
  imports: [
    CommonModule,
    ProductCardComponent,
    CategoryProductCardComponent
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListComponent implements OnInit, OnDestroy {
  @Input({required: true}) items!: (IProduct | ICategory)[];
  @Input() displayType: DisplayType = DisplayType.PRODUCTS;
  @Input() selectedCategory: ICategory | null = null;

  @Output() filterItems = new EventEmitter<string>();
  @Output() categoryItems = new EventEmitter<string>();

  private cartService = inject(CartService);
  private cartSubscription?: Subscription;
  cartItems: { [productId: number]: number } = {};

  protected readonly DisplayType = DisplayType;

  ngOnInit() {
    // Подписываемся на изменения корзины
    this.cartSubscription = this.cartService.cartItems$.subscribe(items => {
      this.cartItems = {};
      items.forEach(item => {
        this.cartItems[item.productId] = item.quantity;
      });
    });
  }

  ngOnDestroy() {
    this.cartSubscription?.unsubscribe();
  }

  protected isProduct(item: any): item is IProduct {
    return (item as IProduct).title !== undefined;
  }

  protected isCategory(item: any): item is ICategory {
    return (item as ICategory).name !== undefined;
  }

  getQuantityInCart(productId: number): number {
    return this.cartItems[productId] || 0;
  }

  onAddToCart(productId: number): void {
    if (!productId) {
      console.error('Cannot add to cart: product id is undefined');
      return;
    }

    this.cartService.addToCart(productId);
  }

  onIncreaseQuantity(productId: number): void {
    const currentQuantity = this.getQuantityInCart(productId);
    this.cartService.updateQuantity(productId, currentQuantity + 1);
  }

  onDecreaseQuantity(productId: number): void {
    const currentQuantity = this.getQuantityInCart(productId);
    if (currentQuantity > 1) {
      this.cartService.updateQuantity(productId, currentQuantity - 1);
    } else {
      this.cartService.removeFromCart(productId);
    }
  }

  onRemoveFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  OnFilteredItems(event: any) {
    const searchTerm = typeof event === 'string' ? event : event?.param || '';
    console.log('Emitting filter:', searchTerm);
    this.filterItems.emit(searchTerm);
  }

  onCategorySelect(event: any) {
    const categoryId = typeof event === 'string' ? event : event?.param || '';
    console.log('Emitting category:', categoryId);
    this.categoryItems.emit(categoryId);
  }

  isCategorySelected(category: ICategory): boolean {
    return this.selectedCategory?.id === category.id;
  }
}
