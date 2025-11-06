import {ChangeDetectionStrategy, Component, Input, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProductDTO} from '../../models/data-dto/product-dto-model';


@Component({
  selector: 'product-card-ui',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  @Input({required: true}) product!: ProductDTO;
}
