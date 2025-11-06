import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CategoryDTO} from '../../models/data-dto/product-dto-model';


@Component({
  selector: 'lib-category-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ category-product-card.component.html',
  styleUrls: ['./ category-product-card.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryProductCardComponent {
  @Input({ required: true }) category!: CategoryDTO

  @Output() filterItems = new EventEmitter();

  onShowProductsCategory(): void {
    this.filterItems.emit(this.category.name);
  }
}
