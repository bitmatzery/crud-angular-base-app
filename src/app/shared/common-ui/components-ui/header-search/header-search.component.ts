import {Component, EventEmitter, inject, OnDestroy, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {Observable, of, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {IProduct} from '../../../../modules/products/models/product.interface';
import {ProductsApiService} from '../../../../modules/products/services/data-services/products-api.service';
import {MatIconButton} from '@angular/material/button';
import {ProductsService} from '../../../../modules/products/services/data-services/products.service';

@Component({
  selector: 'header-search-ui',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatIconButton
  ],
  templateUrl: './header-search.component.html',
  styleUrls: ['./header-search.component.scss']
})
export class HeaderSearchComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<string>();
  @Output() productSelected = new EventEmitter<IProduct>();

  private productsApiService = inject(ProductsApiService);
  private productsService = inject(ProductsService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  showResults = false;
  searchResults: IProduct[] = [];
  hasSearched = false;
  isLoading = false;

  ngOnInit() {
    const currentSearchTerm = this.productsService.getCurrentSearchTerm();
    if (currentSearchTerm) {
      this.searchControl.setValue(currentSearchTerm, {emitEvent: false});
    }

    // Подписываемся на изменения поля поиска с debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(term => this.onSearchTermChange(term || '')),
        switchMap(term => this.performSearch(term || '')),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  get searchControlValue(): string {
    return this.searchControl.value || '';
  }

  private onSearchTermChange(term: string): void {
    this.search.emit(term);

    if (term.length > 2) {
      this.showResults = true;
      this.hasSearched = true;
      this.isLoading = true;
    } else {
      this.showResults = false;
      this.searchResults = [];
      this.hasSearched = false;
      this.isLoading = false;
    }
  }

  private performSearch(term: string): Observable<IProduct[]> {
    if (term.length <= 2) {
      this.searchResults = [];
      this.isLoading = false;
      return of([]);
    }

    // Используем единую логику поиска через ProductsService
    return this.performUnifiedSearch(term);
  }

  private performUnifiedSearch(term: string): Observable<IProduct[]> {
    const allProductsLoaded = this.productsService.areAllProductsLoaded();

    if (allProductsLoaded) {
      // Если все продукты загружены через пагинацию, ищем локально
      console.log('HeaderSearch: Using local search');
      return this.performLocalSearch(term);
    } else {
      // Если не все продукты загружены, используем API поиск
      console.log('HeaderSearch: Using API search');
      return this.performApiSearch(term);
    }
  }

  private performLocalSearch(term: string): Observable<IProduct[]> {
    const allProducts = this.productsService.getAllProducts();
    const termLower = term.toLowerCase().trim();

    const filteredProducts = allProducts.filter(product =>
      product.title.toLowerCase().includes(termLower) ||
      product.description?.toLowerCase().includes(termLower) ||
      product.price.toString().includes(term) ||
      product.category?.name.toLowerCase().includes(termLower)
    );

    this.searchResults = filteredProducts.slice(0, 10);
    this.isLoading = false;
    return of(this.searchResults);
  }

  private performApiSearch(term: string): Observable<IProduct[]> {
    // Используем API для поиска с большим лимитом
    return this.productsApiService.getProducts(1000, 0).pipe(
      map(allProducts => {
        const termLower = term.toLowerCase().trim();

        const filteredProducts = allProducts.filter(product =>
          product.title.toLowerCase().includes(termLower) ||
          product.description?.toLowerCase().includes(termLower) ||
          product.price.toString().includes(term) ||
          product.category?.name.toLowerCase().includes(termLower)
        );

        this.searchResults = filteredProducts.slice(0, 10);
        this.isLoading = false;

        // Сохраняем загруженные продукты в сервисе для будущих поисков
        this.productsService.setProducts(allProducts);

        return this.searchResults;
      }),
      tap({
        error: (error) => {
          console.error('HeaderSearch API error:', error);
          this.isLoading = false;
          this.searchResults = [];
        }
      })
    );
  }

  getProductImage(product: IProduct): string {
    if (product.images && product.images.length > 0) {
      if (Array.isArray(product.images)) {
        return product.images[0];
      }
      try {
        const parsedImages = JSON.parse(product.images);
        return Array.isArray(parsedImages) ? parsedImages[0] : product.images;
      } catch {
        return product.images;
      }
    }
    return 'assets/images/placeholder.jpg';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder.jpg';
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.showResults = false;
    this.searchResults = [];
    this.hasSearched = false;
    this.isLoading = false;
    this.search.emit('');
  }

  selectProduct(product: IProduct): void {
    this.productSelected.emit(product);
    this.showResults = false;
    this.searchControl.setValue('');
    this.search.emit('');
    this.router.navigate(['/products', product.id]);
  }

  viewAllResults(): void {
    const searchTerm = this.searchControl.value;
    if (searchTerm) {
      this.router.navigate(['/products'], {
        queryParams: {search: searchTerm}
      });
      this.showResults = false;
    }
  }

  onFocus(): void {
    if (this.searchControl.value && this.searchControl.value.length > 2) {
      this.showResults = true;
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.showResults = false;
    }, 200);
  }

  hideResults(): void {
    this.showResults = false;
  }

  trackByProductId(index: number, product: IProduct): number {
    return product.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
