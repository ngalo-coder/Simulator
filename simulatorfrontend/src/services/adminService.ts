/**
 * Admin API services
 * Uses the unified /api/users, /api/dashboard, /api/cases, /api/analytics resource endpoints.
 */
import { httpClient } from './httpClient';

export const adminService = {
  // ── Dashboard / Stats ──

  getStats: () =>
    httpClient.get<{ success: boolean; data: any }>('/api/dashboard/stats'),

  getComprehensiveStats: () =>
    httpClient.get<{ success: boolean; data: any }>('/api/dashboard'),

  // ── User Management (via /api/users) ──

  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.role) searchParams.set('role', params.role);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return httpClient.get<{ success: boolean; users: any[]; pagination?: any }>(
      `/api/users${qs ? `?${qs}` : ''}`
    );
  },

  updateUser: (userId: string, data: any) =>
    httpClient.put<{ success: boolean; message: string; data: any }>(`/api/users/${userId}`, data),

  deleteUser: (userId: string) =>
    httpClient.delete<{ success: boolean; message: string }>(`/api/users/${userId}`),

  adminResetPassword: (userId: string, newPassword: string) =>
    httpClient.post<{ success: boolean; message: string }>(`/api/users/admin/reset-password/${userId}`, { newPassword }),

  getAdminStatistics: () =>
    httpClient.get<{ success: boolean; statistics: any }>('/api/users/admin/statistics'),

  exportUsers: (filters?: Record<string, any>) => {
    const searchParams = new URLSearchParams(filters || {});
    const qs = searchParams.toString();
    return httpClient.get<Blob>(`/api/users/admin/export${qs ? `?${qs}` : ''}`);
  },

  // ── Programs Management ──

  getPrograms: () =>
    httpClient.get<{ success: boolean; data: any[] }>('/api/admin/programs'),

  createProgram: (data: any) =>
    httpClient.post<{ success: boolean; data: any }>('/api/admin/programs', data),

  updateProgram: (programId: string, data: any) =>
    httpClient.put<{ success: boolean; data: any }>(`/api/admin/programs/${programId}`, data),

  deleteProgram: (programId: string) =>
    httpClient.delete<{ success: boolean; message: string }>(`/api/admin/programs/${programId}`),

  // ── Contributions ──

  getContributions: (params?: { status?: string }) => {
    const qs = params?.status ? `?status=${params.status}` : '';
    return httpClient.get<{ success: boolean; data: any[] }>(`/api/admin/contributions${qs}`);
  },

  approveContribution: (contributionId: string) =>
    httpClient.post<{ success: boolean; message: string }>(`/api/admin/contributions/${contributionId}/approve`),

  rejectContribution: (contributionId: string, reason?: string) =>
    httpClient.post<{ success: boolean; message: string }>(`/api/admin/contributions/${contributionId}/reject`, { reason }),

  // ── Audit Logs (via /api/auth) ──

  getAuditLogs: (params?: { page?: number; limit?: number; event?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.event) searchParams.set('event', params.event);
    const qs = searchParams.toString();
    return httpClient.get<{ success: boolean; logs: any[] }>(`/api/auth/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },

  // ── Specialty Visibility ──

  getSpecialtyVisibility: () =>
    httpClient.get<{ success: boolean; data: { specialties: Array<{ specialtyId: string; isVisible: boolean; programArea: string; lastModified: string; modifiedBy: string }> } }>('/api/admin/specialties/visibility'),

  updateSpecialtyVisibility: (specialties: Array<{ specialtyId: string; isVisible: boolean; programArea?: string }>) =>
    httpClient.put<{ success: boolean; data: any; message: string }>('/api/admin/specialties/visibility', { specialties }),

  getAdminProgramAreasWithCounts: () =>
    httpClient.get<{ success: boolean; data: { programAreas: Array<{ name: string; casesCount: number }> } }>('/api/admin/programs/program-areas/counts'),
};

export default adminService;
