import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersListFilterComponent } from '../users-list-filter/users-list-filter.component';
import { UserCardComponent } from '../user-card/user-card.component';
import {IUser} from '../../models/user.interface';

@Component({
  selector: 'users-list-ui',
  standalone: true,
  imports: [CommonModule, UsersListFilterComponent, UserCardComponent],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent {
  @Input({ required: true }) users!: IUser[];

  @Output() deleteUser = new EventEmitter();
  @Output() filterUsers = new EventEmitter();

  OnDeleteUser(userId: number) {
    this.deleteUser.emit(userId);
  }

  OnFilteredUsers(event: { name: string }) {
    this.filterUsers.emit(event);
  }
}
