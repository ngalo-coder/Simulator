import axios from 'axios';

// Environment-based API configuration
const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:4000';
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

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Making request to:', config.baseURL + config.url);
    
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
    
    // Only auto-logout on 401 for auth-related endpoints
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/') || 
                            error.config?.url?.includes('/profile');
      
      if (isAuthEndpoint) {
        console.log('🔒 Authentication failed, logging out...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        console.log('⚠️ Non-auth endpoint returned 401, not auto-logging out');
      }
    }
    
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  register: (userData) => api.post('/api/users/auth/register', userData),
  login: (credentials) => api.post('/api/users/auth/login', credentials),
  getProfile: () => api.get('/api/users/auth/profile'),
  updateProfile: (profileData) => api.put('/api/users/auth/profile', profileData),
  logout: () => api.post('/api/users/auth/logout'),
};

// Health check APIs
export const healthAPI = {
  checkGateway: () => api.get('/health'),
  checkUserService: () => api.get('/api/users/health'),
};

export default api;