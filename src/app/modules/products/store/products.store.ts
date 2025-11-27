import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {initialProductState, ProductState} from './products-store.state';
import {ICategory, IProduct, PaginationInfo, ProductFilters} from '../models/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductsStore {
  private readonly state = new BehaviorSubject<ProductState>(initialProductState);

  // Public observables
  public readonly state$ = this.state.asObservable();

  // Products
  public readonly products$ = this.state$.pipe(
    map(state => state.products),
    distinctUntilChanged()
  );

  public readonly filteredProducts$ = this.state$.pipe(
    map(state => state.filteredProducts),
    distinctUntilChanged()
  );

  public readonly currentProduct$ = this.state$.pipe(
    map(state => state.currentProduct),
    distinctUntilChanged()
  );

  // Categories
  public readonly categories$ = this.state$.pipe(
    map(state => state.categories),
    distinctUntilChanged()
  );

  public readonly selectedCategory$ = this.state$.pipe(
    map(state => state.selectedCategory),
    distinctUntilChanged()
  );

  // Loading states
  public readonly loading$ = this.state$.pipe(
    map(state => state.loading),
    distinctUntilChanged()
  );

  public readonly loadingProducts$ = this.state$.pipe(
    map(state => state.loadingProducts),
    distinctUntilChanged()
  );

  public readonly loadingCategories$ = this.state$.pipe(
    map(state => state.loadingCategories),
    distinctUntilChanged()
  );

  // Filters & Pagination
  public readonly filters$ = this.state$.pipe(
    map(state => state.filters),
    distinctUntilChanged()
  );

  public readonly pagination$ = this.state$.pipe(
    map(state => state.pagination),
    distinctUntilChanged()
  );

  // Errors
  public readonly error$ = this.state$.pipe(
    map(state => state.error),
    distinctUntilChanged()
  );

  // Combined view models
  public readonly productsView$ = combineLatest([
    this.filteredProducts$,
    this.loadingProducts$,
    this.selectedCategory$,
    this.error$
  ]).pipe(
    map(([products, loading, category, error]) => ({
      products,
      loading,
      category: category?.name || 'Все товары',
      error,
      isEmpty: !loading && products.length === 0
    }))
  );

  // Private state updates
  private updateState(partialState: Partial<ProductState>): void {
    const currentState = this.state.value;
    const newState = {...currentState, ...partialState};

    // Проверяем, действительно ли состояние изменилось
    const hasChanged = JSON.stringify(currentState) !== JSON.stringify(newState);

    if (hasChanged) {
      this.state.next(newState);
    } else {
      console.log('Store: State unchanged, skipping update');
    }
  }

  // Products actions
  setProducts(products: IProduct[]): void {
    this.updateState({
      products,
      filteredProducts: products // По умолчанию показываем все загруженные продукты
    });
  }

  addProducts(products: IProduct[]): void {
    const currentProducts = this.state.value.products;
    const newProducts = [...currentProducts, ...products];
    this.updateState({
      products: newProducts,
      filteredProducts: newProducts
    });
  }

  setFilteredProducts(products: IProduct[]): void {
    this.updateState({filteredProducts: products});
  }

  clearProducts(): void {
    this.updateState({
      products: [],
      filteredProducts: []
    });
  }

  addProduct(product: IProduct): void {
    const products = [...this.state.value.products, product];
    this.updateState({
      products,
      filteredProducts: products
    });
  }

  updateProduct(updatedProduct: IProduct): void {
    const products = this.state.value.products.map(product =>
      product.id === updatedProduct.id ? updatedProduct : product
    );
    this.updateState({
      products,
      filteredProducts: products,
      currentProduct: this.state.value.currentProduct?.id === updatedProduct.id
        ? updatedProduct
        : this.state.value.currentProduct
    });
  }

  deleteProduct(productId: number): void {
    const products = this.state.value.products.filter(product => product.id !== productId);
    this.updateState({
      products,
      filteredProducts: products,
      currentProduct: this.state.value.currentProduct?.id === productId
        ? null
        : this.state.value.currentProduct
    });
  }

  setCurrentProduct(product: IProduct | null): void {
    this.updateState({currentProduct: product});
  }

  // Categories actions
  setCategories(categories: ICategory[]): void {
    this.updateState({categories});
  }

  selectCategory(category: ICategory | null): void {
    this.updateState({
      selectedCategory: category
    });
  }

  // Filtering actions
  updateFilters(filters: Partial<ProductFilters>): void {
    this.updateState({
      filters: {...this.state.value.filters, ...filters}
    });
  }

  clearFilters(): void {
    const filters = {limit: 10, offset: 0};
    this.updateState({
      filters,
      selectedCategory: null
    });
  }

  // Loading states
  setLoading(loading: boolean): void {
    this.updateState({loading});
  }

  setLoadingProducts(loading: boolean): void {
    this.updateState({loadingProducts: loading});
  }

  setLoadingCategories(loading: boolean): void {
    this.updateState({loadingCategories: loading});
  }

  // Error handling
  setError(error: string | null): void {
    // Предотвращаем циклические обновления при одинаковых ошибках
    const currentError = this.state.value.error;
    if (currentError === error) {
      return;
    }

    console.log('Store: Setting error:', error);
    this.updateState({error});
  }

  // Pagination
  updatePagination(pagination: Partial<PaginationInfo>): void {
    this.updateState({
      pagination: {...this.state.value.pagination, ...pagination}
    });
  }

  // Utility methods
  getCurrentState(): ProductState {
    return this.state.value;
  }

  resetState(): void {
    this.state.next(initialProductState);
  }
}
