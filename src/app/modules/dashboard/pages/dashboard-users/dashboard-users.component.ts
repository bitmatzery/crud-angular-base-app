import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, finalize, of, Subject, takeUntil, tap } from 'rxjs';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';

// Модели и сервисы
import {IUser, IUserUpdateDTO} from '../../../users/models/user.interface';
import { UsersService } from '../../../users/services/users.service';
import {
  InfiniteScrollContainerComponent
} from '../../../../shared/common-ui/components-ui/infinite-scroll-container/infinite-scroll-container.component';

@Component({
  selector: 'dashboard-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ToastModule,
    ConfirmPopupModule,
    ProgressSpinnerModule,
    TooltipModule,
    AvatarModule,
    RippleModule,
    InfiniteScrollContainerComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './dashboard-users.component.html',
  styleUrls: ['./dashboard-users.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardUsersComponent implements OnInit, OnDestroy {
  private usersService = inject(UsersService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Данные и состояния
  private usersSubject = new BehaviorSubject<IUser[]>([]);
  users$ = this.usersSubject.asObservable();

  private initialLoadingSubject = new BehaviorSubject<boolean>(false);
  initialLoading$ = this.initialLoadingSubject.asObservable();

  private loadingMoreSubject = new BehaviorSubject<boolean>(false);
  loadingMore$ = this.loadingMoreSubject.asObservable();

  private hasMoreSubject = new BehaviorSubject<boolean>(true);
  hasMore$ = this.hasMoreSubject.asObservable();

  private currentPage = 0;
  private readonly itemsPerPage = 20;

  // Для модальных окон
  displayAddDialog = false;
  displayEditDialog = false;
  selectedUser: IUser | null = null;
  userForm = this.createFormGroup();

  // Сохраняем позицию скролла
  private scrollPosition = 0;

  displayedColumns: string[] = ['id', 'role', 'name', 'email', 'creationAt', 'avatar', 'actions'];

  ngOnInit(): void {
    this.loadInitialUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFormGroup() {
    return new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      name: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      role: new FormControl('', Validators.required),
      avatar: new FormControl(''),
    });
  }

  // Метод для получения URL аватара
  getAvatarUrl(user: IUser): string {
    if (user.avatar && user.avatar.trim()) {
      return user.avatar;
    }
    // SVG заглушка с инициалами
    const initials = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%234C9AFF"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="white" text-anchor="middle" dy=".3em"%3E${initials}%3C/text%3E%3C/svg%3E`;
  }

  // Метод для получения инициалов
  getInitials(name: string): string {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }

// Метод для получения цвета аватарки на основе имени
  getAvatarColor(name: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7B05E'];
    const index = name.length % colors.length;
    return colors[index];
  }

  // Загрузка начальных пользователей
  loadInitialUsers(): void {
    this.initialLoadingSubject.next(true);
    this.currentPage = 0;

    this.usersService.getUsers(this.itemsPerPage).pipe(
      tap(users => {
        this.usersSubject.next(users);
        this.hasMoreSubject.next(users.length === this.itemsPerPage);
        this.currentPage = 1;
      }),
      catchError(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось загрузить пользователей',
          life: 3000,
        });
        this.usersSubject.next([]);
        return of([]);
      }),
      finalize(() => {
        this.initialLoadingSubject.next(false);
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  // Загрузка дополнительных пользователей
  loadMoreUsers(): void {
    if (this.loadingMoreSubject.value || !this.hasMoreSubject.value) return;

    this.loadingMoreSubject.next(true);
    const offset = this.currentPage * this.itemsPerPage;

    this.saveScrollPosition();

    this.usersService.getUsers(this.itemsPerPage).pipe(
      tap(newUsers => {
        const current = this.usersSubject.value;
        const updated = [...current, ...newUsers];
        this.usersSubject.next(updated);
        this.hasMoreSubject.next(newUsers.length === this.itemsPerPage);
        if (newUsers.length > 0) this.currentPage++;

        setTimeout(() => this.restoreScrollPosition(), 0);
      }),
      catchError(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось загрузить дополнительных пользователей',
          life: 3000,
        });
        return of([]);
      }),
      finalize(() => {
        this.loadingMoreSubject.next(false);
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  private saveScrollPosition(): void {
    const container = document.querySelector('.scroll-container');
    if (container) this.scrollPosition = container.scrollTop;
  }

  private restoreScrollPosition(): void {
    const container = document.querySelector('.scroll-container');
    if (container) container.scrollTop = this.scrollPosition;
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const threshold = 100;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < threshold) {
      this.loadMoreUsers();
    }
  }

  onLoadMore(): void {
    this.loadMoreUsers();
  }

  // Модальное окно добавления
  openAddUserModal(): void {
    this.userForm.reset();
    this.displayAddDialog = true;
  }

  addUser(): void {
    if (this.userForm.invalid) return;

    const formValue = this.userForm.value;
    const newUser: IUserUpdateDTO = {
      email: formValue.email || '',
      name: formValue.name || '',
      password: formValue.password || '',
      role: formValue.role || '',
      avatar: formValue.avatar || ''
    };

    this.usersService.postUsers([newUser]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Успех', detail: 'Пользователь создан' });
        this.displayAddDialog = false;
        this.loadInitialUsers();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось создать пользователя' });
      }
    });
  }

  // Модальное окно редактирования
  openEditUserModal(user: IUser): void {
    this.selectedUser = user;
    this.userForm.patchValue({
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      password: ''
    });
    this.displayEditDialog = true;
  }

  updateUser(): void {
    if (this.userForm.invalid || !this.selectedUser) return;

    const formValue = this.userForm.value;

    // Создаем объект без password, если он не введен
    const updatedData: IUserUpdateDTO = {
      email: formValue.email || '',
      name: formValue.name || '',
      role: formValue.role || '',
      avatar: formValue.avatar || '',
      password: formValue.password || '',
    };

    // Добавляем password только если он введен
    if (formValue.password === '' && formValue.password.trim()) {
      updatedData.password = '0000';
    }

    this.usersService.putUser(this.selectedUser.id, updatedData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Успех', detail: 'Пользователь обновлён' });
        this.displayEditDialog = false;
        this.selectedUser = null;
        this.loadInitialUsers();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось обновить пользователя' });
      }
    });
  }

  // Удаление с подтверждением
  deleteUser(event: Event, userId: number): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Вы уверены, что хотите удалить этого пользователя?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.usersService.deleteUser(userId).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Удалено', detail: 'Пользователь удалён' });
            const current = this.usersSubject.value;
            this.usersSubject.next(current.filter(u => u.id !== userId));
            this.cdr.markForCheck();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось удалить пользователя' });
          }
        });
      }
    });
  }

  // Отмена модалок
  closeDialogs(): void {
    this.displayAddDialog = false;
    this.displayEditDialog = false;
    this.selectedUser = null;
    this.userForm.reset();
  }
}
