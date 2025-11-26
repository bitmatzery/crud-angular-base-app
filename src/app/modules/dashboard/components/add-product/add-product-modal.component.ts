import { ChangeDetectionStrategy, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductsApiService } from 'app/modules/products/services/data-services/products-api.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'add-product-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-product-modal.component.html',
  styleUrls: ['./add-product-modal.component.scss']
})
export class AddProductModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsApiService);
  private dialogRef = inject(MatDialogRef<AddProductModalComponent>);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  categories: any[] = [];
  loading = false;

  constructor() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      price: [null, [Validators.required, Validators.min(1)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      categoryId: [null, [Validators.required, this.categoryIdValidator]],
      images: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  ngOnInit(): void {
    this.productsService.getCategories().subscribe({
      next: (res) => {
        this.categories = res;
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
      }
    });
  }

  get images(): FormArray {
    return this.form.get('images') as FormArray;
  }

  categoryIdValidator(control: any): { [key: string]: boolean } | null {
    const value = Number(control.value);
    if (isNaN(value) || value < 1 || value > 100) {
      return { invalidCategoryId: true };
    }
    return null;
  }

  addImageUrl(event: any): void {
    const url = event.target.value.trim();
    if (url && url.startsWith('http')) {
      this.images.push(this.fb.control(url));
      event.target.value = '';
      this.form.get('images')?.markAsTouched();
    }
  }

  removeImage(index: number): void {
    this.images.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    const formData = this.form.value;

    this.productsService.createProduct(formData).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close('success');
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to create product', err);
        this.snackBar.open('Failed to create product', 'Close', { duration: 3000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}