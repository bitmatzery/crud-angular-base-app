import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BehaviorSubject, catchError, finalize, of, Subject, takeUntil, tap} from 'rxjs';

// PrimeNG Modules
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {DialogModule} from 'primeng/dialog';
import {ToastModule} from 'primeng/toast';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TooltipModule} from 'primeng/tooltip';
import {AvatarModule} from 'primeng/avatar';
import {ConfirmationService, MessageService} from 'primeng/api';
import {RippleModule} from 'primeng/ripple';
import {DialogService} from 'primeng/dynamicdialog';

// Модели и сервисы
import {IUser} from '../../../users/models/user.interface';
import {UsersService} from '../../../users/services/users.service';
import {
  InfiniteScrollContainerComponent
} from '../../../../shared/common-ui/components-ui/infinite-scroll-container/infinite-scroll-container.component';
import {AddUserModalComponent} from '../../components/add-user/add-user-modal.component';
import {UpdateUserModalComponent} from '../../components/update-user/update-user-modal.component';


@Component({
  selector: 'dashboard-users',
  standalone: true,
  imports: [
    CommonModule,
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
  providers: [MessageService, ConfirmationService, DialogService],
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
  private dialogService = inject(DialogService);
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

  // Открытие модального окна добавления пользователя
  openAddUserModal(): void {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const ref = this.dialogService.open(AddUserModalComponent, {
      header: 'Add User',        // заголовок
      closable: true,            // показать кнопку закрытия
      closeOnEscape: true,       // закрытие по ESC
      width: '500px',
      modal: true,
      draggable: false,
      resizable: false,
      data: {theme: currentTheme}
    });

    ref?.onClose.subscribe((result: string) => {
      if (result === 'success') {
        this.loadInitialUsers();
        this.messageService.add({
          severity: 'success',
          summary: 'Успех',
          detail: 'Пользователь создан',
        });
      }
    });
  }

  // Открытие модального окна редактирования пользователя
  openEditUserModal(user: IUser): void {
    const ref = this.dialogService.open(UpdateUserModalComponent, {
      header: 'Edit User',
      closable: true,            // показать кнопку закрытия
      closeOnEscape: true,       // закрытие по ESC
      width: '500px',
      modal: true,
      draggable: false,
      resizable: false,
      data: {user},
    });

    ref?.onClose.subscribe((result: string) => {
      if (result === 'success') {
        this.loadInitialUsers();
        this.messageService.add({
          severity: 'success',
          summary: 'Успех',
          detail: 'Пользователь обновлён',
        });
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
            this.messageService.add({severity: 'success', summary: 'Удалено', detail: 'Пользователь удалён'});
            const current = this.usersSubject.value;
            this.usersSubject.next(current.filter(u => u.id !== userId));
            this.cdr.markForCheck();
          },
          error: () => {
            this.messageService.add({severity: 'error', summary: 'Ошибка', detail: 'Не удалось удалить пользователя'});
          }
        });
      }
    });
  }
}
