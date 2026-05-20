/**
 * Authentication API service
 */
import { httpClient } from './httpClient';

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: any;
  redirectTo?: string;
  expiresIn?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  institution: string;
  username?: string;
  discipline?: string;
  primaryRole?: string;
}

export const authService = {
  login: (email: string, password: string) => 
    httpClient.post<LoginResponse>('/api/auth/login', { email, password }),

  loginWithUsername: (username: string, password: string) =>
    httpClient.post<LoginResponse>('/api/auth/login', { username, password }),

  register: (data: RegisterData) =>
    httpClient.post<LoginResponse & { user: any }>('/api/auth/register', data),

  logout: () =>
    httpClient.post<{ success: boolean; message: string }>('/api/auth/logout'),

  refreshToken: () =>
    httpClient.post<LoginResponse>('/api/auth/refresh'),

  verifyToken: () =>
    httpClient.get<{ success: boolean; message: string; user: any }>('/api/auth/verify'),

  getCurrentUser: () =>
    httpClient.get<{ success: boolean; user: any }>('/api/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    httpClient.post<{ success: boolean; message: string }>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    }),
};

export default authService;
