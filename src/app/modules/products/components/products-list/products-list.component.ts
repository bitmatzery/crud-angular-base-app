import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProductCardComponent} from '../product-card/product-card.component';
import {ICategory, IProduct} from '../../models/product.interface';
import {
  SearchFiltrationItemsComponent
} from '../../../../shared/common-ui/components-ui/search-filtration-items/search-filtration-items.component';
import {CategoryProductCardComponent} from '../category-product-card/category-product-card.component'; // Правильный импорт
import {DisplayType} from '../../models/display-type.enum';

@Component({
  selector: 'product-list-ui',
  standalone: true,
  imports: [
    CommonModule,
    ProductCardComponent,
    SearchFiltrationItemsComponent,
    CategoryProductCardComponent
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListComponent {
  @Input({required: true}) items!: (IProduct | ICategory)[];
  @Input() displayType: DisplayType = DisplayType.PRODUCTS;
  @Input() selectedCategory: ICategory | null = null;

  @Output() filterItems = new EventEmitter<string>();
  @Output() categoryItems = new EventEmitter<string>();

  protected readonly DisplayType = DisplayType;

  protected isProduct(item: any): item is IProduct {
    return (item as IProduct).title !== undefined;
  }

  protected isCategory(item: any): item is ICategory {
    return (item as ICategory).name !== undefined;
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
