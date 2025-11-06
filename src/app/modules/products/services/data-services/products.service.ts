import { inject, Injectable } from '@angular/core';
import { catchError, of } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import {ApiService} from '../../../../core/http/api.service';
import {CategoryDTO, ProductDTO} from '../../models/data-dto/product-dto-model';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  apiService = inject(ApiService);

  public getProducts(limit: number = 10) {
    const params = new HttpParams()
      .set('limit', `${limit}`)
      .set('offset', '1');

    return this.apiService.get<ProductDTO[]>('/products', params).pipe(
      catchError(error => {
        console.error('Ошибка при загрузке продуктов:', error);
        // Возвращаем пустой массив или другое значение по умолчанию
        return of([]);
      })
    );
  }

  public getCategories(limit: number = 5) {
    const params = new HttpParams()
      .set('limit', `${limit}`);
    return this.apiService.get<CategoryDTO[]>('/categories', params).pipe(
      catchError(error => {
        console.error('Ошибка при загрузке категорий:', error);
        // Возвращаем пустой массив или другое значение по умолчанию
        return of([]);
      })
    );
  }

  constructor() {
  }
}
