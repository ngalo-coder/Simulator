import axios from 'axios';

// Use the gateway URL from environment variables, with a fallback for development
const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:4000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Making request to:', config.baseURL + config.url);
    console.log('📦 Request data:', config.data);
    
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Retry function for handling sleeping services and connection issues
const retryRequest = async (requestFn, maxRetries = 3) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries) throw error;
      
      // Retry on service unavailable, timeout, or connection reset
      const shouldRetry = 
        error.response?.status === 503 || 
        error.code === 'ECONNABORTED' ||
        error.code === 'ECONNRESET' ||
        error.message?.includes('Network Error') ||
        error.response?.data?.code === 'ECONNRESET';
      
      if (shouldRetry) {
        const waitTime = Math.min(3000 * (i + 1), 10000); // Progressive backoff, max 10s
        console.log(`🔄 Retrying request (attempt ${i + 2}/${maxRetries + 1}) after ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error; // Don't retry other errors
      }
    }
  }
};

// API functions with retry logic
export const authAPI = {
  register: (userData) => retryRequest(() => api.post('/api/users/auth/register', userData)),
  login: (credentials) => retryRequest(() => api.post('/api/users/auth/login', credentials)),
  getProfile: () => retryRequest(() => api.get('/api/users/auth/profile')),
  updateProfile: (profileData) => retryRequest(() => api.put('/api/users/auth/profile', profileData)),
  logout: () => retryRequest(() => api.post('/api/users/auth/logout')),
};

export const healthAPI = {
  checkGateway: () => api.get('/health'),
  checkUserService: () => api.get('/api/users/health'),
};

export default api;