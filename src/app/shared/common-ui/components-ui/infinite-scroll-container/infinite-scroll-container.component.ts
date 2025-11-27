import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import {CommonModule, NgIf} from '@angular/common';

@Component({
  selector: 'infinite-scroll-container-ui',
  imports: [
    NgIf
  ],
  templateUrl: './infinite-scroll-container.component.html',
  styleUrl: './infinite-scroll-container.component.scss',
})
export class InfiniteScrollContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  @Input() isLoading = false;
  @Input() hasMore = true;
  @Input() isScrollable = true;
  @Input() maxHeight = '90vh';
  @Input() scrollThreshold = 300;
  @Input() throttleTime = 200;
  @Input() loadingText = 'Загрузка...';
  @Input() noMoreText = 'Все товары загружены';
  @Input() showNoMoreText = true;
  @Input() autoLoadInitial = true;

  @Output() loadMore = new EventEmitter<void>();
  @Output() scrolled = new EventEmitter<number>();

  private scrollThrottleTimer: any;
  private lastScrollTop = 0;

  ngAfterViewInit() {
    if (this.autoLoadInitial && this.isScrollable) {
      setTimeout(() => this.checkInitialLoad(), 100);
    }
  }

  ngOnDestroy() {
    if (this.scrollThrottleTimer) {
      clearTimeout(this.scrollThrottleTimer);
    }
  }

  onScroll(): void {
    if (!this.isScrollable || this.isLoading || !this.hasMore) return;

    if (this.scrollThrottleTimer) return;

    this.scrollThrottleTimer = setTimeout(() => {
      this.scrollThrottleTimer = null;

      const container = this.scrollContainer.nativeElement;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      this.scrolled.emit(scrollTop);

      const isScrollingDown = scrollTop > this.lastScrollTop;
      this.lastScrollTop = scrollTop;

      if (isScrollingDown && scrollTop + clientHeight >= scrollHeight - this.scrollThreshold) {
        this.loadMore.emit();
      }
    }, this.throttleTime);
  }

  private checkInitialLoad(): void {
    const container = this.scrollContainer.nativeElement;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Если контента меньше высоты контейнера, загружаем еще
    const needsMoreContent = scrollHeight <= clientHeight * 1.5;

    if (needsMoreContent && this.hasMore && !this.isLoading) {
      console.log('Auto-loading more content initially');
      this.loadMore.emit();
    }
  }

  // Публичный метод для принудительной проверки скролла
  checkScrollPosition(): void {
    if (this.isScrollable) {
      this.onScroll();
    }
  }

  // Публичный метод для скролла к верху
  scrollToTop(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
  }
}
