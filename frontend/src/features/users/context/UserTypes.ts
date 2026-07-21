export interface UserItem {
  id: string;
  uid: string;
  username: string;
  role: string;
  name: string;
  created_at: string;
}

export interface CreateUserPayload {
  username: string;
  name: string;
  role: string;
  password: string;
}

export interface UpdateUserPayload {
  name: string;
  role: string;
  password?: string;
}
