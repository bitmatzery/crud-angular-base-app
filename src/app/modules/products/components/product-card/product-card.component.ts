import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IProduct} from '../../models/product.interface';
import {SafeImageComponent} from '../../../../shared/common-ui/components-ui/safe-image/safe-image.component';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
  selector: 'product-card-ui',
  standalone: true,
  imports: [
    CommonModule,
    SafeImageComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  @Input({required: true}) product!: IProduct;
  @Input() quantityInCart: number = 0;

  @Output() addToCart = new EventEmitter<void>();
  @Output() increaseQuantity = new EventEmitter<void>();
  @Output() decreaseQuantity = new EventEmitter<void>();
  @Output() removeFromCart = new EventEmitter<void>();

  getImageOptions() {
    return {
      size: 'medium' as const,
      lazy: true,
      aspectRatio: '16/9'
    };
  }

  // Логи
  onImageLoaded(event: string): void {
    // Логи console.log('Product image loaded:', event);
  }

  onImageError(event: string): void {
    /* // Логи console.log('Image error details:', {
      originalSrc: this.product.images,
      fallbackUsed: event,
      timestamp: new Date().toISOString()
    });
    console.error('Product image failed to load:', event);*/
  }
}
