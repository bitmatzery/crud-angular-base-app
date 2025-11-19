import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../models/product.interface';
import { SafeImageComponent } from '../../../../shared/common-ui/components-ui/safe-image/safe-image.component';

@Component({
  selector: 'lib-category-product-card',
  standalone: true,
  imports: [CommonModule, SafeImageComponent],
  templateUrl: './category-product-card.component.html',
  styleUrls: ['./category-product-card.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
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
    console.log('Category card clicked:', this.category.id);
    this.categoryItems.emit(this.category.id.toString());
  }

  // Добавляем недостающие методы
  onImageLoaded(event: string): void {
    console.log('Category image loaded:', event);
  }

  onImageError(event: string): void {
    console.error('Category image failed to load:', event);
  }
}
