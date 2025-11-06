import {
  ChangeDetectionStrategy,
  Component, computed,
  EventEmitter,
  inject,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import {IUser, UserFilter} from '../../models/user.interface';

@Component({
  selector: 'users-list-filter',
  standalone: true,
  templateUrl: './users-list-filter.component.html',
  styleUrls: ['./users-list-filter.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatTooltipModule
  ]
})
export class UsersListFilterComponent {
  @Output() filterUsers = new EventEmitter();
  protected filterName = '';
  private readonly router = inject(Router);

  OnFilteredUsers(): void {
    if (!this.filterName.trim()) {
      this.clearFilterName();
      return;
    }

    this.filterUsers.emit(this.filterName);
  }

  clearFilterName() {
    this.filterName = '';
    this.filterUsers.emit('');
    this.router.navigate(['/users']);
  }
}
