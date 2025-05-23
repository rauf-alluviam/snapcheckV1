export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  customRole?: string;
  permissions?: string[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}
