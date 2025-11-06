import {inject, Injectable} from '@angular/core';
import {ApiService} from '../../../core/http/api.service';
import {HttpParams} from '@angular/common/http';
import {IUser, IUserUpdateDTO} from '../models/user.interface';
import {catchError, of} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  apiService = inject(ApiService);

  public getUsers(limit: number = 10) {
    const params = new HttpParams()
      .set('limit', `${limit}`)
      .set('offset', `1`)

    return this.apiService.get<IUser[]>('/users', params).pipe(
      catchError(error => {
        console.error('Ошибка при загрузке пользователей:', error);
        // Возвращаем пустой массив или другое значение по умолчанию
        return of([]);
      })
    )
  }

  public postUsers(userData: IUserUpdateDTO[]) {
    return this.apiService.post<IUser[], IUserUpdateDTO[]>(`/users`, userData)
  }

  public putUser(id: number, userData: IUserUpdateDTO) {
    return this.apiService.put<IUser, IUserUpdateDTO>(`/users/${id}`, userData);
  }

  public deleteUser(id: number) {
    return this.apiService.delete<IUser>(`/users/${id}`)
  }
}
