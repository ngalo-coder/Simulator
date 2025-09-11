
// Comprehensive API service for the virtual patient frontend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://simulator-gamma-six.vercel.app';

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

  // ==================== AUTHENTICATION & USER MANAGEMENT ====================

  // Auth methods for login and register
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  },

  register: async (userData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to logout');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },

  verifyToken: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/verify`);
      if (!response.ok) {
        throw new Error('Token verification failed');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error verifying token:', error);
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error('Failed to send password reset email');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error in forgot password:', error);
      throw error;
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      if (!response.ok) {
        throw new Error('Failed to reset password');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error in reset password:', error);
      throw error;
    }
  },

  // User profile management
  completeProfile: async (userId: string, profileData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${userId}/complete-profile`, {
        method: 'POST',
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        throw new Error('Failed to complete profile');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error completing profile:', error);
      throw error;
    }
  },

  getProfile: async (userId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${userId}/profile`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  updateProfile: async (userId: string, profileData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  updatePreferences: async (userId: string, preferences: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${userId}/preferences`, {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${userId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        throw new Error('Failed to change password');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // User utility methods
  getDisciplines: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/disciplines`);
      if (!response.ok) {
        throw new Error('Failed to fetch disciplines');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching disciplines:', error);
      throw error;
    }
  },

  getRoles: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/roles`);
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  getRegistrationConfig: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/registration-config`);
      if (!response.ok) {
        throw new Error('Failed to fetch registration config');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching registration config:', error);
      throw error;
    }
  },

  getProfileWizard: async (userId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${userId}/profile-wizard`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile wizard');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching profile wizard:', error);
      throw error;
    }
  },

  // ==================== INTERACTION TRACKING ====================

  trackInteraction: async (interactionData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/interaction-tracking/track`, {
        method: 'POST',
        body: JSON.stringify(interactionData),
      });
      if (!response.ok) {
        throw new Error('Failed to track interaction');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error tracking interaction:', error);
      throw error;
    }
  },

  trackBulkInteractions: async (interactions: any[]) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/interaction-tracking/track-bulk`, {
        method: 'POST',
        body: JSON.stringify({ interactions }),
      });
      if (!response.ok) {
        throw new Error('Failed to track bulk interactions');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error tracking bulk interactions:', error);
      throw error;
    }
  },

  getUserEngagementAnalytics: async (userId: string, options?: { timeRange?: string; granularity?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (options?.timeRange) queryParams.append('timeRange', options.timeRange);
      if (options?.granularity) queryParams.append('granularity', options.granularity);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/interaction-tracking/engagement/${userId}?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch engagement analytics');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching engagement analytics:', error);
      throw error;
    }
  },

  getGlobalEngagementPatterns: async (filters?: { timeRange?: string; specialty?: string; difficulty?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.timeRange) queryParams.append('timeRange', filters.timeRange);
      if (filters?.specialty) queryParams.append('specialty', filters.specialty);
      if (filters?.difficulty) queryParams.append('difficulty', filters.difficulty);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/interaction-tracking/global-patterns?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch global engagement patterns');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching global engagement patterns:', error);
      throw error;
    }
  },

  getLearningBehaviorInsights: async (userId: string, options?: { timeRange?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (options?.timeRange) queryParams.append('timeRange', options.timeRange);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/interaction-tracking/learning-insights/${userId}?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch learning insights');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching learning insights:', error);
      throw error;
    }
  },

  getPersonalizedRecommendations: async (userId: string, options?: { timeRange?: string; limit?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (options?.timeRange) queryParams.append('timeRange', options.timeRange);
      if (options?.limit) queryParams.append('limit', options.limit.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/interaction-tracking/recommendations/${userId}?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch personalized recommendations');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      throw error;
    }
  },

  getInteractionHistory: async (userId: string, options?: { limit?: number; page?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (options?.limit) queryParams.append('limit', options.limit.toString());
      if (options?.page) queryParams.append('page', options.page.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/interaction-tracking/history/${userId}?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch interaction history');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching interaction history:', error);
      throw error;
    }
  },

  clearInteractionCache: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/interaction-tracking/clear-cache`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to clear interaction cache');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error clearing interaction cache:', error);
      throw error;
    }
  },

  // ==================== LEARNING GOALS ====================

  createLearningGoal: async (goalData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-goals/goals`, {
        method: 'POST',
        body: JSON.stringify(goalData),
      });
      if (!response.ok) {
        throw new Error('Failed to create learning goal');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error creating learning goal:', error);
      throw error;
    }
  },

  getLearningGoals: async (filters?: { status?: string; priority?: string; limit?: number; page?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.priority) queryParams.append('priority', filters.priority);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/learning-goals/goals?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch learning goals');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching learning goals:', error);
      throw error;
    }
  },

  getLearningGoal: async (goalId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-goals/goals/${goalId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch learning goal');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching learning goal:', error);
      throw error;
    }
  },

  updateLearningGoal: async (goalId: string, goalData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-goals/goals/${goalId}`, {
        method: 'PUT',
        body: JSON.stringify(goalData),
      });
      if (!response.ok) {
        throw new Error('Failed to update learning goal');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating learning goal:', error);
      throw error;
    }
  },

  deleteLearningGoal: async (goalId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-goals/goals/${goalId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete learning goal');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error deleting learning goal:', error);
      throw error;
    }
  },

  addActionStep: async (goalId: string, actionData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-goals/goals/${goalId}/actions`, {
        method: 'POST',
        body: JSON.stringify(actionData),
      });
      if (!response.ok) {
        throw new Error('Failed to add action step');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error adding action step:', error);
      throw error;
    }
  },

  completeActionStep: async (goalId: string, stepIndex: number, notes?: string) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/learning-goals/goals/${goalId}/actions/${stepIndex}/complete`,
        {
          method: 'PATCH',
          body: JSON.stringify({ notes }),
        }
      );
      if (!response.ok) {
        throw new Error('Failed to complete action step');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error completing action step:', error);
      throw error;
    }
  },

  generateSmartGoals: async (options?: { count?: number; focusArea?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (options?.count) queryParams.append('count', options.count.toString());
      if (options?.focusArea) queryParams.append('focusArea', options.focusArea);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/learning-goals/goals/generate-smart?${queryParams.toString()}`,
        {
          method: 'POST',
        }
      );
      if (!response.ok) {
        throw new Error('Failed to generate SMART goals');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error generating SMART goals:', error);
      throw error;
    }
  },

  getGoalProgressStats: async (timeRange?: string) => {
    try {
      const queryParams = new URLSearchParams();
      if (timeRange) queryParams.append('timeRange', timeRange);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/learning-goals/goals/stats/progress?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch goal progress stats');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching goal progress stats:', error);
      throw error;
    }
  },

  getOverdueGoals: async (limit?: number) => {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append('limit', limit.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/learning-goals/goals/overdue?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch overdue goals');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching overdue goals:', error);
      throw error;
    }
  },

  getGoalsDueSoon: async (limit?: number) => {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append('limit', limit.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/learning-goals/goals/due-soon?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch goals due soon');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching goals due soon:', error);
      throw error;
    }
  },

  // ==================== LEARNING PATHS ====================

  createLearningPath: async (pathData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-paths`, {
        method: 'POST',
        body: JSON.stringify(pathData),
      });
      if (!response.ok) {
        throw new Error('Failed to create learning path');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error creating learning path:', error);
      throw error;
    }
  },

  generateAdaptiveLearningPath: async (adaptiveData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-paths/generate-adaptive`, {
        method: 'POST',
        body: JSON.stringify(adaptiveData),
      });
      if (!response.ok) {
        throw new Error('Failed to generate adaptive learning path');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error generating adaptive learning path:', error);
      throw error;
    }
  },

  getLearningPaths: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-paths`);
      if (!response.ok) {
        throw new Error('Failed to fetch learning paths');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      throw error;
    }
  },

  getLearningPath: async (pathId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-paths/${pathId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch learning path');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching learning path:', error);
      throw error;
    }
  },

  updatePathProgress: async (pathId: string, progressData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-paths/${pathId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify(progressData),
      });
      if (!response.ok) {
        throw new Error('Failed to update path progress');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating path progress:', error);
      throw error;
    }
  },

  getNextModule: async (pathId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-paths/${pathId}/next-module`);
      if (!response.ok) {
        throw new Error('Failed to fetch next module');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching next module:', error);
      throw error;
    }
  },

  adjustPathDifficulty: async (pathId: string, difficultyData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/learning-paths/${pathId}/adjust-difficulty`, {
        method: 'PATCH',
        body: JSON.stringify(difficultyData),
      });
      if (!response.ok) {
        throw new Error('Failed to adjust path difficulty');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error adjusting path difficulty:', error);
      throw error;
    }
  },

  // ==================== STUDENT DASHBOARD & PROGRESS ====================

  getStudentDashboard: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/student/dashboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch student dashboard');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching student dashboard:', error);
      throw error;
    }
  },

  getUserProgress: async (userId?: string) => {
    try {
      const url = userId
        ? `${API_BASE_URL}/api/student/${userId}/progress`
        : `${API_BASE_URL}/api/student/progress`;
      const response = await authenticatedFetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch user progress');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  },

  getCaseCategories: async (filters?: { program_area?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.program_area) queryParams.append('program_area', filters.program_area);

      const url = `${API_BASE_URL}/api/simulation/case-categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await authenticatedFetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch case categories');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case categories:', error);
      throw error;
    }
  },

  // ==================== CASE MANAGEMENT ====================

  getCases: async (filters?: any) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            queryParams.append(key, filters[key].toString());
          }
        });
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/cases?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching cases:', error);
      throw error;
    }
  },

  // ==================== SIMULATION MANAGEMENT ====================

  startSimulation: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/start`, {
        method: 'POST',
        body: JSON.stringify({ caseId }),
      });
      if (!response.ok) {
        throw new Error('Failed to start simulation');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error starting simulation:', error);
      throw error;
    }
  },

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

  // ==================== RETAKE FUNCTIONALITY ====================

  startRetakeSimulation: async (caseId: string, previousSessionId?: string, retakeReason?: string, improvementFocusAreas?: string[]) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/retake/start`, {
        method: 'POST',
        body: JSON.stringify({ 
          caseId, 
          previousSessionId, 
          retakeReason, 
          improvementFocusAreas 
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to start retake simulation');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error starting retake simulation:', error);
      throw error;
    }
  },

  getCaseRetakeSessions: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/retake/sessions/${caseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch retake sessions');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching retake sessions:', error);
      throw error;
    }
  },

  calculateImprovementMetrics: async (originalSessionId: string, retakeSessionId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/retake/calculate-improvement`, {
        method: 'POST',
        body: JSON.stringify({ originalSessionId, retakeSessionId }),
      });
      if (!response.ok) {
        throw new Error('Failed to calculate improvement metrics');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error calculating improvement metrics:', error);
      throw error;
    }
  },

  // ==================== PRIVACY & DATA MANAGEMENT ====================

  getPrivacySettings: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/users/privacy-settings`);
      if (!response.ok) {
        throw new Error('Failed to fetch privacy settings');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      throw error;
    }
  },

  updatePrivacySettings: async (settings: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/users/privacy-settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  },

  requestAccountDeletion: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/users/request-account-deletion`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to request account deletion');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw error;
    }
  },

  exportUserData: async (exportType: string, format: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/users/export-data`, {
        method: 'POST',
        body: JSON.stringify({ exportType, format }),
      });
      if (!response.ok) {
        throw new Error('Failed to export user data');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  },

  // ==================== ADMIN & ANALYTICS ====================

  getSystemStats: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch system stats');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  },

  // ==================== LEADERBOARD ====================

  getLeaderboard: async (specialty?: string, limit?: number) => {
    try {
      const queryParams = new URLSearchParams();
      if (specialty) queryParams.append('specialty', specialty);
      if (limit) queryParams.append('limit', limit.toString());

      const response = await authenticatedFetch(`${API_BASE_URL}/api/leaderboard?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },

  // ==================== PERFORMANCE MANAGEMENT ====================

  recordEvaluation: async (evaluationData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/performance/record-evaluation`, {
        method: 'POST',
        body: JSON.stringify(evaluationData),
      });
      if (!response.ok) {
        throw new Error('Failed to record evaluation');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error recording evaluation:', error);
      throw error;
    }
  },

  getPerformanceSummary: async (userId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/performance/summary/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance summary');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching performance summary:', error);
      throw error;
    }
  },

  checkEligibility: async (userId: string, specialty: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/performance/eligibility/${userId}/${specialty}`);
      if (!response.ok) {
        throw new Error('Failed to check eligibility');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error checking eligibility:', error);
      throw error;
    }
  },

  updateContribution: async (userId: string, contributionData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/performance/update-contribution/${userId}`, {
        method: 'POST',
        body: JSON.stringify(contributionData),
      });
      if (!response.ok) {
        throw new Error('Failed to update contribution');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating contribution:', error);
      throw error;
    }
  },

  getEligibleContributors: async (specialty: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/performance/eligible-contributors/${specialty}`);
      if (!response.ok) {
        throw new Error('Failed to fetch eligible contributors');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching eligible contributors:', error);
      throw error;
    }
  },

  // ==================== PERFORMANCE REVIEW ====================

  getPerformanceReview: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/performance-review/review`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance review');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching performance review:', error);
      throw error;
    }
  },

  getCasePerformanceReview: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/performance-review/review/case/${caseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch case performance review');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case performance review:', error);
      throw error;
    }
  },

  getPeerComparisonReview: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/performance-review/review/peer-comparison`);
      if (!response.ok) {
        throw new Error('Failed to fetch peer comparison review');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching peer comparison review:', error);
      throw error;
    }
  },

  getImprovementProgress: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/performance-review/review/improvement-progress`);
      if (!response.ok) {
        throw new Error('Failed to fetch improvement progress');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching improvement progress:', error);
      throw error;
    }
  },

  generateReflectionPrompts: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/performance-review/review/reflection-prompts`);
      if (!response.ok) {
        throw new Error('Failed to generate reflection prompts');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error generating reflection prompts:', error);
      throw error;
    }
  },

  // ==================== MULTIMEDIA MANAGEMENT ====================

  uploadMultimedia: async (fileData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/multimedia/upload`, {
        method: 'POST',
        body: JSON.stringify(fileData),
      });
      if (!response.ok) {
        throw new Error('Failed to upload multimedia');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error uploading multimedia:', error);
      throw error;
    }
  },

  getCaseMultimedia: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/multimedia/case/${caseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch case multimedia');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case multimedia:', error);
      throw error;
    }
  },

  updateMultimedia: async (fileId: string, fileData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/multimedia/${fileId}`, {
        method: 'PUT',
        body: JSON.stringify(fileData),
      });
      if (!response.ok) {
        throw new Error('Failed to update multimedia');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating multimedia:', error);
      throw error;
    }
  },

  deleteMultimedia: async (fileId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/multimedia/${fileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete multimedia');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error deleting multimedia:', error);
      throw error;
    }
  },

  getMultimediaStats: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/multimedia/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch multimedia stats');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching multimedia stats:', error);
      throw error;
    }
  },

  // ==================== EDUCATOR MANAGEMENT ====================

  getEducatorDashboard: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/dashboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch educator dashboard');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching educator dashboard:', error);
      throw error;
    }
  },

  getEducatorStudents: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch educator students');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching educator students:', error);
      throw error;
    }
  },

  getStudentProgress: async (studentId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/students/${studentId}/progress`);
      if (!response.ok) {
        throw new Error('Failed to fetch student progress');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching student progress:', error);
      throw error;
    }
  },

  getEducatorCases: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/cases`);
      if (!response.ok) {
        throw new Error('Failed to fetch educator cases');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching educator cases:', error);
      throw error;
    }
  },

  createEducatorCase: async (caseData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/cases`, {
        method: 'POST',
        body: JSON.stringify(caseData),
      });
      if (!response.ok) {
        throw new Error('Failed to create educator case');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error creating educator case:', error);
      throw error;
    }
  },

  updateEducatorCase: async (caseId: string, caseData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/cases/${caseId}`, {
        method: 'PUT',
        body: JSON.stringify(caseData),
      });
      if (!response.ok) {
        throw new Error('Failed to update educator case');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating educator case:', error);
      throw error;
    }
  },

  deleteEducatorCase: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/cases/${caseId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete educator case');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error deleting educator case:', error);
      throw error;
    }
  },

  submitCaseReview: async (caseId: string, reviewData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/cases/${caseId}/submit-review`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });
      if (!response.ok) {
        throw new Error('Failed to submit case review');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error submitting case review:', error);
      throw error;
    }
  },

  reviewCase: async (caseId: string, reviewData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/cases/${caseId}/review`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });
      if (!response.ok) {
        throw new Error('Failed to review case');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error reviewing case:', error);
      throw error;
    }
  },

  publishCase: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/cases/${caseId}/publish`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to publish case');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error publishing case:', error);
      throw error;
    }
  },

  getCaseAnalytics: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/cases/${caseId}/analytics`);
      if (!response.ok) {
        throw new Error('Failed to fetch case analytics');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case analytics:', error);
      throw error;
    }
  },

  addCaseCollaborator: async (caseId: string, collaboratorData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/cases/${caseId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify(collaboratorData),
      });
      if (!response.ok) {
        throw new Error('Failed to add case collaborator');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error adding case collaborator:', error);
      throw error;
    }
  },

  removeCaseCollaborator: async (caseId: string, collaboratorId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/cases/${caseId}/collaborators/${collaboratorId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove case collaborator');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error removing case collaborator:', error);
      throw error;
    }
  },

  getEducatorAnalytics: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/analytics`);
      if (!response.ok) {
        throw new Error('Failed to fetch educator analytics');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching educator analytics:', error);
      throw error;
    }
  },

  createClass: async (classData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/classes`, {
        method: 'POST',
        body: JSON.stringify(classData),
      });
      if (!response.ok) {
        throw new Error('Failed to create class');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  },

  getClasses: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/classes`);
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  },

  getEducatorStatistics: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/educator/statistics`);
      if (!response.ok) {
        throw new Error('Failed to fetch educator statistics');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching educator statistics:', error);
      throw error;
    }
  },

  // ==================== CASE CONTRIBUTION ====================

  getContributionFormData: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/contribute-case/form-data`);
      if (!response.ok) {
        throw new Error('Failed to fetch contribution form data');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching contribution form data:', error);
      throw error;
    }
  },

  createCaseDraft: async (draftData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/contribute-case/draft`, {
        method: 'POST',
        body: JSON.stringify(draftData),
      });
      if (!response.ok) {
        throw new Error('Failed to create case draft');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error creating case draft:', error);
      throw error;
    }
  },

  submitCase: async (caseData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/contribute-case/submit`, {
        method: 'POST',
        body: JSON.stringify(caseData),
      });
      if (!response.ok) {
        throw new Error('Failed to submit case');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error submitting case:', error);
      throw error;
    }
  },

  getMyContributedCases: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/contribute-case/my-cases`);
      if (!response.ok) {
        throw new Error('Failed to fetch my contributed cases');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching my contributed cases:', error);
      throw error;
    }
  },

  getCaseForEdit: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/contribute-case/edit/${caseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch case for edit');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case for edit:', error);
      throw error;
    }
  },

  updateCase: async (caseId: string, caseData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/contribute-case/update/${caseId}`, {
        method: 'PUT',
        body: JSON.stringify(caseData),
      });
      if (!response.ok) {
        throw new Error('Failed to update case');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  },

  deleteCase: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/contribute-case/delete/${caseId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete case');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error deleting case:', error);
      throw error;
    }
  },

  // ==================== COMPETENCY ASSESSMENT ====================

  getCompetencyAssessment: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/competency-assessment/competency-assessment`);
      if (!response.ok) {
        throw new Error('Failed to fetch competency assessment');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching competency assessment:', error);
      throw error;
    }
  },

  initializeCompetencyAssessment: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/competency-assessment/competedy-assessment/initialize`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to initialize competency assessment');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error initializing competency assessment:', error);
      throw error;
    }
  },

  updateCompetencyLevels: async (levelsData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/competency-assessment/competency-assessment/levels`, {
        method: 'PATCH',
        body: JSON.stringify(levelsData),
      });
      if (!response.ok) {
        throw new Error('Failed to update competency levels');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating competency levels:', error);
      throw error;
    }
  },

  addAssessmentResult: async (assessmentData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/competedy-assessment/competency-assessment/assessments`, {
        method: 'POST',
        body: JSON.stringify(assessmentData),
      });
      if (!response.ok) {
        throw new Error('Failed to add assessment result');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error adding assessment result:', error);
      throw error;
    }
  },

  addPortfolioItem: async (portfolioData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/competency-assessment/competency-assessment/portfolio`, {
        method: 'POST',
        body: JSON.stringify(portfolioData),
      });
      if (!response.ok) {
        throw new Error('Failed to add portfolio item');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error adding portfolio item:', error);
      throw error;
    }
  },

  checkCertificationRequirements: async (certificationId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/competency-assessment/competency-assessment/certifications/${certificationId}/check`);
      if (!response.ok) {
        throw new Error('Failed to check certification requirements');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error checking certification requirements:', error);
      throw error;
    }
  },

  syncExternalAssessment: async (syncData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/competency-assessment/competency-assessment/external-sync`, {
        method: 'POST',
        body: JSON.stringify(syncData),
      });
      if (!response.ok) {
        throw new Error('Failed to sync external assessment');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error syncing external assessment:', error);
      throw error;
    }
  },

  generateCompetencyReport: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/competency-assessment/competency-assessment/report`);
      if (!response.ok) {
        throw new Error('Failed to generate competency report');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error generating competency report:', error);
      throw error;
    }
  },

  // ==================== CLINICIAN PROGRESS ====================

  getProgressRecommendations: async (userId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/clinician-progress/recommendations/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch progress recommendations');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching progress recommendations:', error);
      throw error;
    }
  },

  updateProgressAfterCase: async (progressData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/clinician-progress/update`, {
        method: 'POST',
        body: JSON.stringify(progressData),
      });
      if (!response.ok) {
        throw new Error('Failed to update progress after case');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating progress after case:', error);
      throw error;
    }
  },

  getClinicianProgress: async (userId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/clinician-progress/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch clinician progress');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching clinician progress:', error);
      throw error;
    }
  },

  // ==================== CASE WORKFLOW ====================

  initializeCaseWorkflow: async (workflowData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-workflow/initialize`, {
        method: 'POST',
        body: JSON.stringify(workflowData),
      });
      if (!response.ok) {
        throw new Error('Failed to initialize case workflow');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error initializing case workflow:', error);
      throw error;
    }
  },

  getCaseDrafts: async (filters?: { status?: string; limit?: number; page?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/case-workflow/drafts?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch case drafts');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case drafts:', error);
      throw error;
    }
  },

  updateCaseDraftStep: async (draftId: string, stepData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-workflow/drafts/${draftId}/step`, {
        method: 'PATCH',
        body: JSON.stringify(stepData),
      });
      if (!response.ok) {
        throw new Error('Failed to update case draft step');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating case draft step:', error);
      throw error;
    }
  },

  submitCaseDraft: async (draftId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-workflow/drafts/${draftId}/submit`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to submit case draft');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error submitting case draft:', error);
      throw error;
    }
  },

  getCaseWorkflowStatus: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-workflow/status/${caseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch case workflow status');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case workflow status:', error);
      throw error;
    }
  },

  // ==================== CASE TEMPLATES ====================

  getCaseTemplatesByDiscipline: async (discipline: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-templates/discipline/${discipline}`);
      if (!response.ok) {
        throw new Error('Failed to fetch case templates by discipline');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case templates by discipline:', error);
      throw error;
    }
  },

  getCaseTemplateFields: async (templateId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-templates/${templateId}/fields`);
      if (!response.ok) {
        throw new Error('Failed to fetch case template fields');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case template fields:', error);
      throw error;
    }
  },

  createCaseTemplate: async (templateData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-templates`, {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
      if (!response.ok) {
        throw new Error('Failed to create case template');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error creating case template:', error);
      throw error;
    }
  },

  updateCaseTemplate: async (templateId: string, templateData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });
      if (!response.ok) {
        throw new Error('Failed to update case template');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating case template:', error);
      throw error;
    }
  },

  deleteCaseTemplate: async (templateId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-templates/${templateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete case template');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error deleting case template:', error);
      throw error;
    }
  },

  // ==================== CASE SEARCH ====================

  advancedCaseSearch: async (searchCriteria: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-search/advanced`, {
        method: 'POST',
        body: JSON.stringify(searchCriteria),
      });
      if (!response.ok) {
        throw new Error('Failed to perform advanced case search');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error performing advanced case search:', error);
      throw error;
    }
  },

  getCaseSearchSuggestions: async (query: string, limit?: number) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('query', query);
      if (limit) queryParams.append('limit', limit.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/case-search/suggestions?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch case search suggestions');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case search suggestions:', error);
      throw error;
    }
  },

  saveSearchQuery: async (searchQuery: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-search/save-query`, {
        method: 'POST',
        body: JSON.stringify(searchQuery),
      });
      if (!response.ok) {
        throw new Error('Failed to save search query');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error saving search query:', error);
      throw error;
    }
  },

  getSavedSearches: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-search/saved-queries`);
      if (!response.ok) {
        throw new Error('Failed to fetch saved searches');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      throw error;
    }
  },

  deleteSavedSearch: async (searchId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-search/saved-queries/${searchId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete saved search');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error deleting saved search:', error);
      throw error;
    }
  },

  // ==================== CASE PUBLISHING ====================

  publishCaseToCatalog: async (caseId: string, publishData?: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-publishing/publish/${caseId}`, {
        method: 'POST',
        body: publishData ? JSON.stringify(publishData) : undefined,
      });
      if (!response.ok) {
        throw new Error('Failed to publish case to catalog');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error publishing case to catalog:', error);
      throw error;
    }
  },

  unpublishCaseFromCatalog: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-publishing/unpublish/${caseId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to unpublish case from catalog');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error unpublishing case from catalog:', error);
      throw error;
    }
  },

  getPublishedCases: async (filters?: { specialty?: string; difficulty?: string; limit?: number; page?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.specialty) queryParams.append('specialty', filters.specialty);
      if (filters?.difficulty) queryParams.append('difficulty', filters.difficulty);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/case-publishing/published?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch published cases');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching published cases:', error);
      throw error;
    }
  },

  getPublishingStatus: async (caseId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-publishing/status/${caseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch publishing status');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching publishing status:', error);
      throw error;
    }
  },

  // ==================== CASE REVIEW ====================

  submitCaseForReview: async (caseId: string, reviewData?: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-review/submit/${caseId}`, {
        method: 'POST',
        body: reviewData ? JSON.stringify(reviewData) : undefined,
      });
      if (!response.ok) {
        throw new Error('Failed to submit case for review');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error submitting case for review:', error);
      throw error;
    }
  },

  getCaseReviews: async (filters?: { status?: string; reviewerId?: string; limit?: number; page?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.reviewerId) queryParams.append('reviewerId', filters.reviewerId);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/case-review/reviews?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch case reviews');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching case reviews:', error);
      throw error;
    }
  },

  updateReviewStatus: async (reviewId: string, statusData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-review/reviews/${reviewId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      });
      if (!response.ok) {
        throw new Error('Failed to update review status');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating review status:', error);
      throw error;
    }
  },

  addReviewComment: async (reviewId: string, commentData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-review/reviews/${reviewId}/comments`, {
        method: 'POST',
        body: JSON.stringify(commentData),
      });
      if (!response.ok) {
        throw new Error('Failed to add review comment');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error adding review comment:', error);
      throw error;
    }
  },

  getReviewComments: async (reviewId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-review/reviews/${reviewId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch review comments');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching review comments:', error);
      throw error;
    }
  },

  // ==================== CASE ORGANIZATION ====================

  organizeCases: async (organizationData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-organization/organize`, {
        method: 'POST',
        body: JSON.stringify(organizationData),
      });
      if (!response.ok) {
        throw new Error('Failed to organize cases');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error organizing cases:', error);
      throw error;
    }
  },

  getOrganizationSchemes: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-organization/schemes`);
      if (!response.ok) {
        throw new Error('Failed to fetch organization schemes');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching organization schemes:', error);
      throw error;
    }
  },

  applyOrganizationScheme: async (schemeId: string, caseIds: string[]) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/case-organization/schemes/${schemeId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ caseIds }),
      });
      if (!response.ok) {
        throw new Error('Failed to apply organization scheme');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error applying organization scheme:', error);
      throw error;
    }
  },

  // ==================== ANALYTICS ====================

  getUsageAnalytics: async (filters?: { startDate?: string; endDate?: string; granularity?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.granularity) queryParams.append('granularity', filters.granularity);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/analytics/usage?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch usage analytics');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      throw error;
    }
  },

  getPerformanceAnalytics: async (filters?: { specialty?: string; timeRange?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.specialty) queryParams.append('specialty', filters.specialty);
      if (filters?.timeRange) queryParams.append('timeRange', filters.timeRange);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/analytics/performance?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch performance analytics');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching performance analytics:', error);
      throw error;
    }
  },

  getEngagementAnalytics: async (filters?: { userId?: string; timeRange?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.userId) queryParams.append('userId', filters.userId);
      if (filters?.timeRange) queryParams.append('timeRange', filters.timeRange);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/analytics/engagement?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch engagement analytics');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching engagement analytics:', error);
      throw error;
    }
  },

  exportAnalyticsData: async (exportType: string, filters?: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/analytics/export`, {
        method: 'POST',
        body: JSON.stringify({ exportType, filters }),
      });
      if (!response.ok) {
        throw new Error('Failed to export analytics data');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  },

  // ==================== ADMIN CASES ====================

  getAdminCases: async (filters?: { specialty?: string; programArea?: string; limit?: number; page?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.specialty) queryParams.append('specialty', filters.specialty);
      if (filters?.programArea) queryParams.append('programArea', filters.programArea);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/admin/cases?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch admin cases');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching admin cases:', error);
      throw error;
    }
  },

  updateAdminCase: async (caseId: string, caseData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/cases/${caseId}`, {
        method: 'PUT',
        body: JSON.stringify(caseData),
      });
      if (!response.ok) {
        throw new Error('Failed to update case');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  },

  deleteAdminCase: async (caseId: string): Promise<void> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/cases/${caseId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete case: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting case:', error);
      throw error;
    }
  },

  getAdminUsers: async (filters?: { role?: string; status?: string; limit?: number; page?: number; search?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.role) queryParams.append('role', filters.role);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.search) queryParams.append('search', filters.search);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/admin/users?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch admin users');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching admin users:', error);
      throw error;
    }
  },

  updateUserRole: async (userId: string, roleData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify(roleData),
      });
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  updateUserStatus: async (userId: string, statusData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData),
      });
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  getAdminUserStats: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch admin user stats');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching admin user stats:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  getUsersWithScores: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users/scores`);
      if (!response.ok) {
        throw new Error('Failed to fetch users with scores');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching users with scores:', error);
      throw error;
    }
  },

  // ==================== ADMIN PROGRAM ====================

  getPrograms: async (filters?: { status?: string; limit?: number; page?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/admin/programs?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching programs:', error);
      throw error;
    }
  },

  createProgram: async (programData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/programs`, {
        method: 'POST',
        body: JSON.stringify(programData),
      });
      if (!response.ok) {
        throw new Error('Failed to create program');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error creating program:', error);
      throw error;
    }
  },

  updateProgram: async (programId: string, programData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/programs/${programId}`, {
        method: 'PUT',
        body: JSON.stringify(programData),
      });
      if (!response.ok) {
        throw new Error('Failed to update program');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating program:', error);
      throw error;
    }
  },

  deleteProgram: async (programId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/programs/${programId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete program');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  },

  getProgramEnrollments: async (programId: string, filters?: { status?: string; limit?: number; page?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/admin/programs/${programId}/enrollments?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch program enrollments');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching program enrollments:', error);
      throw error;
    }
  },

  addProgramEnrollment: async (programId: string, enrollmentData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/programs/${programId}/enrollments`, {
        method: 'POST',
        body: JSON.stringify(enrollmentData),
      });
      if (!response.ok) {
        throw new Error('Failed to add program enrollment');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error adding program enrollment:', error);
      throw error;
    }
  },

  removeProgramEnrollment: async (programId: string, enrollmentId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/programs/${programId}/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove program enrollment');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error removing program enrollment:', error);
      throw error;
    }
  },

  getProgramStats: async (programId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/programs/${programId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch program stats');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching program stats:', error);
      throw error;
    }
  },

  // ==================== ADMIN CONTRIBUTION ====================

  getContributions: async (filters?: { status?: string; type?: string; limit?: number; page?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/admin/contributions?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching contributions:', error);
      throw error;
    }
  },

  updateContributionStatus: async (contributionId: string, statusData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/contributions/${contributionId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData),
      });
      if (!response.ok) {
        throw new Error('Failed to update contribution status');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating contribution status:', error);
      throw error;
    }
  },

  getContributionStats: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/contributions/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch contribution stats');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching contribution stats:', error);
      throw error;
    }
  },

  exportContributions: async (exportType: string, filters?: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/contributions/export`, {
        method: 'POST',
        body: JSON.stringify({ exportType, filters }),
      });
      if (!response.ok) {
        throw new Error('Failed to export contributions');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error exporting contributions:', error);
      throw error;
    }
  },

  // Add more API methods here as needed for other endpoints
};
