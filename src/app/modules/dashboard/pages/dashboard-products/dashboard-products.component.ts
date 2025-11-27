import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewEncapsulation,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductsApiService } from 'app/modules/products/services/data-services/products-api.service';
import { IProduct } from 'app/modules/products/models/product.interface';
import { AddProductModalComponent } from '../../components/add-product/add-product-modal.component';
import { UpdateProductModalComponent } from '../../components/update-product/update-product-modal.component';
import { BehaviorSubject, catchError, finalize, tap, Subject, takeUntil } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InfiniteScrollContainerComponent } from '../../../../shared/common-ui/components-ui/infinite-scroll-container/infinite-scroll-container.component';

@Component({
  selector: 'dashboard-products',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    InfiniteScrollContainerComponent
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-products.component.html',
  styleUrls: ['./dashboard-products.component.scss']
})
export class DashboardProductsComponent implements OnInit, OnDestroy {
  private productsService = inject(ProductsApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  // Основной список продуктов
  private productsSubject = new BehaviorSubject<IProduct[]>([]);
  products$ = this.productsSubject.asObservable();

  // Отдельные состояния загрузки для основной загрузки и пагинации
  private initialLoadingSubject = new BehaviorSubject<boolean>(false);
  initialLoading$ = this.initialLoadingSubject.asObservable();

  private loadingMoreSubject = new BehaviorSubject<boolean>(false);
  loadingMore$ = this.loadingMoreSubject.asObservable();

  private hasMoreSubject = new BehaviorSubject<boolean>(true);
  hasMore$ = this.hasMoreSubject.asObservable();

  private currentPage = 0;
  private readonly itemsPerPage = 20;

  // Для сохранения позиции скролла
  private scrollPosition = 0;

  displayedColumns: string[] = ['image', 'title', 'category', 'price', 'actions'];

  ngOnInit(): void {
    this.loadInitialProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Загрузка начальных продуктов
  loadInitialProducts(): void {
    this.initialLoadingSubject.next(true);
    this.currentPage = 0;

    this.productsService.getProducts(this.itemsPerPage, 0).pipe(
      tap(products => {
        this.productsSubject.next(products);
        this.hasMoreSubject.next(products.length === this.itemsPerPage);
        this.currentPage = 1; // Устанавливаем следующую страницу
      }),
      catchError(error => {
        this.snackBar.open('Failed to load products', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.productsSubject.next([]);
        return [];
      }),
      finalize(() => {
        this.initialLoadingSubject.next(false);
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  // Загрузка дополнительных продуктов
  loadMoreProducts(): void {
    if (this.loadingMoreSubject.value || !this.hasMoreSubject.value) {
      return;
    }

    this.loadingMoreSubject.next(true);

    const offset = this.currentPage * this.itemsPerPage;

    // Сохраняем текущую позицию скролла перед загрузкой
    this.saveScrollPosition();

    this.productsService.getProducts(this.itemsPerPage, offset).pipe(
      tap(newProducts => {
        const currentProducts = this.productsSubject.value;
        const updatedProducts = [...currentProducts, ...newProducts];

        this.productsSubject.next(updatedProducts);
        this.hasMoreSubject.next(newProducts.length === this.itemsPerPage);

        if (newProducts.length > 0) {
          this.currentPage++;
        }

        // Восстанавливаем позицию скролла после обновления DOM
        setTimeout(() => this.restoreScrollPosition(), 0);
      }),
      catchError(error => {
        this.snackBar.open('Failed to load more products', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return [];
      }),
      finalize(() => {
        this.loadingMoreSubject.next(false);
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  // Сохранение позиции скролла
  private saveScrollPosition(): void {
    const scrollContainer = document.querySelector('.scroll-container');
    if (scrollContainer) {
      this.scrollPosition = scrollContainer.scrollTop;
    }
  }

  // Восстановление позиции скролла
  private restoreScrollPosition(): void {
    const scrollContainer = document.querySelector('.scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = this.scrollPosition;
    }
  }

  onLoadMore(): void {
    this.loadMoreProducts();
  }

  openAddProductModal(): void {
    const dialogRef = this.dialog.open(AddProductModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.loadInitialProducts(); // Полная перезагрузка
        this.snackBar.open('Product created successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  openUpdateProductModal(product: IProduct): void {
    const dialogRef = this.dialog.open(UpdateProductModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { product }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.loadInitialProducts(); // Полная перезагрузка
        this.snackBar.open('Product updated successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  deleteProduct(productId: number): void {
    const confirmation = confirm('Are you sure you want to delete this product?');
    if (confirmation) {
      this.productsService.deleteProduct(productId).subscribe({
        next: () => {
          const currentProducts = this.productsSubject.value;
          const updatedProducts = currentProducts.filter((p) => p.id !== productId);
          this.productsSubject.next(updatedProducts);

          this.snackBar.open('Product deleted successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackBar.open('Failed to delete product', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  // Метод для принудительного обновления данных
  refreshData(): void {
    this.loadInitialProducts();
  }
}
