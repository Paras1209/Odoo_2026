export type UserRole =
  | 'admin'
  | 'fleet_manager'
  | 'driver'
  | 'safety_officer'
  | 'financial_analyst'
  | 'employee';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  password?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
