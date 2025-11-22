import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.interface';
import { SafeImageComponent } from '../../../../shared/common-ui/components-ui/safe-image/safe-image.component';

@Component({
  selector: 'product-card-ui',
  standalone: true,
  imports: [CommonModule, SafeImageComponent],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  @Input({required: true}) product!: Product;

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
