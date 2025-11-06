import {ChangeDetectionStrategy, Component, ViewEncapsulation,} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ProductsListContainerComponent
} from '../../../products/pages/products-list-container/products-list-container.component';
import {DisplayType} from '../../../products/models/data-dto/display-type.enum';

@Component({
  selector: 'store-home',
  imports: [CommonModule, ProductsListContainerComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly displayType = DisplayType;
}
