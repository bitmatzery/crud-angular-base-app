import { Directive, Input, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'img[fallback]',
  standalone: true
})
export class ImageFallbackDirective {
  @Input() fallback: string = 'https://via.placeholder.com/300x200/EFEFEF/666666?text=No+Image';
  @Input() loading: string = 'https://via.placeholder.com/300x200/CCCCCC/999999?text=Loading...';

  constructor(private el: ElementRef) {
    // Устанавливаем изображение загрузки при инициализации
    this.el.nativeElement.src = this.loading;
  }

  @HostListener('error')
  onError() {
    const img = this.el.nativeElement as HTMLImageElement;
    img.src = this.fallback;
    img.alt = 'Image not available';
  }

  @HostListener('load')
  onLoad() {
    console.log('Image loaded successfully');
  }
}
