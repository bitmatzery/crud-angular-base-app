import {
  Component, Input, OnChanges, SimpleChanges,
  Output, EventEmitter, inject, ChangeDetectionStrategy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../../../core/images/image.service';

export interface SafeImageOptions {
  size?: 'small' | 'medium' | 'large';
  lazy?: boolean;
}

@Component({
  selector: 'app-safe-image',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './safe-image.component.html',
  styleUrls: ['./safe-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SafeImageComponent implements OnChanges, OnInit {
  @Input() src: string | string[] | null | undefined = '';
  @Input() alt: string = '';
  @Input() className: string = '';
  @Input() style: string | { [key: string]: string } = '';
  @Input() options: SafeImageOptions = {
    lazy: true,
    size: 'medium'
  };

  @Output() imageLoaded = new EventEmitter<string>();
  @Output() imageError = new EventEmitter<string>();

  currentImage: string = '';
  isLoading: boolean = true;
  hasError: boolean = false;

  // Публичные свойства для использования в шаблоне
  loadingImage: string = '';
  errorImage: string = '';

  private imageElement: HTMLImageElement | null = null;
  private imageService = inject(ImageService);

  ngOnInit(): void {
    // Инициализируем изображения при создании компонента
    this.loadingImage = this.imageService.getLoadingImage();
    this.errorImage = this.imageService.getErrorImage();
    this.loadImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && !changes['src'].firstChange) {
      this.loadImage();
    }
  }

  private loadImage(): void {
    this.isLoading = true;
    this.hasError = false;

    // Получаем безопасный URL через сервис
    const safeUrl = this.imageService.getSafeImageUrl(this.src, {
      size: this.options.size,
      usePlaceholder: true
    });

    this.currentImage = safeUrl;

    // Если это внешний URL, проверяем его доступность
    if (this.isExternalUrl(safeUrl)) {
      this.checkImageAvailability(safeUrl);
    } else {
      // Для data URL и assets сразу показываем изображение
      this.isLoading = false;
    }
  }

  private isExternalUrl(url: string): boolean {
    return !url.startsWith('data:image') &&
      !url.startsWith('assets/') &&
      !url.startsWith('blob:');
  }

  private checkImageAvailability(url: string): void {
    const img = new Image();
    this.imageElement = img;

    img.onload = () => {
      if (this.imageElement === img) {
        this.isLoading = false;
        this.hasError = false;
        this.imageLoaded.emit(url);
      }
    };

    img.onerror = () => {
      if (this.imageElement === img) {
        this.handleError();
      }
    };

    img.src = url;

    // Таймаут для случаев, когда изображение не загружается
    setTimeout(() => {
      if (this.imageElement === img && this.isLoading) {
        console.warn('Image loading timeout:', url);
        this.handleError();
      }
    }, 10000); // 10 секунд таймаут
  }

  private handleError(): void {
    this.hasError = true;
    this.isLoading = false;
    this.currentImage = this.errorImage;
    this.imageError.emit(this.currentImage);
  }

  onImageLoad(): void {
    // Этот метод теперь вызывается только для внешних изображений
    if (this.isExternalUrl(this.currentImage)) {
      this.isLoading = false;
      this.imageLoaded.emit(this.currentImage);
    }
  }

  onImageError(): void {
    if (this.isExternalUrl(this.currentImage)) {
      this.handleError();
    }
  }

  getLoadingAttr(): 'lazy' | 'eager' {
    return this.options.lazy ? 'lazy' : 'eager';
  }

  getStyleObject(): any {
    if (typeof this.style === 'string') {
      return this.style;
    }
    return this.style;
  }
}
