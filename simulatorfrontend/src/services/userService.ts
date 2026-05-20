/**
 * User & Profile API services
 * Uses the unified /api/users resource endpoint.
 */
import { httpClient } from './httpClient';
import type { User, UsersResponse } from '../types';

export const userService = {
  // ── User Management ──

  getUsers: (params?: { page?: number; limit?: number; role?: string; discipline?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.role) searchParams.set('role', params.role);
    if (params?.discipline) searchParams.set('discipline', params.discipline);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return httpClient.get<UsersResponse>(`/api/users${qs ? `?${qs}` : ''}`);
  },

  getUserById: (userId: string) =>
    httpClient.get<{ success: boolean; data: User }>(`/api/users/${userId}`),

  updateUser: (userId: string, data: Partial<User>) =>
    httpClient.put<{ success: boolean; message: string; data: User }>(`/api/users/${userId}`, data),

  deleteUser: (userId: string) =>
    httpClient.delete<{ success: boolean; message: string }>(`/api/users/${userId}`),

  // ── Profile ──

  getProfile: (userId: string) =>
    httpClient.get<{ success: boolean; data: any }>(`/api/users/${userId}/profile`),

  updateProfile: (userId: string, data: any) =>
    httpClient.put<{ success: boolean; data: any }>(`/api/users/${userId}/profile`, data),

  completeProfile: (userId: string, data: any) =>
    httpClient.post<{ success: boolean; data: any }>(`/api/users/${userId}/complete-profile`, data),

  // ── Preferences ──

  getPreferences: (userId: string) =>
    httpClient.get<{ success: boolean; data: any }>(`/api/users/${userId}/preferences`),

  updatePreferences: (userId: string, settings: any) =>
    httpClient.put<{ success: boolean; data: any }>(`/api/users/${userId}/preferences`, settings),

  deletePreferences: (userId: string) =>
    httpClient.delete<{ success: boolean; data: any; message: string }>(`/api/users/${userId}/preferences`),

  // ── Registration Utilities ──

  getDisciplines: () =>
    httpClient.get<{ success: boolean; disciplines: any[] }>('/api/users/disciplines'),

  getRoles: () =>
    httpClient.get<{ success: boolean; roles: any[] }>('/api/users/roles'),

  getRegistrationConfig: () =>
    httpClient.get<{ success: boolean; config: any }>('/api/users/registration-config'),
};

export default userService;
