import axios from 'axios';

// Environment-based API configuration
const getApiBaseUrl = () => {
  // Check if we're in development
  if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    return process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:4000';
  }
  // Production
  return process.env.REACT_APP_API_GATEWAY_URL || 'https://ai-patient-sim-gateway.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Configuration:', {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV,
  hostname: window.location.hostname
});

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor to add auth token - SIMPLIFIED
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Making request to:', config.baseURL + config.url);
    
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Remove the custom timestamp header that was causing CORS issues
    // config.headers['X-Request-Timestamp'] = new Date().toISOString();
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log('✅ Response received:', {
      status: response.status,
      service: response.headers['x-service'],
      proxiedBy: response.headers['x-proxied-by']
    });
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      service: error.response?.data?.service,
      suggestion: error.response?.data?.suggestion,
      url: error.config?.url
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Enhanced error handling wrapper
const handleApiCall = async (apiCall, serviceName = 'unknown') => {
  try {
    return await apiCall();
  } catch (error) {
    // Service-specific error handling
    if (error.response?.status === 503) {
      console.warn(`⚠️ ${serviceName} service unavailable:`, error.response.data);
      throw new Error(`${serviceName} service is temporarily unavailable. ${error.response.data.suggestion || ''}`);
    }
    throw error;
  }
};

// API functions with proper gateway routing
export const authAPI = {
  register: (userData) => handleApiCall(
    () => api.post('/api/users/auth/register', userData),
    'Authentication'
  ),
  login: (credentials) => handleApiCall(
    () => api.post('/api/users/auth/login', credentials),
    'Authentication'
  ),
  getProfile: () => handleApiCall(
    () => api.get('/api/users/auth/profile'),
    'User Profile'
  ),
  updateProfile: (profileData) => handleApiCall(
    () => api.put('/api/users/auth/profile', profileData),
    'User Profile'
  ),
  logout: () => handleApiCall(
    () => api.post('/api/users/auth/logout'),
    'Authentication'
  ),
};

// Health check APIs
export const healthAPI = {
  checkGateway: () => api.get('/health'),
  checkUserService: () => api.get('/api/users/health'),
  getDebugInfo: () => api.get('/debug/services'),
};

// Future service APIs (ready for when you add them)
export const simulationAPI = {
  // Will be: api.post('/api/simulation/start', data)
  // Will be: api.get('/api/simulation/sessions')
};

export const clinicalAPI = {
  // Will be: api.get('/api/clinical/cases')
  // Will be: api.post('/api/clinical/assessment', data)
};

export const caseAPI = {
  // Will be: api.get('/api/cases')
  // Will be: api.post('/api/cases', data)
};

export const analyticsAPI = {
  // Will be: api.get('/api/analytics/dashboard')
  // Will be: api.get('/api/analytics/reports')
};

export default api;