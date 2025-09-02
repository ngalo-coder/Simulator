// Simple API service for the virtual patient frontend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

// Auth utilities
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch (e) {
    return null;
  }
};

const getTokenExpiry = (): number | null => {
  try {
    const token = getAuthToken();
    if (!token) return null;

    // Decode JWT token to get expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (e) {
    return null;
  }
};

const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;

  return Date.now() >= expiry;
};

const isTokenValid = (): boolean => {
  const token = getAuthToken();
  const userData = localStorage.getItem('currentUser');
  return !!(token && userData && !isTokenExpired());
};

// Session expiry notification system
let sessionWarningShown = false;
let sessionExpiredShown = false;

const checkTokenExpiry = () => {
  const expiry = getTokenExpiry();
  if (!expiry) return;

  const now = Date.now();
  const timeUntilExpiry = expiry - now;

  // Show warning 5 minutes before expiry
  if (timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 0 && !sessionWarningShown) {
    sessionWarningShown = true;
    showSessionWarning(Math.floor(timeUntilExpiry / 60000));
  }

  // Token has expired
  if (timeUntilExpiry <= 0 && !sessionExpiredShown) {
    sessionExpiredShown = true;
    handleSessionExpiry();
  }
};

const showSessionWarning = (minutesLeft: number) => {
  // Create a user-friendly notification
  const notification = document.createElement('div');
  notification.className =
    'fixed top-4 right-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg z-50 max-w-sm';
  notification.innerHTML = `
    <div class="flex">
      <div class="flex-shrink-0">
        <span class="text-yellow-400">⚠️</span>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium text-yellow-800">Session Expiring Soon</p>
        <p class="text-sm text-yellow-700 mt-1">Your session will expire in ${minutesLeft} minute${
    minutesLeft !== 1 ? 's' : ''
  }. Please save your work.</p>
        <div class="mt-3 flex space-x-2">
          <button onclick="window.location.reload()" class="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700">
            Refresh Session
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-400">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
};

const handleSessionExpiry = () => {
  // Clear auth data
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');

  // Show user-friendly message
  const notification = document.createElement('div');
  notification.className =
    'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  notification.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
      <div class="text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-red-500 text-2xl">🔒</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Session Expired</h3>
        <p class="text-gray-600 mb-6">Your session has expired for security reasons. Please sign in again to continue.</p>
        <button onclick="window.location.href='/login'" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Sign In Again
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(notification);
};

// Check token expiry every minute
setInterval(checkTokenExpiry, 60000);

const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
  autoLogout: boolean = true
): Promise<Response> => {
  // Check if token is expired before making request
  if (isTokenExpired()) {
    console.log('Token expired, redirecting to login');
    handleSessionExpiry();
    throw new Error('Session expired');
  }

  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
    console.log(
      'Making authenticated request to:',
      url,
      'with token:',
      token.substring(0, 20) + '...'
    );
  } else {
    console.log('Making unauthenticated request to:', url);
  }

  headers.append('Content-Type', 'application/json');

  const response = await fetch(url, { ...options, headers });

  console.log('Response status:', response.status, 'for URL:', url);

  // Handle 401 responses (token expired or invalid)
  if (response.status === 401 && autoLogout) {
    console.log('401 Unauthorized - handling session expiry');
    handleSessionExpiry();
    throw new Error('Session expired');
  }

  return response;
};

// Context management for smart "All Cases" functionality
const SPECIALTY_CONTEXT_KEY = 'currentSpecialtyContext';

const setSpecialtyContext = (programArea: string, specialty: string) => {
  try {
    localStorage.setItem(
      SPECIALTY_CONTEXT_KEY,
      JSON.stringify({ programArea, specialty, timestamp: Date.now() })
    );
  } catch (e) {
    console.warn('Failed to save specialty context:', e);
  }
};

const getSpecialtyContext = () => {
  try {
    const stored = localStorage.getItem(SPECIALTY_CONTEXT_KEY);
    if (!stored) return null;

    const context = JSON.parse(stored);
    // Context expires after 1 hour
    if (Date.now() - context.timestamp > 60 * 60 * 1000) {
      localStorage.removeItem(SPECIALTY_CONTEXT_KEY);
      return null;
    }

    return { programArea: context.programArea, specialty: context.specialty };
  } catch (e) {
    return null;
  }
};

const clearSpecialtyContext = () => {
  try {
    localStorage.removeItem(SPECIALTY_CONTEXT_KEY);
  } catch (e) {
    console.warn('Failed to clear specialty context:', e);
  }
};

export const api = {
  // Check if user is authenticated
  isAuthenticated: () => isTokenValid(),

  // Check if token is expired
  isTokenExpired: () => isTokenExpired(),

  // Get time until token expires (in minutes)
  getTimeUntilExpiry: (): number => {
    const expiry = getTokenExpiry();
    if (!expiry) return 0;

    const timeLeft = expiry - Date.now();
    return Math.max(0, Math.floor(timeLeft / 60000));
  },

  // Context management methods
  setSpecialtyContext,
  getSpecialtyContext,
  clearSpecialtyContext,

  // Privacy Settings API
  getPrivacySettings: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/privacy/settings`);
      if (!response.ok) {
        throw new Error('Failed to fetch privacy settings');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      throw error;
    }
  },

  updatePrivacySettings: async (settings: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/privacy/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  },

  exportUserData: async (exportType: string = 'all', format: string = 'json') => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/privacy/export?exportType=${exportType}&format=${format}`
      );
      if (!response.ok) {
        throw new Error('Failed to export user data');
      }

      if (format === 'json') {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  },

  requestAccountDeletion: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/privacy/account`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to request account deletion');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw error;
    }
  },

  getPrivacyStatistics: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/privacy/statistics`);
      if (!response.ok) {
        throw new Error('Failed to fetch privacy statistics');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching privacy statistics:', error);
      throw error;
    }
  },

  // Get user cases/progress data
  getUserProgress: async (userId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/progress/${userId}`, {});
      if (!response.ok) {
        // If it's a 401, it might just mean no progress data exists yet
        if (response.status === 401) {
          console.log('No progress data found for user, returning default values');
          return {
            totalCasesCompleted: 0,
            overallAverageScore: 0,
            specialtyProgress: [],
            recentPerformance: [],
          };
        }
        throw new Error('Failed to fetch user progress');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      // Return default data for new users
      return {
        totalCasesCompleted: 0,
        overallAverageScore: 0,
        specialtyProgress: [],
        recentPerformance: [],
      };
    }
  },

  // Get available cases
  getCases: async (filters?: any) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/simulation/cases?${queryParams.toString()}`,
        {}
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Authentication required for cases');
          return {
            cases: [],
            currentPage: 1,
            totalPages: 1,
            totalCases: 0,
            hasNextPage: false,
            hasPrevPage: false,
          };
        }
        throw new Error('Failed to fetch cases');
      }

      const data = await response.json();
      const responseData = data.data || data;
      
      // Ensure we have all required pagination fields
      return {
        cases: responseData.cases || [],
        currentPage: responseData.currentPage || 1,
        totalPages: responseData.totalPages || 1,
        totalCases: responseData.totalCases || (responseData.cases ? responseData.cases.length : 0),
        hasNextPage: responseData.hasNextPage || false,
        hasPrevPage: responseData.hasPrevPage || false,
      };
    } catch (error) {
      console.error('Error fetching cases:', error);
      // Return empty data on error
      return {
        cases: [],
        currentPage: 1,
        totalPages: 1,
        totalCases: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }
  },

  // Get case categories
  getCaseCategories: async (filters?: { program_area?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.program_area) {
        queryParams.append('program_area', filters.program_area);
      }

      const endpoint = `/api/simulation/case-categories${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {});

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Authentication required for case categories');
          // Return empty data for authentication errors
          return {
            program_areas: [],
            specialties: [],
            specialized_areas: [],
            specialty_counts: {},
          };
        }
        throw new Error('Failed to fetch case categories');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case categories:', error);
      // Return empty data on error
      return {
        program_areas: [],
        specialties: [],
        specialized_areas: [],
        specialty_counts: {},
      };
    }
  },

  // Start simulation with enhanced debugging
  startSimulation: async (caseId: string) => {
    try {
      console.log('📡 Starting simulation for case:', caseId);

      const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/start`, {
        method: 'POST',
        body: JSON.stringify({ caseId }),
      });

      if (!response.ok) {
        console.error('❌ API Response not OK:', response.status, response.statusText);
        throw new Error(`Failed to start simulation: ${response.status} ${response.statusText}`);
      }

      // Get the raw response text first for debugging
      const responseText = await response.text();
      console.log('📡 Raw API Response Text:', responseText);

      // Parse the JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log('📡 Parsed API Response:', data);
      console.log('📡 Response structure analysis:');
      console.log('  - Top level keys:', Object.keys(data));
      console.log('  - Has data property:', 'data' in data);
      console.log('  - data content:', data.data);

      // Check both possible response structures
      const responseData = data.data || data;
      console.log('📡 Final responseData:', responseData);
      console.log('📡 Response data keys:', Object.keys(responseData));

      // Log all possible patient name fields
      console.log('📡 Patient name analysis:');
      console.log('  - patientName:', responseData.patientName);
      console.log('  - patient_name:', responseData.patient_name);
      console.log('  - name:', responseData.name);
      console.log('  - speaks_for:', responseData.speaks_for);

      // Log all possible initial prompt fields
      console.log('📡 Initial prompt analysis:');
      console.log('  - initialPrompt:', responseData.initialPrompt);
      console.log('  - initial_prompt:', responseData.initial_prompt);
      console.log('  - prompt:', responseData.prompt);
      console.log('  - message:', responseData.message);

      // Check if initialPrompt exists and has content
      const initialPrompt =
        responseData.initialPrompt ||
        responseData.initial_prompt ||
        responseData.prompt ||
        responseData.message ||
        '';

      console.log('📡 Resolved initial prompt:', {
        value: initialPrompt,
        type: typeof initialPrompt,
        length: initialPrompt?.length || 0,
        trimmedLength: initialPrompt?.trim()?.length || 0,
      });

      return responseData;
    } catch (error) {
      console.error('❌ Error in startSimulation:', error);
      throw error;
    }
  },

  // End simulation
  endSimulation: async (sessionId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/end`, {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to end simulation');
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error ending simulation:', error);
      throw error;
    }
  },

  // Get leaderboard data
  getLeaderboard: async (specialty?: string, limit: number = 10) => {
    try {
      const queryParams = new URLSearchParams();
      if (specialty) queryParams.append('specialty', specialty);
      queryParams.append('limit', limit.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/performance/leaderboard?${queryParams.toString()}`,
        {},
        false
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Authentication required for leaderboard');
          return [];
        }
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  },

  // Admin APIs
  getSystemStats: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch system stats');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        totalUsers: 0,
        totalCases: 0,
        totalSessions: 0,
        activeUsers: 0,
      };
    }
  },
};

export default api;
