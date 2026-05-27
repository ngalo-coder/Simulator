/**
 * Legacy API service adapter
 * @deprecated Use domain-specific services from './index' instead.
 * Kept for backward compatibility with existing components.
 *
 * UPDATED: Removed non-existent backend endpoint mappings.
 * See: frontend-optimization-plan.md
 */

import { authService } from './authService';
import { simulationService } from './simulationService';
import { userService } from './userService';
import { performanceService } from './performanceService';
import { adminService } from './adminService';
import { httpClient } from './httpClient';

// --- Auth utilities (kept for backward compatibility) ---

const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
};

const isTokenExpired = (): boolean => {
  try {
    const token = getAuthToken();
    if (!token) return true;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

const isTokenValid = (): boolean => {
  return !isTokenExpired();
};

export const api = {
  isAuthenticated: () => !isTokenExpired(),
  isTokenExpired: () => isTokenExpired(),
  isTokenValid: () => isTokenValid(),
  getTokenExpiryTime: () => {
    try {
      const token = getAuthToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch { return null; }
  },

  login: (email: any, pw: any) => authService.login(email, pw),
  register: (data: any) => authService.register(data),
  logout: () => authService.logout(),
  refreshToken: () => authService.refreshToken(),
  verifyToken: () => authService.verifyToken(),
  getCurrentUser: () => authService.getCurrentUser(),
  changePassword: (cur: any, newP: any) => authService.changePassword(cur, newP),

  getUsers: (p?: any) => userService.getUsers(p),
  getUserById: (id: string) => userService.getUserById(id),
  updateUser: (id: string, d: any) => userService.updateUser(id, d),
  deleteUser: (id: string) => userService.deleteUser(id),
  getUserProgress: () => performanceService.getPerformanceData(),

  getPrivacySettings: () => httpClient.get<{ success: boolean; data: any }>('/api/privacy/settings'),
  updatePrivacySettings: (s: any) => httpClient.put<{ success: boolean; data: any }>('/api/privacy/settings', s),
  exportData: (f?: string) => httpClient.get<Blob>(`/api/privacy/export${f ? `?format=${f}` : ''}`),
  exportUserData: (f?: string) => httpClient.get<Blob>(`/api/privacy/export${f ? `?format=${f}` : ''}`),
  deleteAccount: () => httpClient.delete<{ success: boolean; message: string }>('/api/privacy/account'),
  requestAccountDeletion: () => httpClient.delete<{ success: boolean; message: string }>('/api/privacy/account'),

  getCases: (filters?: Record<string, any>, signal?: AbortSignal) => simulationService.getCases(filters, signal),
  getCaseCategories: () => simulationService.getCaseCategories(),
  startSimulation: (cId: string, diff?: string) => simulationService.startSimulation(cId, diff),
  endSession: (sId: string) => simulationService.endSession(sId),
  getPerformanceMetricsBySession: (sId: string) => simulationService.getPerformanceMetricsBySession(sId),
  submitTreatmentPlan: (sId: string, p: any) => simulationService.submitTreatmentPlan(sId, p),
  getTreatmentOutcomes: (sId: string) => simulationService.getTreatmentOutcomes(sId),
  startRetakeSession: (cId: string, pSId?: string, r?: string) => simulationService.startRetakeSession(cId, pSId, r),
  getCaseRetakeSessions: (cId: string) => simulationService.getCaseRetakeSessions(cId),
  calculateImprovement: (oId: string, rId: string) => simulationService.calculateImprovement(oId, rId),
  calculateImprovementMetrics: (oId: string, rId: string) => simulationService.calculateImprovement(oId, rId),

  getPerformanceData: (userId?: string) => performanceService.getPerformanceData(userId),
  getLeaderboard: (p?: any) => performanceService.getLeaderboard(p),
  evaluate: (sId: string) => performanceService.evaluate(sId),
  submitFeedback: (d: any) => httpClient.post('/api/feedback', d),

  getAdminStats: (comprehensive?: boolean) => adminService.getDashboardStats(comprehensive),
  getSystemStats: (comprehensive?: boolean) => adminService.getDashboardStats(comprehensive),
  getAdminUserStats: (p?: any) => adminService.getDashboardStats(), // Alias for dashboard stats
  getAdminUsers: (p?: any) => adminService.getUsers(p),
  updateAdminUser: (id: string, d: any) => adminService.updateUser(id, d),
  deleteAdminUser: (id: string) => adminService.deleteUser(id),
  updateUserRole: (id: string, d: any) => adminService.updateUser(id, d),
  updateUserStatus: (id: string, d: any) => adminService.updateUser(id, d),
  getAuditLogs: (p?: any) => adminService.getAuditLogs(p),
  importUsers: async (csvFile: File) => { throw new Error('Not implemented'); },

  getUsersWithScores: (p?: any) => userService.getUsers(p),
  getTimeUntilExpiry: () => {
    const expiry = api.getTokenExpiryTime();
    return expiry ? expiry - Date.now() : null;
  },

  // Specialty visibility - kept (backend endpoint verified)
  getSpecialtyVisibility: () =>
    httpClient.get<{ success: boolean; data: { specialties: Array<{ specialtyId: string; isVisible: boolean; programAreas: string[]; programArea?: string; lastModified: string }> } }>('/api/admin/specialties/visibility-public'),
  updateSpecialtyVisibility: (s: any) =>
    httpClient.put<{ success: boolean; data: any; message: string }>('/api/admin/specialties/visibility', { specialties: s }),
  getAdminProgramAreasWithCounts: () =>
    httpClient.get<{ success: boolean; data: { programAreas: Array<{ name: string; casesCount: number }> } }>('/api/admin/programs/program-areas/counts-public'),
  getSpecialtyContext: () => {
    try {
      const stored = localStorage.getItem('currentSpecialtyContext');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  },
  setSpecialtyContext: (programArea: string, specialty: string) => {
    try {
      localStorage.setItem('currentSpecialtyContext', JSON.stringify({ programArea, specialty, timestamp: Date.now() }));
    } catch {}
  },
  clearSpecialtyContext: () => {
    try { localStorage.removeItem('currentSpecialtyContext'); } catch {}
  },
};

export default api;