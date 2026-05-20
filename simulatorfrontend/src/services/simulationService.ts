/**
 * Simulation & Cases API services
 * Uses the unified /api/simulations and /api/cases resource endpoints.
 */
import { httpClient } from './httpClient';
import type { PatientCase, CaseCategories, SessionEndResponse, SimulationSession } from '../types';

export const simulationService = {
  // ── Cases ──

  getCases: (filters?: Record<string, any>, signal?: AbortSignal) => {
    let endpoint = '/api/cases';
    if (filters) {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '' && value !== null)
      );
      const queryString = Object.entries(cleanFilters)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      if (queryString) endpoint += `?${queryString}`;
    }
    return httpClient.get<{ success: boolean; data: { cases: PatientCase[]; currentPage: number; totalPages: number; totalCases: number; hasNextPage: boolean; hasPrevPage: boolean } }>(endpoint, signal);
  },

  getCaseById: (caseId: string) =>
    httpClient.get<{ success: boolean; data: PatientCase }>(`/api/cases/${caseId}`),

  getCaseCategories: () =>
    httpClient.get<{ success: boolean; data: CaseCategories }>('/api/simulations/categories'),

  // ── Simulation Sessions ──

  startSimulation: (caseId: string, difficulty?: string) =>
    httpClient.post<{ success: boolean; data: { sessionId: string; initialPrompt: string; patientName: string; speaks_for: string } }>(
      '/api/simulations', { caseId, difficulty }
    ),

  getAskStreamUrl: (sessionId: string, question: string): string => {
    const baseUrl = httpClient.getBaseUrl();
    const token = httpClient.getAuthToken();
    return `${baseUrl}/api/simulations/ask?sessionId=${sessionId}&question=${encodeURIComponent(question)}&token=${token}`;
  },

  endSession: (sessionId: string) =>
    httpClient.post<{ success: boolean; data: SessionEndResponse }>(`/api/simulations/${sessionId}/end`),

  getPerformanceMetricsBySession: (sessionId: string) =>
    httpClient.get<{ success: boolean; data: any }>(`/api/simulations/${sessionId}/performance`),

  submitTreatmentPlan: (sessionId: string, treatmentPlan: any) =>
    httpClient.post<{ success: boolean; data: any }>(`/api/simulations/${sessionId}/treatment-plan`, treatmentPlan),

  getTreatmentOutcomes: (sessionId: string) =>
    httpClient.get<{ success: boolean; data: any }>(`/api/simulations/${sessionId}/treatment-outcomes`),

  // ── Retake Sessions ──

  startRetakeSession: (caseId: string, previousSessionId?: string, retakeReason?: string) =>
    httpClient.post<{ success: boolean; data: any }>('/api/simulations/retakes', {
      caseId, previousSessionId, retakeReason,
    }),

  getCaseRetakeSessions: (caseId: string) =>
    httpClient.get<{ success: boolean; data: SimulationSession[] }>(`/api/simulations/retakes/${caseId}`),

  calculateImprovement: (originalSessionId: string, retakeSessionId: string) =>
    httpClient.post<{ success: boolean; data: any }>('/api/simulations/retakes/calculate-improvement', {
      originalSessionId, retakeSessionId,
    }),
};

export default simulationService;
