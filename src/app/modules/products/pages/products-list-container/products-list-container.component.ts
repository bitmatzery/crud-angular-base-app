import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {AsyncPipe, CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject, combineLatest, first, map, Observable, Subscription} from 'rxjs';
import {DisplayType} from '../../models/display-type.enum';
import {ICategory, IProduct} from '../../models/product.interface';
import {ProductsListComponent} from '../../components/products-list/products-list.component';
import {ProductsStore} from '../../store/products.store';
import {ProductsService} from '../../services/data-services/products.service';

@Component({
  selector: 'product-list-container',
  imports: [CommonModule, ProductsListComponent, AsyncPipe],
  templateUrl: './products-list-container.component.html',
  styleUrls: ['./products-list-container.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsListContainerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() displayType: DisplayType = DisplayType.PRODUCTS;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  // Делаем DisplayType доступным в шаблоне
  protected readonly DisplayType = DisplayType;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ProductsStore);
  private readonly productsService = inject(ProductsService);

  // Subjects для управления состоянием
  private searchFilterSubject = new BehaviorSubject<string>('');
  private destroy$ = new Subscription();

  // Публичные свойства для шаблона
  public searchFilterValue$ = this.searchFilterSubject.asObservable();

  // Observable для данных в зависимости от displayType
  public items$!: Observable<IProduct[] | ICategory[]>;

  // Observable для выбранной категории
  public selectedCategory$ = this.store.selectedCategory$;

  // Loading states
  public loading$ = this.store.loading$;
  public loadingProducts$ = this.store.loadingProducts$;

  // Combined data
  public filteredItems$!: Observable<IProduct[] | ICategory[]>;

  public searchResultsCount$ = combineLatest([
    this.searchFilterValue$,
    this.store.products$
  ]).pipe(
    map(([searchTerm, products]) => {
      if (!searchTerm || searchTerm.length < 2) return null;
      return products.length;
    })
  );

  // Для виртуального скролла
  private scrollListener!: any;

  ngOnInit() {
    console.log('ProductsListContainerComponent initialized with displayType:', this.displayType);
    this.updateItems();
    this.initializeFromQueryParams();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['displayType']) {
      console.log('DisplayType changed to:', this.displayType);
      this.updateItems();
    }
  }

  ngAfterViewInit() {
    if (this.displayType === DisplayType.PRODUCTS) {
      setTimeout(() => this.setupVirtualScroll(), 100);
    }
  }

  ngOnDestroy() {
    if (this.scrollListener) {
      this.scrollContainer?.nativeElement?.removeEventListener('scroll', this.scrollListener);
    }
    this.destroy$.unsubscribe();
  }

  private initializeFromQueryParams(): void {
    this.route.queryParams.pipe(first()).subscribe(params => {
      const searchParam = params['search'] || '';
      const categoryParam = params['category'] || '';

      console.log('Initial query params:', {searchParam, categoryParam});

      // Устанавливаем поисковый фильтр
      this.searchFilterSubject.next(searchParam);

      // Устанавливаем категорию если есть
      if (categoryParam) {
        const categoryId = Number(categoryParam);
        this.productsService.selectCategoryById(categoryId);
      }

      // Если есть поисковый запрос, выполняем поиск
      if (searchParam) {
        this.productsService.searchProducts(searchParam);
      }
    });

    // Синхронизация изменений категории с URL
    this.destroy$.add(
      this.store.selectedCategory$.subscribe(category => {
        this.updateUrl();
      })
    );

    // Синхронизация поиска с URL
    this.destroy$.add(
      this.searchFilterSubject.subscribe(search => {
        this.updateUrl();
      })
    );
  }

  private updateItems(): void {
    console.log('Updating items for displayType:', this.displayType);

    // Обновляем items$ в зависимости от displayType
    this.items$ = this.displayType === DisplayType.PRODUCTS
      ? this.store.products$
      : this.store.categories$;

    this.filteredItems$ = this.items$;

    console.log('Items observable updated for:', this.displayType);
  }

  private setupVirtualScroll(): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) {
      console.warn('Scroll container not found');
      return;
    }

    this.scrollListener = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Загружаем больше продуктов когда пользователь прокрутил до конца (за 100px до конца)
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        this.loadMoreProducts();
      }
    };

    container.addEventListener('scroll', this.scrollListener);
    console.log('Virtual scroll setup completed');
  }

  private loadMoreProducts(): void {
    if (this.displayType !== DisplayType.PRODUCTS) return;

    console.log('Loading more products...');
    this.productsService.loadMoreProducts();
  }

  // Обработчики событий из дочерних компонентов
  onFilteredItems(searchTerm: string): void {
    console.log('Search term received:', searchTerm);
    this.searchFilterSubject.next(searchTerm);

    // Вызываем поиск через API
    if (this.displayType === DisplayType.PRODUCTS && searchTerm) {
      this.productsService.searchProducts(searchTerm);
    } else if (this.displayType === DisplayType.PRODUCTS && !searchTerm) {
      // Если поиск очищен, сбрасываем фильтры
      this.productsService.clearAllFilters();
    }
  }

  onCategorySelect(categoryId: string): void {
    console.log('Category selected:', categoryId);

    const currentCategory = this.store.getCurrentState().selectedCategory;

    if (currentCategory && currentCategory.id.toString() === categoryId) {
      // Клик на уже выбранную категорию - сбрасываем фильтр
      this.productsService.selectCategoryById(null);
    } else {
      // Выбираем новую категорию
      this.productsService.selectCategoryById(Number(categoryId));
    }
  }

  private updateUrl(): void {
    const search = this.searchFilterSubject.value;
    const category = this.store.getCurrentState().selectedCategory;

    const queryParams: any = {};

    if (search) {
      queryParams.search = search;
    } else {
      queryParams.search = null;
    }

    if (category) {
      queryParams.category = category.id;
    } else {
      queryParams.category = null;
    }

    console.log('Updating URL with params:', queryParams);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  // Метод для сброса всех фильтров
  clearAllFilters(): void {
    this.searchFilterSubject.next('');
    this.productsService.clearAllFilters();
  }

  // Геттер для значения поиска (для использования в шаблоне)
  get searchFilterValue(): string {
    return this.searchFilterSubject.value;
  }

  // Вспомогательные методы для шаблона
  trackByProductId(index: number, product: IProduct): number {
    return product.id;
  }

  trackByCategoryId(index: number, category: ICategory): number {
    return category.id;
  }
}
