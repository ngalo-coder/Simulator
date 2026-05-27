/**
 * Progress, Performance & Achievement services
 * Uses the unified /api/progress resource endpoint.
 *
 * UPDATED: Removed non-existent backend endpoints:
 * - getAchievements, getActivity, getLearningEfficiency, adjustDifficulty,
 *   assessLearningStyle, getContextualHelp, searchHelp, getHelpCategories,
 *   downloadProgressReport
 *
 * Consolidated: getMetrics/ getPerformanceSummary -> unified getPerformanceData
 *
 * See: frontend-optimization-plan.md
 */
import { httpClient } from './httpClient';
import type { PerformanceMetrics } from '../types';

export const performanceService = {
  // ── Progress / Performance ──

  /**
   * Unified performance data method.
   * If userId is provided, fetches performance summary for that user.
   * Otherwise, fetches general performance data.
   */
  getPerformanceData: (userId?: string) =>
    userId
      ? httpClient.get<{ success: boolean; data: PerformanceMetrics[] }>(`/api/progress/performance-summary/${userId}`)
      : httpClient.get<{ success: boolean; data: any }>('/api/progress'),

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
};

export default performanceService;

