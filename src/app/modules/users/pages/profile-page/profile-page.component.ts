import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { UsersService } from '../../services/users.service';
import { UserPreferencesService } from '../../services/user-preferences.service';
import { Order, OrderService } from '../../../../core/cart/order.service';
import { IUser } from '../../models/user.interface';

@Component({
  selector: 'profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private userPrefs = inject(UserPreferencesService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  user: IUser | null = null;
  userRole$ = this.authService.userRole$;
  profileForm: FormGroup | null = null; // инициализируем позже
  isUpdating = false;
  avatarPreview: string | null = null;
  defaultAvatar = 'assets/images/svg/default-avatar.svg';
  receiveAds = false;
  orders: Order[] = [];

  ngOnInit(): void {
    // Создаём пустую форму сразу, чтобы избежать ошибки
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      role: [{ value: 'user', disabled: true }]
    });

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user as IUser;
        this.patchFormValues(this.user);
        this.avatarPreview = this.user.avatar || this.defaultAvatar;
      }
    });
    this.userPrefs.receiveAds$.subscribe(val => this.receiveAds = val);
    this.loadOrders();
  }

  private patchFormValues(user: IUser): void {
    const currentUser = this.authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'admin';
    const roleControl = this.profileForm?.get('role');

    // Временно включаем поле, чтобы установить значение
    if (roleControl) roleControl.enable();
    this.profileForm?.patchValue({
      name: user.name,
      email: user.email,
      role: user.role
    });
    // Возвращаем состояние disabled
    if (roleControl) {
      isAdmin ? roleControl.enable() : roleControl.disable();
    }
  }

  updateProfile(): void {
    if (!this.profileForm?.valid) return;
    this.isUpdating = true;
    const formValue = this.profileForm.getRawValue();
    const updatedUser: IUser = {
      ...this.user!,
      name: formValue.name,
      email: formValue.email,
      password: formValue.password || this.user!.password,
      role: formValue.role || this.user!.role,
      avatar: this.avatarPreview || this.user!.avatar
    };
    this.usersService.putUser(updatedUser.id, {
      email: updatedUser.email,
      name: updatedUser.name,
      password: updatedUser.password,
      role: updatedUser.role,
      avatar: updatedUser.avatar
    }).subscribe({
      next: (result) => {
        this.isUpdating = false;
        this.authService.updateLocalUser(result);
      },
      error: () => {
        this.isUpdating = false;
      }
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processAvatarFile(input.files[0]);
    }
  }

  onAvatarDropped(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.processAvatarFile(file);
  }

  private processAvatarFile(file: File): void {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  toggleReceiveAds(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.userPrefs.setReceiveAds(checked);
  }

  loadOrders(): void {
    this.orders = this.orderService.getLastOrders(3);
  }

  logout(): void {
    this.authService.logout();
  }
}
