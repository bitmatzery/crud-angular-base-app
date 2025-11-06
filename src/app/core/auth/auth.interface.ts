export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserDTO {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  avatar: string;
}
