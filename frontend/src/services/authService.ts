import api from './api';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ProfileUpdateData,
  User,
} from '../types/auth';

const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  register: async (payload: RegisterData): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/auth/forgotpassword', { email });
    return data;
  },

  resetPassword: async (
    token: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.put(`/auth/resetpassword/${token}`, { password });
    return data;
  },

  getProfile: async (): Promise<{ success: boolean; data: User }> => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  updateProfile: async (
    payload: ProfileUpdateData
  ): Promise<{ success: boolean; data: Partial<User> }> => {
    const { data } = await api.put('/auth/profile', payload);
    return data;
  },
};

export default authService;
