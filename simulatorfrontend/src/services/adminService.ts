/**
 * Admin API services
 * Uses the unified /api/users, /api/dashboard, /api/cases, /api/analytics resource endpoints.
 *
 * UPDATED: Removed non-existent backend endpoints:
 * - adminResetPassword, getAdminStatistics, exportUsers, getPrograms,
 *   createProgram, updateProgram, deleteProgram, getContributions,
 *   approveContribution, rejectContribution, getSpecialtyVisibility,
 *   updateSpecialtyVisibility, getAdminProgramAreasWithCounts
 *
 * Consolidated: getStats / getComprehensiveStats -> unified getDashboardStats
 *
 * See: frontend-optimization-plan.md
 */
import { httpClient } from './httpClient';

export const adminService = {
  // ── Dashboard / Stats ──

  /**
   * Unified dashboard stats method.
   * If comprehensive is true, fetches full dashboard data.
   * Otherwise, fetches basic stats.
   */
  getDashboardStats: (comprehensive: boolean = false) =>
    comprehensive
      ? httpClient.get<{ success: boolean; data: any }>('/api/dashboard')
      : httpClient.get<{ success: boolean; data: any }>('/api/dashboard/stats'),

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

  // ── Audit Logs (via /api/auth) ──

  getAuditLogs: (params?: { page?: number; limit?: number; event?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.event) searchParams.set('event', params.event);
    const qs = searchParams.toString();
    return httpClient.get<{ success: boolean; logs: any[] }>(`/api/auth/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },
};

export default adminService;

