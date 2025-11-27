import { inject, Injectable } from '@angular/core';
import { forkJoin, of, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { catchError, finalize, tap, switchMap, debounceTime, distinctUntilChanged, retry, map } from 'rxjs/operators';
import { ProductsStore } from '../../store/products.store';
import { ProductsApiService } from './products-api.service';
import { DataInitializationService } from './data-initialization.service';
import { ICategory, IProduct } from '../../models/product.interface';

interface FilterState {
  searchTerm: string;
  categoryId: number | null;
  limit: number;
  offset: number;
  searchMode: 'api' | 'local';
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
    limit: 10,
    offset: 0,
    searchMode: 'api'
  });

  // Для хранения текущего поискового запроса
  private currentSearchTermSubject = new BehaviorSubject<string>('');
  public currentSearchTerm$ = this.currentSearchTermSubject.asObservable();

  private isLoading = false;
  private hasMore = true;
  private errorCount = 0;
  private readonly maxErrorCount = 3;

  // Флаг для отслеживания полной загрузки всех продуктов через пагинацию
  private allProductsLoadedViaPagination = false;

  // Статическое состояние для сохранения между роутами
  private static serviceState = {
    allProducts: [] as IProduct[],
    allProductsLoadedViaPagination: false,
    initialized: false,
    currentSearchTerm: '' // Сохраняем поисковый запрос отдельно
  };

  constructor() {
    // Восстанавливаем состояние из статической переменной
    this.allProducts = ProductsService.serviceState.allProducts;
    this.allProductsLoadedViaPagination = ProductsService.serviceState.allProductsLoadedViaPagination;
    this.currentSearchTermSubject.next(ProductsService.serviceState.currentSearchTerm);

    if (!ProductsService.serviceState.initialized) {
      this.setupFilterListener();
      ProductsService.serviceState.initialized = true;
    }
  }

  // Initialization
  initializeApp(): Observable<boolean> {
    console.log('Service: Starting application initialization');

    // Если все продукты уже загружены через пагинацию, просто возвращаем true
    if (this.allProductsLoadedViaPagination && this.allProducts.length > 0) {
      console.log('All products already loaded via pagination, skipping initialization');
      this.store.setProducts(this.allProducts);
      return of(true);
    }

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
      products: this.api.getProducts(10, 0).pipe(
        retry(2),
        catchError(error => {
          console.error('Failed to load products:', error);
          return of([] as IProduct[]);
        })
      ),
      categories: this.api.getCategories(5).pipe(
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
        ProductsService.serviceState.allProducts = products;

        if (products.length === 0 || categories.length === 0) {
          console.warn('Service: No data loaded, application may not function properly');
          this.store.setError('Не удалось загрузить данные. Пожалуйста, проверьте подключение к интернету.');
        }

        this.store.setProducts(products);
        this.store.setCategories(categories);
        this.store.setError(null);

        this.hasMore = products.length === 10;
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

  /**
   * Поиск через API с использованием getProducts и большого лимита
   */
  private searchProductsViaApi(searchTerm: string): Observable<IProduct[]> {
    console.log('Searching via API with large limit');

    // Загружаем все продукты с сервера с большим лимитом
    return this.api.getProducts(1000, 0).pipe(
      tap(allProductsFromApi => {
        console.log('Loaded all products from API for search:', allProductsFromApi.length);

        // Сохраняем все продукты в кэш
        this.allProducts = allProductsFromApi;
        ProductsService.serviceState.allProducts = allProductsFromApi;

        // Устанавливаем продукты в стор для использования в других операциях
        this.store.setProducts(allProductsFromApi);
      }),
      map(allProductsFromApi => {
        // Фильтруем продукты по поисковому запросу
        if (!searchTerm || searchTerm.trim().length < 2) {
          return allProductsFromApi;
        }

        const term = searchTerm.toLowerCase().trim();
        return allProductsFromApi.filter(product =>
          product.title.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.price.toString().includes(term) ||
          product.category?.name.toLowerCase().includes(term)
        );
      }),
      retry(1),
      catchError(error => {
        console.error('Search API error:', error);
        throw error;
      })
    );
  }

  // Настройка слушателя фильтров
  private setupFilterListener(): void {
    this.filterState.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) =>
        prev.searchTerm === curr.searchTerm &&
        prev.categoryId === curr.categoryId &&
        prev.offset === curr.offset &&
        prev.searchMode === curr.searchMode
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

    let productsObservable: Observable<IProduct[]>;

    // ПОИСК: используем локальный поиск или API поиск
    if (state.searchTerm && state.searchTerm.length >= 2) {
      console.log('Performing search for:', state.searchTerm, 'Mode:', state.searchMode);

      // Всегда используем API поиск, если не все продукты загружены через пагинацию
      // или если поисковой запрос изменился
      const shouldUseApiSearch = !this.allProductsLoadedViaPagination ||
        state.searchMode === 'api' ||
        this.shouldUseApiForSearch(state.searchTerm);

      if (!shouldUseApiSearch) {
        // Локальный поиск по всем загруженным продуктам
        console.log('Using local search - all products loaded via pagination');
        const filteredProducts = this.searchProductsLocally(state.searchTerm);
        const startIndex = state.offset;
        const endIndex = startIndex + state.limit;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        this.hasMore = endIndex < filteredProducts.length;

        productsObservable = of(paginatedProducts);
      } else {
        // Поиск через API с загрузкой всех продуктов
        console.log('Using API search - not all products loaded or search term changed');
        productsObservable = this.searchProductsViaApi(state.searchTerm).pipe(
          map(filteredProducts => {
            // Применяем пагинацию к результатам поиска
            const startIndex = state.offset;
            const endIndex = startIndex + state.limit;
            this.hasMore = endIndex < filteredProducts.length;
            return filteredProducts.slice(startIndex, endIndex);
          })
        );
      }
    }
    // Фильтрация по категории через API
    else if (state.categoryId) {
      productsObservable = this.api.getProductsByCategory(state.categoryId, state.limit, state.offset).pipe(
        tap(products => {
          this.hasMore = products.length === state.limit;
        }),
        retry(1),
        catchError(error => {
          console.error('Category filter API error:', error);
          throw error;
        })
      );
    }
    // Обычная загрузка продуктов
    else {
      productsObservable = this.api.getProducts(state.limit, state.offset).pipe(
        tap(products => {
          this.hasMore = products.length === state.limit;

          // Если загрузили меньше чем лимит, значит все продукты загружены через пагинацию
          if (products.length < state.limit) {
            this.allProductsLoadedViaPagination = true;
            ProductsService.serviceState.allProductsLoadedViaPagination = true;
            console.log('All products loaded via pagination. Total:', this.allProducts.length);
          }
        }),
        retry(1),
        catchError(error => {
          console.error('Products API error:', error);
          throw error;
        })
      );
    }

    return productsObservable.pipe(
      tap(products => {
        if (state.offset === 0) {
          this.store.setProducts(products);
        } else {
          this.store.addProducts(products);
        }

        // Обновляем кэш всех продуктов при обычной загрузке (не поиск)
        if (!state.searchTerm && !state.categoryId) {
          if (state.offset === 0) {
            this.allProducts = products;
            ProductsService.serviceState.allProducts = products;
          } else {
            this.allProducts = [...this.allProducts, ...products];
            ProductsService.serviceState.allProducts = this.allProducts;
          }
        }

        this.store.setError(null);
        this.errorCount = 0;

        console.log('Service: Successfully loaded products with filters', {
          search: state.searchTerm,
          categoryId: state.categoryId,
          offset: state.offset,
          loaded: products.length,
          hasMore: this.hasMore,
          allProductsLoadedViaPagination: this.allProductsLoadedViaPagination,
          searchMode: state.searchMode,
          totalInStore: this.store.getCurrentState().products.length,
          totalInCache: this.allProducts.length
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
   * Определяет, нужно ли использовать API для поиска
   */
  private shouldUseApiForSearch(searchTerm: string): boolean {
    // Если не все продукты загружены через пагинацию, используем API
    if (!this.allProductsLoadedViaPagination) {
      return true;
    }

    // Если поисковый запрос ранее не выполнялся или изменился, используем API
    const previousSearchTerm = ProductsService.serviceState.currentSearchTerm ;
    if (previousSearchTerm !== searchTerm) {
      ProductsService.serviceState.currentSearchTerm  = searchTerm;
      return true;
    }

    return false;
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

    // Сохраняем поисковый запрос
    this.currentSearchTermSubject.next(searchTerm);
    ProductsService.serviceState.currentSearchTerm = searchTerm;

    // Определяем режим поиска на основе логики shouldUseApiForSearch
    const searchMode = this.shouldUseApiForSearch(searchTerm) ? 'api' : 'local';

    console.log('Setting search mode:', searchMode, 'All products loaded via pagination:', this.allProductsLoadedViaPagination);

    this.filterState.next({
      ...this.filterState.value,
      searchTerm,
      categoryId: null,
      offset: 0,
      searchMode
    });

    this.store.selectCategory(null);
  }

  selectCategoryById(categoryId: number | null): void {
    if (this.errorCount >= this.maxErrorCount) {
      console.warn('Skipping category selection due to too many errors');
      return;
    }

    // Сбрасываем поисковый запрос при выборе категории
    this.currentSearchTermSubject.next('');
    ProductsService.serviceState.currentSearchTerm = '';

    this.filterState.next({
      ...this.filterState.value,
      categoryId,
      searchTerm: '',
      offset: 0,
      searchMode: 'api'
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
      console.log('Skipping load more - isLoading:', this.isLoading, 'hasMore:', this.hasMore);
      return;
    }

    const newOffset = currentState.offset + currentState.limit;
    console.log('Loading more products. Current offset:', currentState.offset, 'New offset:', newOffset);

    this.filterState.next({
      ...currentState,
      offset: newOffset
    });
  }

  // Сброс всех фильтров
  clearAllFilters(): void {
    // Сбрасываем поисковый запрос
    this.currentSearchTermSubject.next('');
    ProductsService.serviceState.currentSearchTerm = '';

    this.filterState.next({
      searchTerm: '',
      categoryId: null,
      limit: 10,
      offset: 0,
      searchMode: 'api'
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
    this.allProductsLoadedViaPagination = false;

    // Сбрасываем поисковый запрос
    this.currentSearchTermSubject.next('');
    ProductsService.serviceState.allProducts = [];
    ProductsService.serviceState.allProductsLoadedViaPagination = false;
    ProductsService.serviceState.currentSearchTerm = '';

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

  // Все ли продукты загружены через пагинацию
  areAllProductsLoaded(): boolean {
    return this.allProductsLoadedViaPagination;
  }

  // Получить количество загруженных продуктов
  getLoadedProductsCount(): number {
    return this.allProducts.length;
  }

  // Получить все загруженные продукты
  getAllProducts(): IProduct[] {
    return this.allProducts;
  }

  // Установить продукты (для восстановления состояния)
  setProducts(products: IProduct[]): void {
    this.allProducts = products;
    ProductsService.serviceState.allProducts = products;
    this.store.setProducts(products);
    this.allProductsLoadedViaPagination = products.length > 0;
    ProductsService.serviceState.allProductsLoadedViaPagination = this.allProductsLoadedViaPagination;
  }

  // Получить текущий поисковый запрос
  getCurrentSearchTerm(): string {
    return this.currentSearchTermSubject.value;
  }

  // Установить поисковый запрос (для восстановления состояния)
  setCurrentSearchTerm(searchTerm: string): void {
    this.currentSearchTermSubject.next(searchTerm);
    ProductsService.serviceState.currentSearchTerm = searchTerm;
  }

  // Метод для установки лимита
  setItemsLimit(limit: number): void {
    const currentState = this.filterState.value;
    this.filterState.next({
      ...currentState,
      limit: limit
    });
    console.log('Items limit set to:', limit);
  }

  // Получение текущего лимита
  getCurrentLimit(): number {
    return this.filterState.value.limit;
  }
}
