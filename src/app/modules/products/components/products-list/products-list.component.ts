import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProductCardComponent} from '../product-card/product-card.component';
import {CategoryDTO, ProductDTO} from '../../models/data-dto/product-dto-model';
import {
  SearchFiltrationItemsComponent
} from '../../../../shared/common-ui/components-ui/search-filtration-items/search-filtration-items.component';
import {CategoryProductCardComponent} from '../category-product-card/ category-product-card.component';
import {DisplayType} from '../../models/data-dto/display-type.enum';

@Component({
  selector: 'product-list-ui',
  imports: [CommonModule, ProductCardComponent, SearchFiltrationItemsComponent, CategoryProductCardComponent],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListComponent {
  @Input({required: true}) items!: (ProductDTO | CategoryDTO)[];
  @Input() displayType: DisplayType = DisplayType.PRODUCTS;

  @Output() filterItems = new EventEmitter();
  @Output() categoryItems = new EventEmitter<Event>();

  protected readonly DisplayType = DisplayType;

  protected isProduct(item: any): item is ProductDTO {
    return (item as ProductDTO).title !== undefined;
  }

  protected isCategory(item: any): item is CategoryDTO {
    return (item as CategoryDTO).name !== undefined;
  }

  OnFilteredItems(event: { param: string }) {
    this.filterItems.emit(event)
  }

  onCategorySelect(event: Event) {
    this.categoryItems.emit(event);
  }

}
