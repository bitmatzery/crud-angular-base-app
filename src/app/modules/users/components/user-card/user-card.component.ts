import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IUser} from '../../models/user.interface';


@Component({
  selector: 'users-user-card-ui',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  @Input({ required: true })
  user!: IUser;

  @Output() deleteUser = new EventEmitter();

  OnDeleteUser(userId: number) {
    this.deleteUser.emit(userId);
  }
}
