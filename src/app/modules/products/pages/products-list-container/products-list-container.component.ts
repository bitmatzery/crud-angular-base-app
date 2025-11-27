import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, first, map, Observable, Subscription, takeUntil } from 'rxjs';
import { DisplayType } from '../../models/display-type.enum';
import { ICategory, IProduct } from '../../models/product.interface';
import { ProductsListComponent } from '../../components/products-list/products-list.component';
import { ProductsStore } from '../../store/products.store';
import { Subject } from 'rxjs';
import { ProductsService } from '../../services/data-services/products.service';
import {
  SearchFiltrationItemsComponent
} from '../../../../shared/common-ui/components-ui/search-filtration-items/search-filtration-items.component';
import { InfiniteScrollContainerComponent } from '../../../../shared/common-ui/components-ui/infinite-scroll-container/infinite-scroll-container.component';

@Component({
  selector: 'product-list-container',
  standalone: true,
  imports: [
    CommonModule,
    ProductsListComponent,
    AsyncPipe,
    SearchFiltrationItemsComponent,
    InfiniteScrollContainerComponent
  ],
  templateUrl: './products-list-container.component.html',
  styleUrls: ['./products-list-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsListContainerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() displayType: DisplayType = DisplayType.PRODUCTS;
  @Input() itemsLimit: number = 10; // Передаваемый параметр количества продуктов

  protected readonly DisplayType = DisplayType;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ProductsStore);
  private readonly productsService = inject(ProductsService);

  private searchFilterSubject = new BehaviorSubject<string>('');
  private destroy$ = new Subject<void>();

  public searchFilterValue$ = this.searchFilterSubject.asObservable();
  public items$!: Observable<IProduct[] | ICategory[]>;
  public selectedCategory$ = this.store.selectedCategory$;
  public loading$ = this.store.loading$;
  public loadingProducts$ = this.store.loadingProducts$;
  public filteredItems$!: Observable<IProduct[] | ICategory[]>;

  // Получаем текущий поисковый запрос из сервиса
  public currentSearchTerm$ = this.productsService.currentSearchTerm$;

  public searchResultsCount$ = combineLatest([
    this.currentSearchTerm$,
    this.store.products$
  ]).pipe(
    map(([searchTerm, products]) => {
      if (!searchTerm || searchTerm.length < 2) return null;
      return this.productsService.getSearchResultsCount(searchTerm);
    })
  );

  public searchInfo$ = combineLatest([
    this.currentSearchTerm$,
    this.store.products$
  ]).pipe(
    map(([searchTerm, products]) => {
      if (!searchTerm || searchTerm.length < 2) return null;

      const allProductsLoaded = this.productsService.areAllProductsLoaded();
      const loadedCount = this.productsService.getLoadedProductsCount();
      const searchResultsCount = this.productsService.getSearchResultsCount(searchTerm);

      return {
        allProductsLoaded,
        loadedCount,
        searchResultsCount,
        searchMode: allProductsLoaded ? 'local' : 'api'
      };
    })
  );

  private subscriptions: Subscription = new Subscription();

  // Статическое состояние для отслеживания инициализации
  private static appInitialized = false;

  ngOnInit() {
    console.log('ProductsListContainerComponent initialized with displayType:', this.displayType, 'limit:', this.itemsLimit);

    // Устанавливаем лимит в сервисе
    this.productsService.setItemsLimit(this.itemsLimit);

    this.updateItems();
    this.initializeFromQueryParams();

    // Подписываемся на изменения поискового запроса из сервиса
    this.subscriptions.add(
      this.productsService.currentSearchTerm$
        .pipe(takeUntil(this.destroy$))
        .subscribe(searchTerm => {
          this.searchFilterSubject.next(searchTerm);
        })
    );

    // Проверяем, нужно ли инициализировать приложение
    const currentProducts = this.store.getCurrentState().products;
    const allProductsLoaded = this.productsService.areAllProductsLoaded();

    if ((currentProducts.length === 0 || !allProductsLoaded) && !ProductsListContainerComponent.appInitialized) {
      console.log('Initializing app - products in store:', currentProducts.length, 'allProductsLoaded:', allProductsLoaded);
      this.initializeApp();
      ProductsListContainerComponent.appInitialized = true;
    } else {
      console.log('Using existing state - products in store:', currentProducts.length, 'allProductsLoaded:', allProductsLoaded);
      // Восстанавливаем состояние в сервисе из стора
      if (currentProducts.length > 0) {
        this.productsService.setProducts(currentProducts);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['displayType']) {
      console.log('DisplayType changed to:', this.displayType);
      this.updateItems();
    }

    if (changes['itemsLimit'] && this.itemsLimit) {
      console.log('Items limit changed to:', this.itemsLimit);
      this.productsService.setItemsLimit(this.itemsLimit);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
  }

  private initializeApp(): void {
    this.productsService.initializeApp().subscribe({
      next: (success) => {
        console.log('App initialization result:', success);
      },
      error: (error) => {
        console.error('App initialization error:', error);
      }
    });
  }

  private initializeFromQueryParams(): void {
    this.route.queryParams.pipe(first()).subscribe(params => {
      const searchParam = params['search'] || '';
      const categoryParam = params['category'] || '';

      console.log('Initial query params:', { searchParam, categoryParam });

      // Сохраняем поисковый запрос в сервисе
      if (searchParam) {
        this.productsService.setCurrentSearchTerm(searchParam);
        this.searchFilterSubject.next(searchParam);
      }

      if (categoryParam) {
        const categoryId = Number(categoryParam);
        this.productsService.selectCategoryById(categoryId);
      }

      if (searchParam) {
        this.productsService.searchProducts(searchParam);
      }
    });

    // Синхронизация изменений категории с URL
    this.subscriptions.add(
      this.store.selectedCategory$
        .pipe(takeUntil(this.destroy$))
        .subscribe(category => {
          this.updateUrl();
        })
    );

    // Синхронизация поиска с URL
    this.subscriptions.add(
      this.searchFilterSubject
        .pipe(takeUntil(this.destroy$))
        .subscribe(search => {
          this.updateUrl();
        })
    );
  }

  private updateItems(): void {
    console.log('Updating items for displayType:', this.displayType);

    this.items$ = this.displayType === DisplayType.PRODUCTS
      ? this.store.products$
      : this.store.categories$;

    this.filteredItems$ = this.items$;

    console.log('Items observable updated for:', this.displayType);
  }

  onLoadMore(): void {
    if (this.displayType !== DisplayType.PRODUCTS) return;

    console.log('Loading more products...');
    this.productsService.loadMoreProducts();
  }

  onFilteredItems(searchTerm: string): void {
    console.log('Search term received:', searchTerm);

    // Сохраняем поисковый запрос в сервисе
    this.productsService.setCurrentSearchTerm(searchTerm);
    this.searchFilterSubject.next(searchTerm);

    if (this.displayType === DisplayType.PRODUCTS && searchTerm) {
      this.productsService.searchProducts(searchTerm);
    } else if (this.displayType === DisplayType.PRODUCTS && !searchTerm) {
      this.productsService.clearAllFilters();
    }
  }

  onCategorySelect(categoryId: string): void {
    console.log('Category selected:', categoryId);

    const currentCategory = this.store.getCurrentState().selectedCategory;

    if (currentCategory && currentCategory.id.toString() === categoryId) {
      this.productsService.selectCategoryById(null);
    } else {
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

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  clearAllFilters(): void {
    this.searchFilterSubject.next('');
    this.productsService.clearAllFilters();
  }

  get searchFilterValue(): string {
    return this.searchFilterSubject.value;
  }

  trackByProductId(index: number, product: IProduct): number {
    return product.id;
  }

  trackByCategoryId(index: number, category: ICategory): number {
    return category.id;
  }
}
