import {IUser} from '../../models/user.interface';

export type UsersFilter = {
  name: string;
  email: string;
  role: string;
};

export type UsersListVM = {
  users: IUser[],
  filterParams: UsersFilter
}
