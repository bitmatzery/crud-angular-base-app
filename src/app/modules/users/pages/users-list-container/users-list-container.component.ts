import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { BehaviorSubject, combineLatest, first, Subject, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
import { IUser } from '../../models/user.interface';
import { UsersListComponent } from '../../components/users-list/users-list.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { UpdateUserModalComponent } from '../../../dashboard/components/update-user/update-user-modal.component';

@Component({
  selector: 'users-list-container',
  standalone: true,
  imports: [CommonModule, UsersListComponent, ReactiveFormsModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService, DialogService],
  templateUrl: './users-list-container.component.html',
  styleUrls: ['./users-list-container.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListContainerComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private usersService = inject(UsersService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private dialogService = inject(DialogService);

  private destroy$ = new Subject<void>();
  private usersSubject = new BehaviorSubject<IUser[]>([]);
  private filterParamsSubject = new BehaviorSubject<string>('');

  // combineLatest для синхр. текущего списка users с фильтрованными параметрами для списка users
  public filteredUsers$ = combineLatest([
    this.usersSubject.asObservable(),
    this.filterParamsSubject.asObservable()
  ]).pipe(
    map(([users, filterParams]: [IUser[], string]) => this.filterUsers(users, filterParams))
  );

  ngOnInit() {
    // перезагружаем список users
    this.loadUsers();
    // взять queryParams при загрузке компонента и передать в навигацию, если они есть
    this.route.queryParams.pipe(first()).subscribe(params => {
      const filterParam: string = params['search'];
      if (filterParam) {
        this.OnFilteredUsersAndNavigate(filterParam);
      }
    });
  }

  // перезагрузить список users
  private loadUsers() {
    this.usersService.getUsers(22).pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.usersSubject.next(users);
    });
  }

  // фильтрация users для поиска
  private filterUsers(users: IUser[], filterParams: string): IUser[] {
    if (!filterParams.trim()) return users;
    const target = filterParams.toLowerCase();
    return users.filter(user =>
      user.name?.toLowerCase().includes(target) ||
      user.email?.toLowerCase().includes(target) ||
      user.role?.toLowerCase().includes(target)
    );
  }

  // Обработка параметров фильтрации users и параметров навигации, и навигация
  OnFilteredUsersAndNavigate(filterParam: string) {
    // Просто логируем параметры фильтрации
    console.log(`Filter Params = `, filterParam);
    // Обновляем параметры фильтрации
    this.filterParamsSubject.next(filterParam);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: filterParam },
      queryParamsHandling: 'merge'
    });
  }

  OnDeleteUser(deleteEvent: { event: Event; userId: number }) {
    this.confirmationService.confirm({
      target: deleteEvent.event.target as EventTarget,
      message: 'Вы уверены, что хотите удалить этого пользователя?',
      icon: 'pi pi-question-circle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.usersService.deleteUser(deleteEvent.userId).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Удалено', detail: 'Пользователь удалён' });
            const current = this.usersSubject.value;
            this.usersSubject.next(current.filter(u => u.id !== deleteEvent.userId));
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось удалить пользователя' });
          }
        });
      }
    });
  }

  OnEditUser(editEvent: { event: Event; userId: number }) {
    const user = this.usersSubject.value.find(u => u.id === editEvent.userId);
    if (!user) return;

    const ref = this.dialogService.open(UpdateUserModalComponent, {
      header: 'Edit User',
      closable: true,
      closeOnEscape: true,
      width: '500px',
      modal: true,
      draggable: false,
      resizable: false,
      data: { user },
    });

    ref?.onClose.pipe(takeUntil(this.destroy$)).subscribe((result: string) => {
      if (result === 'success') {
        this.loadUsers(); // перезагружаем список users
        this.messageService.add({
          severity: 'success',
          summary: 'Успех',
          detail: 'Пользователь обновлён',
        });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
