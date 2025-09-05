import {
  User,
  Case,
  StudentProgress,
  Session,
  LoginCredentials,
  RegistrationData,
  CaseSearchParams,
  SimulationStartResponse,
  ApiError
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch (e) {
    console.error("Failed to access localStorage:", e);
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

export const api = {
  // Auth Endpoints
  login: async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    return response.json();
  },
  
  register: async (data: RegistrationData): Promise<{ token: string; user: User }> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.json();
  },

  logout: async (): Promise<void> => {
    await authenticatedFetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
  },

  verifyToken: async (): Promise<{ user: User }> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/verify`);
    return response.json();
  },

  // User Endpoints
  getUserProfile: async (userId: string): Promise<{ user: User }> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${userId}/profile`);
    return response.json();
  },

  updateUserProfile: async (userId: string, updates: Partial<User>): Promise<{ user: User }> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  // Student Endpoints
  getStudentDashboard: async (): Promise<any> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/student/dashboard`);
    return response.json();
  },

  getStudentCases: async (params: CaseSearchParams): Promise<{ cases: Case[], totalPages: number }> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await authenticatedFetch(`${API_BASE_URL}/api/student/cases?${query}`);
    return response.json();
  },

  getStudentProgress: async (): Promise<StudentProgress> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/student/progress`);
    return response.json();
  },

  // Case Search Endpoints
  searchCases: async (params: CaseSearchParams): Promise<{ cases: Case[], totalPages: number }> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await authenticatedFetch(`${API_BASE_URL}/api/case-search/advanced?${query}`);
    return response.json();
  },

  getSearchSuggestions: async (query: string): Promise<string[]> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/case-search/suggestions?q=${query}`);
    return response.json();
  },

  // Simulation Endpoints
  startSimulation: async (caseId: string): Promise<SimulationStartResponse> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/start`, {
      method: 'POST',
      body: JSON.stringify({ caseId }),
    });
    return response.json();
  },

  streamSimulationAsk: (
    sessionId: string,
    question: string,
    onChunk: (chunk: string, speaks_for?: string) => void,
    onDone: () => void,
    onError?: (error: ApiError) => void,
    onSessionEnd?: (summary: string) => void
  ) => {
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

  endSimulation: async (sessionId: string, feedback: string): Promise<Session> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/end`, {
      method: 'POST',
      body: JSON.stringify({ sessionId, feedback }),
    });
    return response.json();
  },
  
  // Health Check
  healthCheck: async (): Promise<boolean> => {
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
};
