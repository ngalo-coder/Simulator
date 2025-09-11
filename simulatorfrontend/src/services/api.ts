import { PatientCase, PerformanceData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';
const USE_MOCK_DATA = false; // Set to true for development without backend

// Auth utilities
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch (e) {
    return null;
  }
};

const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  
  headers.append('Content-Type', 'application/json');

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.reload();
  }
  
  return response;
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
    // Add more mock cases as needed
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

export const apiClient = {
  // Auth APIs
  login: async (email: string, password: string) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const user = email === 'admin@example.com' ? mockData.users[1] : mockData.users[0];
      const mockResponse = {
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          user
        }
      };
      localStorage.setItem('authToken', mockResponse.data.token);
      localStorage.setItem('currentUser', JSON.stringify(mockResponse.data.user));
      return mockResponse;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    return data; // This already has the correct format with data.token and data.user
  },

  register: async (username: string, email: string, password: string) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const user = { id: '1', username, email, role: 'user' as const };
      return { 
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          user
        }
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }
    
    return response.json(); // This already has the correct format with data.token and data.user
  },

  // Simulation APIs
  getCases: async (filters?: any) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800));
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
      await new Promise(resolve => setTimeout(resolve, 500));
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

  // Stream simulation responses
  streamSimulationAsk: (
    sessionId: string,
    question: string,
    onChunk: (chunk: string, speaks_for?: string) => void,
    onDone: () => void,
    onError?: (error: any) => void,
    onSessionEnd?: (summary: string) => void
  ) => {
    if (USE_MOCK_DATA) {
      // Mock streaming response
      const mockResponse = "This is a mock response from the virtual patient. In a real scenario, this would be streamed from the AI.";
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
        if (onError) onError(err);
        eventSource.close();
      }
    };

    eventSource.onerror = (err) => {
      if (onError) onError(err);
      eventSource.close();
    };

    return () => eventSource.close();
  },

  // Performance APIs
  getPerformanceSummary: async (userId: string) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 600));
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

  // Admin APIs
  getSystemStats: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/stats`);
    return response.json();
  },

  getUsers: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users`);
    return response.json();
  }
};
