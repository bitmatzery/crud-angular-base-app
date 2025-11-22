import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../models/product.interface';
import { SafeImageComponent } from '../../../../shared/common-ui/components-ui/safe-image/safe-image.component';

@Component({
  selector: 'category-product-card-ui',
  standalone: true,
  imports: [CommonModule, SafeImageComponent],
  templateUrl: './category-product-card.component.html',
  styleUrls: ['./category-product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryProductCardComponent { // Правильное имя класса
  @Input({ required: true }) category!: Category;
  @Input() isSelected: boolean = false;

  @Output() categoryItems = new EventEmitter<string>();

  getImageOptions() {
    return {
      size: 'medium' as const,
      lazy: true,
      aspectRatio: '16/9'
    };
  }

  onCategoryClick(): void {
    // Логи console.log('Category card clicked:', this.category.id);
    this.categoryItems.emit(this.category.id.toString());
  }

  onImageLoaded(event: string): void {
    // Логи console.log('Category image loaded:', event);
  }

  onImageError(event: string): void {
    // Логи console.error('Category image failed to load:', event);
  }
}
