import { ChangeDetectionStrategy, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
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
import { UpdateProductModalComponent } from '../../components/update-product.component/update-product-modal.component';


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
    MatSnackBarModule
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './dashboard-products.component.html',
  styleUrls: ['./dashboard-products.component.scss']
})
export class DashboardProductsComponent implements OnInit {
  private productsService = inject(ProductsApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  products: IProduct[] = [];
  loading = false;

  // Определяем колонки для таблицы
  displayedColumns: string[] = ['image', 'title', 'category', 'price', 'actions'];

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productsService.getProducts().subscribe({
      next: (res) => {
        this.products = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load products', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      },
    });
  }

  openAddProductModal(): void {
    const dialogRef = this.dialog.open(AddProductModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.loadProducts();
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
      data: { product } // Передаем данные продукта в модальное окно
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.loadProducts();
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
          this.products = this.products.filter((p) => p.id !== productId);
          this.snackBar.open('Product deleted successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
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
}
