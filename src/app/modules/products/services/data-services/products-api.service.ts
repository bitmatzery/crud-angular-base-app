import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../core/http/api.service';
import { Category, CategoryDTO, Product, ProductDTO } from '../../models/product.interface';

export interface ProductsResponse {
  products: Product[];
  total: number;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsApiService {
  private apiService = inject(ApiService);

  // Products API Service
  public getProducts(limit: number = 30, offset: number = 0): Observable<Product[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.apiService.get<Product[]>('/products', params);
  }

  // Получение продуктов по категории с пагинацией
  public getProductsByCategory(categoryId: number, limit: number = 30, offset: number = 0): Observable<Product[]> {
    const params = new HttpParams()
      .set('categoryId', categoryId.toString())
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.apiService.get<Product[]>(`/categories/${categoryId}/products`, params);
  }

  // Получение общего количества продуктов (для пагинации)
  public getProductsCount(categoryId?: number, searchTerm?: string): Observable<{ count: number }> {
    let params = new HttpParams();

    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }

    return this.apiService.get<{ count: number }>('/products/count', params);
  }

  getProduct(id: number): Observable<Product> {
    return this.apiService.get<Product>(`/products/${id}`);
  }

  createProduct(productData: ProductDTO): Observable<Product> {
    return this.apiService.post<Product, ProductDTO>(`/products`, productData);
  }

  updateProduct(id: number, productData: ProductDTO): Observable<Product> {
    return this.apiService.put<Product, ProductDTO>(`/products/${id}`, productData);
  }

  deleteProduct(id: number): Observable<Product> {
    return this.apiService.delete<Product>(`/products/${id}`);
  }

  // Categories API Service
  public getCategories(limit: number = 50): Observable<Category[]> {
    const params = new HttpParams()
      .set('limit', limit.toString());
    return this.apiService.get<Category[]>('/categories', params);
  }

  getCategory(id: number): Observable<Category> {
    return this.apiService.get<Category>(`/categories/${id}`);
  }

  createCategory(categoryData: CategoryDTO): Observable<Category> {
    return this.apiService.post<Category, CategoryDTO>(`/categories`, categoryData);
  }

  updateCategory(id: number, categoryData: CategoryDTO): Observable<Category> {
    return this.apiService.put<Category, CategoryDTO>(`/categories/${id}`, categoryData);
  }

  deleteCategory(id: number): Observable<Category> {
    return this.apiService.delete<Category>(`/categories/${id}`);
  }
}
