import axios from 'axios';

// Environment-based API configuration
const getApiBaseUrl = () => {
  // For localhost development - use gateway
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:4000'; // Gateway
  }
  // For production - connect directly to user service
  return 'https://simulator-zpen.onrender.com'; // Direct to user service
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
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// API functions - environment-aware routing that works for both local and production
const isLocalhost = window.location.hostname === 'localhost';

export const authAPI = {
  // Use gateway routes for localhost, direct routes for production
  register: (userData) => api.post(isLocalhost ? '/api/users/auth/register' : '/auth/register', userData),
  login: (credentials) => api.post(isLocalhost ? '/api/users/auth/login' : '/auth/login', credentials),
  getProfile: () => api.get(isLocalhost ? '/api/users/auth/profile' : '/auth/profile'),
  updateProfile: (profileData) => api.put(isLocalhost ? '/api/users/auth/profile' : '/auth/profile', profileData),
  logout: () => api.post(isLocalhost ? '/api/users/auth/logout' : '/auth/logout'),
};

// Health check APIs
export const healthAPI = {
  checkGateway: () => api.get('/health'),
  checkUserService: () => api.get('/health'),
};

export default api;