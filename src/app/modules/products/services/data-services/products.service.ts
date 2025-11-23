import { inject, Injectable } from '@angular/core';
import { forkJoin, of, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { catchError, finalize, tap, switchMap, debounceTime, distinctUntilChanged, retry } from 'rxjs/operators';
import { ProductsStore } from '../../store/products.store';
import { ProductsApiService } from './products-api.service';
import { DataInitializationService } from './data-initialization.service';
import { ICategory, IProduct } from '../../models/product.interface';

interface FilterState {
  searchTerm: string;
  categoryId: number | null;
  limit: number;
  offset: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private store = inject(ProductsStore);
  private api = inject(ProductsApiService);
  private dataInit = inject(DataInitializationService);

  // Храним все загруженные продукты для клиентского поиска
  private allProducts: IProduct[] = [];

  // BehaviorSubject для управления фильтрами
  private filterState = new BehaviorSubject<FilterState>({
    searchTerm: '',
    categoryId: null,
    limit: 30,
    offset: 0
  });

  private isLoading = false;
  private hasMore = true;
  private errorCount = 0;
  private readonly maxErrorCount = 3;

  constructor() {
    this.setupFilterListener();
  }

  // Initialization
  initializeApp(): Observable<boolean> {
    console.log('Service: Starting application initialization');
    this.store.setLoading(true);
    this.store.setError(null);

    return this.dataInit.initializeData().pipe(
      switchMap(initResult => {
        console.log('Data initialization result:', initResult);

        if (!initResult.success) {
          console.warn('Data initialization warning:', initResult.message);
          this.store.setError(`Предупреждение: ${initResult.message}`);
        }

        return this.loadInitialData();
      }),
      catchError(error => {
        console.error('Service: Critical initialization error:', error);
        this.store.setError('Ошибка инициализации приложения. Пожалуйста, обновите страницу.');
        return of(false);
      }),
      finalize(() => {
        console.log('Service: Initialization process completed');
        this.store.setLoading(false);
      })
    );
  }

  /**
   * Загружает начальные данные
   */
  private loadInitialData(): Observable<boolean> {
    return forkJoin({
      products: this.api.getProducts(30, 0).pipe(
        retry(2),
        catchError(error => {
          console.error('Failed to load products:', error);
          return of([] as IProduct[]);
        })
      ),
      categories: this.api.getCategories(50).pipe(
        retry(2),
        catchError(error => {
          console.error('Failed to load categories:', error);
          return of([] as ICategory[]);
        })
      )
    }).pipe(
      tap(({ products, categories }) => {
        console.log('Service: Loaded initial data', {
          products: products.length,
          categories: categories.length
        });

        // Сохраняем все продукты для клиентского поиска
        this.allProducts = products;

        if (products.length === 0 || categories.length === 0) {
          console.warn('Service: No data loaded, application may not function properly');
          this.store.setError('Не удалось загрузить данные. Пожалуйста, проверьте подключение к интернету.');
        }

        this.store.setProducts(products);
        this.store.setCategories(categories);
        this.store.setError(null);
        this.hasMore = products.length === 30;
        this.errorCount = 0;
      }),
      switchMap(() => of(true)),
      catchError(error => {
        this.errorCount++;
        console.error(`Service: Initial data loading failed (attempt ${this.errorCount}):`, error);

        if (this.errorCount >= this.maxErrorCount) {
          this.store.setError('Критическая ошибка загрузки данных. Пожалуйста, свяжитесь с поддержкой.');
        } else {
          this.store.setError('Временная ошибка загрузки. Повторная попытка...');
        }

        return of(false);
      })
    );
  }

  /**
   * Клиентский поиск по всем загруженным продуктам
   */
  private searchProductsLocally(searchTerm: string): IProduct[] {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return this.allProducts;
    }

    const term = searchTerm.toLowerCase().trim();
    return this.allProducts.filter(product =>
      product.title.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      product.price.toString().includes(term) ||
      product.category?.name.toLowerCase().includes(term)
    );
  }

  // Настройка слушателя фильтров
  private setupFilterListener(): void {
    this.filterState.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) =>
        prev.searchTerm === curr.searchTerm &&
        prev.categoryId === curr.categoryId &&
        prev.offset === curr.offset
      ),
      switchMap(state => {
        if (this.isLoading) {
          return of(null);
        }

        if (state.offset === 0) {
          this.store.clearProducts();
        }

        return this.loadProductsWithFilters(state).pipe(
          catchError(error => {
            console.error('Filter listener error:', error);
            this.handleLoadError(error);
            return of(null);
          })
        );
      })
    ).subscribe();
  }

  /**
   * Загружает продукты с учетом фильтров
   */
  private loadProductsWithFilters(state: FilterState): Observable<IProduct[] | null> {
    if (this.isLoading || (!this.hasMore && state.offset > 0)) {
      return of(null);
    }

    this.isLoading = true;
    this.store.setLoadingProducts(true);
    this.store.setError(null);

    let apiCall: Observable<IProduct[]>;

    // КЛИЕНТСКИЙ ПОИСК - используем локальную фильтрацию
    if (state.searchTerm && state.searchTerm.length >= 2) {
      console.log('Performing local search for:', state.searchTerm);
      const filteredProducts = this.searchProductsLocally(state.searchTerm);

      // Применяем пагинацию к отфильтрованным результатам
      const startIndex = state.offset;
      const endIndex = startIndex + state.limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      this.hasMore = endIndex < filteredProducts.length;

      return of(paginatedProducts).pipe(
        tap(products => {
          if (state.offset === 0) {
            this.store.setProducts(products);
          } else {
            this.store.addProducts(products);
          }
          this.store.setError(null);
          this.errorCount = 0;
        }),
        catchError(error => {
          this.handleLoadError(error);
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
          this.store.setLoadingProducts(false);
        })
      );
    }
    // Фильтрация по категории через API
    else if (state.categoryId) {
      apiCall = this.api.getProductsByCategory(state.categoryId, state.limit, state.offset).pipe(
        retry(1),
        catchError(error => {
          console.error('Category filter API error:', error);
          throw error;
        })
      );
    }
    // Обычная загрузка продуктов
    else {
      apiCall = this.api.getProducts(state.limit, state.offset).pipe(
        retry(1),
        catchError(error => {
          console.error('Products API error:', error);
          throw error;
        })
      );
    }

    return apiCall.pipe(
      tap(products => {
        if (state.offset === 0) {
          this.store.setProducts(products);
          // Обновляем кэш всех продуктов при первой загрузке
          if (!state.searchTerm && !state.categoryId) {
            this.allProducts = products;
          }
        } else {
          this.store.addProducts(products);
        }

        this.hasMore = products.length === state.limit;
        this.store.setError(null);
        this.errorCount = 0;

        console.log('Service: Successfully loaded products with filters', {
          search: state.searchTerm,
          categoryId: state.categoryId,
          offset: state.offset,
          loaded: products.length,
          hasMore: this.hasMore
        });
      }),
      catchError(error => {
        this.handleLoadError(error);
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
        this.store.setLoadingProducts(false);
      })
    );
  }

  /**
   * Обрабатывает ошибки загрузки
   */
  private handleLoadError(error: any): void {
    this.errorCount++;
    console.error(`Service: Load error (count: ${this.errorCount}):`, error);

    if (this.errorCount >= this.maxErrorCount) {
      this.store.setError('Не удается загрузить данные. Пожалуйста, проверьте подключение и обновите страницу.');
    } else {
      this.store.setError('Временная ошибка загрузки. Повторная попытка...');
    }
  }

  // Public methods
  searchProducts(searchTerm: string): void {
    if (this.errorCount >= this.maxErrorCount) {
      console.warn('Skipping search due to too many errors');
      return;
    }

    this.filterState.next({
      ...this.filterState.value,
      searchTerm,
      categoryId: null,
      offset: 0
    });

    this.store.selectCategory(null);
  }

  selectCategoryById(categoryId: number | null): void {
    if (this.errorCount >= this.maxErrorCount) {
      console.warn('Skipping category selection due to too many errors');
      return;
    }

    this.filterState.next({
      ...this.filterState.value,
      categoryId,
      searchTerm: '',
      offset: 0
    });

    if (!categoryId) {
      this.store.selectCategory(null);
      return;
    }

    const categories = this.store.getCurrentState().categories;
    const category = categories.find(cat => cat.id === categoryId);

    if (category) {
      this.store.selectCategory(category);
    } else {
      this.store.selectCategory(null);
    }
  }

  // Пагинация
  loadMoreProducts(): void {
    if (this.errorCount >= this.maxErrorCount) {
      console.warn('Skipping load more due to too many errors');
      return;
    }

    const currentState = this.filterState.value;

    if (this.isLoading || !this.hasMore) {
      return;
    }

    this.filterState.next({
      ...currentState,
      offset: currentState.offset + currentState.limit
    });
  }

  // Сброс всех фильтров
  clearAllFilters(): void {
    this.filterState.next({
      searchTerm: '',
      categoryId: null,
      limit: 30,
      offset: 0
    });

    this.store.selectCategory(null);
    this.store.setError(null);
    this.errorCount = 0;
  }

  // Принудительное восстановление данных
  forceDataRecovery(): Observable<boolean> {
    console.log('Service: Forcing data recovery...');
    this.dataInit.resetInitialization();
    this.store.clearProducts();
    this.store.setCategories([]);
    this.store.selectCategory(null);
    this.allProducts = [];

    return this.initializeApp();
  }

  // Получение текущего состояния фильтров
  getCurrentFilterState(): FilterState {
    return this.filterState.value;
  }

  // Utility
  refreshData(): void {
    this.initializeApp().subscribe();
  }

  // Получение количества найденных продуктов (для поиска)
  getSearchResultsCount(searchTerm: string): number {
    if (!searchTerm || searchTerm.length < 2) {
      return this.allProducts.length;
    }
    return this.searchProductsLocally(searchTerm).length;
  }
}
