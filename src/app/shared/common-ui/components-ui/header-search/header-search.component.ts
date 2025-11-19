import { Component, Output, EventEmitter, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged, switchMap, catchError, tap } from 'rxjs/operators';
import {Product} from '../../../../modules/products/models/product.interface';
import {ProductsStore} from '../../../../modules/products/store/products.store';
import {ProductsApiService} from '../../../../modules/products/services/data-services/products-api.service';


@Component({
  selector: 'app-header-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <div class="search-container">
      <mat-form-field appearance="outline" class="search-field">
        <mat-icon matPrefix class="search-icon">search</mat-icon>
        <input
          matInput
          placeholder="Поиск товаров..."
          [formControl]="searchControl"
          class="search-input"
          aria-label="Поиск товаров"
          type="search"
          (focus)="onFocus()"
          (blur)="onBlur()"
        />
        <button
          *ngIf="searchControl.value"
          matSuffix
          mat-icon-button
          aria-label="Очистить поиск"
          (click)="clearSearch()"
          class="clear-button"
        >
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>

      <!-- Выпадающие результаты поиска -->
      <div *ngIf="showResults && searchResults.length > 0" class="search-results">
        <div class="search-results-header">
          <span>Найдено товаров: {{ searchResults.length }}</span>
          <button mat-icon-button class="close-results" (click)="hideResults()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div
          *ngFor="let product of searchResults; trackBy: trackByProductId"
          class="search-result-item"
          (click)="selectProduct(product)"
        >
          <div class="product-image">
            <img
              [src]="getProductImage(product)"
              [alt]="product.title"
              (error)="onImageError($event)"
              class="product-img"
            >
          </div>
          <div class="product-info">
            <div class="product-title">{{ product.title }}</div>
            <div class="product-price">{{ product.price | currency:'RUB':'symbol' }}</div>
            <div class="product-category" *ngIf="product.category">
              {{ product.category.name }}
            </div>
          </div>
        </div>
        <div class="search-results-footer">
          <button mat-button class="view-all-btn" (click)="viewAllResults()">
            Показать все результаты
          </button>
        </div>
      </div>

      <!-- Сообщение об отсутствии результатов -->
      <div *ngIf="showResults && searchResults.length === 0 && hasSearched && searchControlValue.length > 2"
           class="search-no-results">
        <div class="no-results-content">
          <mat-icon class="no-results-icon">search_off</mat-icon>
          <span class="no-results-text">По запросу "{{ searchControlValue }}" ничего не найдено</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./header-search.component.scss']
})
export class HeaderSearchComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<string>();
  @Output() productSelected = new EventEmitter<Product>();

  private productsStore = inject(ProductsStore);
  private productsApiService = inject(ProductsApiService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  showResults = false;
  searchResults: Product[] = [];
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

  private performSearch(term: string): Observable<Product[]> {
    if (term.length <= 2) {
      this.searchResults = [];
      return of([]);
    }

    // Используем локальный поиск по данным из store
    return this.performLocalSearch(term);
  }

  private performLocalSearch(term: string): Observable<Product[]> {
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

  getProductImage(product: Product): string {
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

  selectProduct(product: Product): void {
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
        queryParams: { search: searchTerm }
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

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
