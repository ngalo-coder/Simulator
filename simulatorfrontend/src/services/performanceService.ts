/**
 * Progress, Performance & Achievement services
 * Uses the unified /api/progress resource endpoint.
 */
import { httpClient } from './httpClient';
import type { PerformanceMetrics } from '../types';

export const performanceService = {
  // ── Progress / Performance ──

  getPerformanceData: () =>
    httpClient.get<{ success: boolean; data: any }>('/api/progress'),

  getPerformanceSummary: (userId: string) =>
    httpClient.get<{ success: boolean; data: any }>(`/api/progress/performance-summary/${userId}`),

  getMetrics: (userId: string) =>
    httpClient.get<{ success: boolean; data: PerformanceMetrics[] }>(`/api/progress/performance-summary/${userId}`),

  evaluate: (sessionId: string) =>
    httpClient.post<{ success: boolean; data: any }>('/api/progress/record-evaluation', { sessionId }),

  // ── Leaderboard ──

  getLeaderboard: (params?: { specialty?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.specialty) searchParams.set('specialty', params.specialty);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return httpClient.get<{ success: boolean; data: any[] }>(`/api/progress/leaderboard${qs ? `?${qs}` : ''}`);
  },

  // ── Achievements & Activity ──

  getAchievements: () =>
    httpClient.get<{ success: boolean; data: any[] }>('/api/progress/achievements'),

  getActivity: (limit?: number) => {
    const qs = limit ? `?limit=${limit}` : '';
    return httpClient.get<{ success: boolean; data: any[] }>(`/api/progress/activity${qs}`);
  },

  // ── Adaptive Learning ──

  getLearningEfficiency: () =>
    httpClient.get<{ success: boolean; data: any }>('/api/progress/learning-efficiency'),

  adjustDifficulty: (caseId: string, performanceScore: number) =>
    httpClient.post<{ success: boolean; data: any }>('/api/progress/adjust-difficulty', { caseId, performanceScore }),

  assessLearningStyle: () =>
    httpClient.get<{ success: boolean; data: any }>('/api/progress/learning-style'),

  // ── Help & Guidance ──

  getContextualHelp: (context: { page?: string; caseId?: string; difficulty?: string }) =>
    httpClient.get<{ success: boolean; data: any }>('/api/progress/help/contextual', { params: context }),

  searchHelp: (query: string) =>
    httpClient.get<{ success: boolean; data: any }>(`/api/progress/help/search?q=${encodeURIComponent(query)}`),

  getHelpCategories: () =>
    httpClient.get<{ success: boolean; data: any }>('/api/progress/help/categories'),

  // ── Report Download ──

  downloadProgressReport: (format?: string, timeRange?: string) => {
    const params = new URLSearchParams();
    if (format) params.set('format', format);
    if (timeRange) params.set('timeRange', timeRange);
    const qs = params.toString();
    return httpClient.get<Blob>(`/api/progress/download-pdf${qs ? `?${qs}` : ''}`);
  },
};

export default performanceService;
