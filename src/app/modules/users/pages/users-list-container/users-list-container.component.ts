import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, ViewEncapsulation,} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ReactiveFormsModule} from '@angular/forms';
import {UsersService} from '../../services/users.service';
import {BehaviorSubject, first, map, Observable, switchMap} from 'rxjs';
import {IUser} from '../../models/user.interface';
import {UsersListComponent} from '../../components/users-list/users-list.component';

@Component({
  selector: 'users-list-container',
  standalone: true,
  imports: [
    CommonModule,
    UsersListComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './users-list-container.component.html',
  styleUrls: ['./users-list-container.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListContainerComponent implements OnInit, OnDestroy {
  usersService: UsersService = inject(UsersService)
  public readonly users$ = this.usersService.getUsers(22)

  private filterParamsSubject = new BehaviorSubject<string>('');

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute); // Доступ к параметрам маршрута

  // Отфильтрованные users
  public filteredUsers$ = this.filterParamsSubject.asObservable().pipe(
    switchMap(filterParams => this.filterUsers(filterParams))
  );

  ngOnInit() {
    // взять queryParams при загрузке компонента и передать в навигацию, если они есть
    this.route.queryParams.pipe(first()).subscribe(params => {
      const filterParam: string = params['search'];
      if (filterParam) {
        this.onFilteredUsersAndNavigate(filterParam);
      }
    });

  }

  private filterUsers(filterParams: string): Observable<IUser[]> {
    return this.users$.pipe(
      map(users => {
        if (!filterParams.trim()) {
          return users; // возвращаем всех если строка пустая
        }

        const target = filterParams.toLowerCase();
        return users.filter(user =>
          user.name?.toLowerCase().includes(target) ||
          user.email?.toLowerCase().includes(target) ||
          user.role?.toLowerCase().includes(target)
        );
      })
    );
  }

  // Type guard для проверки ключей
  private isUserKey(key: string): key is keyof IUser {
    return ['id', 'name', 'email', 'role', 'avatar', 'creationAt', 'updatedAt'].includes(key);
  }

  // Обработка параметров фильтрации продуктов и параметров навигации, и навигация
   onFilteredUsersAndNavigate(filterParam: string) {
    console.log(`Filter Params = `, filterParam); // Просто логируем параметры фильтрации

    // Обновляем параметры фильтрации
    this.filterParamsSubject.next(filterParam);

    // Определяем текущий маршрут
    const currentRoute = this.route.snapshot.url.map(segment => segment.path).join('/');

    // Навигация с корректными параметрами
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {search: filterParam},
      queryParamsHandling: 'merge'
    });
  }

  OnDeleteUser(id: number) {

  }

  ngOnDestroy() {
    this.filteredUsers$ = this.users$
  }
}
