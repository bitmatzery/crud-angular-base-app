import {Component, EventEmitter, inject, OnDestroy, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {Observable, of, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap, takeUntil, tap} from 'rxjs/operators';
import {IProduct} from '../../../../modules/products/models/product.interface';
import {ProductsStore} from '../../../../modules/products/store/products.store';
import {ProductsApiService} from '../../../../modules/products/services/data-services/products-api.service';
import {MatIconButton} from '@angular/material/button';


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

  private productsStore = inject(ProductsStore);
  private productsApiService = inject(ProductsApiService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  showResults = false;
  searchResults: IProduct[] = [];
  hasSearched = false;

  ngOnInit() {
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
    } else {
      this.showResults = false;
      this.searchResults = [];
      this.hasSearched = false;
    }
  }

  private performSearch(term: string): Observable<IProduct[]> {
    if (term.length <= 2) {
      this.searchResults = [];
      return of([]);
    }

    // Используем локальный поиск по данным из store
    return this.performLocalSearch(term);
  }

  private performLocalSearch(term: string): Observable<IProduct[]> {
    const allProducts = this.productsStore.getCurrentState().products;
    const termLower = term.toLowerCase().trim();

    const filteredProducts = allProducts.filter(product =>
      product.title.toLowerCase().includes(termLower) ||
      product.description?.toLowerCase().includes(termLower) ||
      product.price.toString().includes(term) ||
      product.category?.name.toLowerCase().includes(termLower)
    );

    this.searchResults = filteredProducts.slice(0, 10); // Ограничиваем количество
    return of(this.searchResults);
  }

  getProductImage(product: IProduct): string {
    if (product.images && product.images.length > 0) {
      if (Array.isArray(product.images)) {
        return product.images[0];
      }
      // Если images - это строка, пытаемся разобрать её как JSON или использовать как есть
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
    // Небольшая задержка чтобы клик по результату успел сработать
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
