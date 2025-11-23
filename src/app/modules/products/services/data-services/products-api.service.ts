import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../core/http/api.service';
import { ICategory, ICategoryUpdateDTO, IProduct, IProductUpdateDTO } from '../../models/product.interface';


export interface ProductsResponse {
  products: IProduct[];
  total: number;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsApiService {
  private apiService = inject(ApiService);

  // Products API Service
  public getProducts(limit: number = 30, offset: number = 0): Observable<IProduct[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.apiService.get<IProduct[]>('/products', params);
  }

  // Получение продуктов по категории с пагинацией
  public getProductsByCategory(categoryId: number, limit: number = 30, offset: number = 0): Observable<IProduct[]> {
    const params = new HttpParams()
      .set('categoryId', categoryId.toString())
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.apiService.get<IProduct[]>(`/categories/${categoryId}/products`, params);
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

  getProduct(id: number): Observable<IProduct> {
    return this.apiService.get<IProduct>(`/products/${id}`);
  }

  createProduct(productData: IProductUpdateDTO): Observable<IProduct> {
    return this.apiService.post<IProduct, IProductUpdateDTO>(`/products`, productData);
  }

  updateProduct(id: number, productData: IProductUpdateDTO): Observable<IProduct> {
    return this.apiService.put<IProduct, IProductUpdateDTO>(`/products/${id}`, productData);
  }

  deleteProduct(id: number): Observable<IProduct> {
    return this.apiService.delete<IProduct>(`/products/${id}`);
  }

  // Categories API Service
  public getCategories(limit: number = 50): Observable<ICategory[]> {
    const params = new HttpParams()
      .set('limit', limit.toString());
    return this.apiService.get<ICategory[]>('/categories', params);
  }

  getCategory(id: number): Observable<ICategory> {
    return this.apiService.get<ICategory>(`/categories/${id}`);
  }

  createCategory(categoryData: ICategoryUpdateDTO): Observable<ICategory> {
    return this.apiService.post<ICategory, ICategoryUpdateDTO>(`/categories`, categoryData);
  }

  updateCategory(id: number, categoryData: ICategoryUpdateDTO): Observable<ICategory> {
    return this.apiService.put<ICategory, ICategoryUpdateDTO>(`/categories/${id}`, categoryData);
  }

  deleteCategory(id: number): Observable<ICategory> {
    return this.apiService.delete<ICategory>(`/categories/${id}`);
  }
}
