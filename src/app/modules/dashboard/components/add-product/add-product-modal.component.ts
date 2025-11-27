import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
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
import { BehaviorSubject, catchError, finalize, tap } from 'rxjs';

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
  private cdr = inject(ChangeDetectorRef);

  form: FormGroup;

  private categoriesSubject = new BehaviorSubject<any[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

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
    this.loadCategories();
  }

  loadCategories(): void {
    this.productsService.getCategories().pipe(
      tap(categories => {
        this.categoriesSubject.next(categories);
        this.cdr.markForCheck();
      }),
      catchError(error => {
        console.error('Failed to load categories', error);
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
        return [];
      })
    ).subscribe();
  }

  get images(): FormArray {
    return this.form.get('images') as FormArray;
  }

  categoryIdValidator(control: any): { [key: string]: boolean } | null {
    const value = Number(control.value);
    if (isNaN(value) || value < 1 || value > 1000) {
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
      this.cdr.markForCheck();
    }
  }

  removeImage(index: number): void {
    this.images.removeAt(index);
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly', 'Close', { duration: 3000 });
      return;
    }

    this.loadingSubject.next(true);
    const formData = this.form.value;

    this.productsService.createProduct(formData).pipe(
      tap(() => {
        this.dialogRef.close('success');
      }),
      catchError(error => {
        console.error('Failed to create product', error);
        this.snackBar.open('Failed to create product', 'Close', { duration: 3000 });
        throw error;
      }),
      finalize(() => {
        this.loadingSubject.next(false);
        this.cdr.markForCheck();
      })
    ).subscribe();
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
