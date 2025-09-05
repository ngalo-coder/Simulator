import { PatientCase, PerformanceData, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';
const USE_MOCK_DATA = false;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Enhanced error types
export class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public code?: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Auth utilities
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch (e) {
    return null;
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  
  headers.append('Content-Type', 'application/json');

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.reload();
      throw new ApiError('Authentication required', 401, 'AUTH_REQUIRED', false);
    }
    
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retryCount + 1));
      return authenticatedFetch(url, options, retryCount + 1);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Request failed',
        response.status,
        errorData.code || 'UNKNOWN_ERROR',
        response.status >= 500 && retryCount < MAX_RETRIES
      );
    }
    
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error', 0, 'NETWORK_ERROR', retryCount < MAX_RETRIES);
  }
};

// Mock data for development
const mockData = {
  users: [
    { id: '1', username: 'demo_user', email: 'demo@example.com', role: 'user' as const },
    { id: '2', username: 'admin', email: 'admin@example.com', role: 'admin' as const }
  ],
  cases: [
    {
      id: '1',
      title: 'Acute Myocardial Infarction',
      description: 'A 65-year-old male presents with chest pain and shortness of breath',
      category: 'Emergency',
      program_area: 'undergraduate',
      specialized_area: 'Cardiology',
      patient_age: 65,
      patient_gender: 'Male',
      chief_complaint: 'Chest pain',
      presenting_symptoms: ['Chest pain', 'Shortness of breath', 'Sweating'],
      tags: ['cardiology', 'emergency', 'MI']
    },
    {
      id: '2',
      title: 'Type 2 Diabetes Management',
      description: 'A 45-year-old female with newly diagnosed Type 2 diabetes',
      category: 'Chronic Care',
      program_area: 'undergraduate',
      specialized_area: 'Endocrinology',
      patient_age: 45,
      patient_gender: 'Female',
      chief_complaint: 'High blood sugar',
      presenting_symptoms: ['Polyuria', 'Polydipsia', 'Fatigue'],
      tags: ['diabetes', 'endocrinology', 'management']
    },
  ] as PatientCase[],
  performanceData: {
    overallStats: {
      totalEvaluations: 12,
      excellentCount: 8,
      goodCount: 3,
      needsImprovementCount: 1,
      excellentRate: '67%'
    },
    specialtyStats: {
      'Cardiology': { totalCases: 3, excellentCount: 2, averageScore: 85 },
      'Endocrinology': { totalCases: 2, excellentCount: 2, averageScore: 92 },
    },
    contributorStatus: {
      isEligible: true,
      eligibleSpecialties: ['Cardiology', 'Endocrinology'],
      qualificationDate: new Date('2024-01-15')
    },
    contributionStats: {
      totalSubmissions: 3,
      approvedSubmissions: 2,
      rejectedSubmissions: 0,
      pendingSubmissions: 1
    },
    recentEvaluations: [
      { caseTitle: 'Type 2 Diabetes Management', specialty: 'Endocrinology', rating: 'Excellent', score: 94, completedAt: new Date('2024-01-20') },
    ]
  } as PerformanceData,
};

export const apiService = {
  // Enhanced auth APIs with better error handling
  login: async (email: string, password: string) => {
    if (USE_MOCK_DATA) {
      await delay(1000);
      const user = email === 'admin@example.com' ? mockData.users[1] : mockData.users[0];
      return {
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          user
        }
      };
    }
    
    const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    return response.json();
  },

  register: async (username: string, email: string, password: string) => {
    if (USE_MOCK_DATA) {
      await delay(1000);
      const user = { id: '1', username, email, role: 'user' as const };
      return { 
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          user
        }
      };
    }
    
    const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    
    return response.json();
  },

  // Enhanced simulation APIs with retry logic
  getCases: async (filters?: any) => {
    if (USE_MOCK_DATA) {
      await delay(800);
      return {
        cases: mockData.cases,
        currentPage: 1,
        totalPages: 1,
        totalCases: mockData.cases.length
      };
    }
    
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/simulation/cases?${queryParams.toString()}`
    );
    return response.json();
  },

  startSimulation: async (caseId: string) => {
    if (USE_MOCK_DATA) {
      await delay(500);
      return {
        sessionId: 'mock-session-' + Date.now(),
        initialPrompt: 'Hello, I\'m your virtual patient. How can I help you today?',
        patientName: 'John Doe'
      };
    }
    
    const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/start`, {
      method: 'POST',
      body: JSON.stringify({ caseId })
    });
    return response.json();
  },

  // Stream simulation responses with enhanced error handling
  streamSimulationAsk: (
    sessionId: string,
    question: string,
    onChunk: (chunk: string, speaks_for?: string) => void,
    onDone: () => void,
    onError?: (error: ApiError) => void,
    onSessionEnd?: (summary: string) => void
  ) => {
    if (USE_MOCK_DATA) {
      const mockResponse = "This is a mock response from the virtual patient.";
      let index = 0;
      const interval = setInterval(() => {
        if (index < mockResponse.length) {
          onChunk(mockResponse.slice(index, index + 5));
          index += 5;
        } else {
          clearInterval(interval);
          onDone();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    const token = getAuthToken();
    const queryParams = new URLSearchParams({ sessionId, question, token: token || '' });
    const eventSource = new EventSource(`${API_BASE_URL}/api/simulation/ask?${queryParams.toString()}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'chunk':
            onChunk(data.content, data.speaks_for);
            break;
          case 'done':
            eventSource.close();
            onDone();
            break;
          case 'session_end':
            if (onSessionEnd) onSessionEnd(data.summary);
            eventSource.close();
            break;
        }
      } catch (err) {
        if (onError) onError(new ApiError('Stream parsing error', 0, 'STREAM_ERROR', false));
        eventSource.close();
      }
    };

    eventSource.onerror = (err) => {
      if (onError) onError(new ApiError('Stream error', 0, 'STREAM_ERROR', true));
      eventSource.close();
    };

    return () => eventSource.close();
  },

  // Performance APIs with better error handling
  getPerformanceSummary: async (userId: string) => {
    if (USE_MOCK_DATA) {
      await delay(600);
      return {
        userId,
        name: 'Demo User',
        email: 'demo@example.com',
        ...mockData.performanceData
      };
    }
    
    const response = await authenticatedFetch(`${API_BASE_URL}/api/performance/summary/${userId}`);
    return response.json();
  },

  // Health check and connectivity monitoring
  healthCheck: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  },

  // Clear specialty context
  clearSpecialtyContext: () => {
    localStorage.removeItem('currentSpecialty');
    localStorage.removeItem('currentSpecialtySlug');
  },

  getSpecialtyContext: () => {
    const specialty = localStorage.getItem('currentSpecialty');
    const slug = localStorage.getItem('currentSpecialtySlug');
    return specialty && slug ? { specialty, slug } : null;
  }
};
