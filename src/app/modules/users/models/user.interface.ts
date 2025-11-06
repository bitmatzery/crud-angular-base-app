export interface IUser {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  avatar: string;
  creationAt: string;
  updatedAt: string;
}

export interface IUserUpdateDTO {
  email: string;
  name: string;
  password: string;
  role: string;
  avatar: string;
}

export type UserFilter = {
  [key: string]: string;
};
