import axios from 'axios';

// API base URL - will use environment variable in production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ai-patient-sim-gateway.onrender.com'
  : 'http://localhost:3001'; // Direct connection for local development
console.log('🔗 API Base URL:', API_BASE_URL);

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

// Retry function for handling sleeping services
const retryRequest = async (requestFn, maxRetries = 2) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries) throw error;
      
      // If it's a 503 or timeout, wait and retry
      if (error.response?.status === 503 || error.code === 'ECONNABORTED') {
        console.log(`🔄 Retrying request (attempt ${i + 2}/${maxRetries + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      } else {
        throw error; // Don't retry other errors
      }
    }
  }
};

// API functions with retry logic
export const authAPI = {
  register: (userData) => retryRequest(() => api.post(
    process.env.NODE_ENV === 'production' ? '/api/users/auth/register' : '/auth/register', 
    userData
  )),
  login: (credentials) => retryRequest(() => api.post(
    process.env.NODE_ENV === 'production' ? '/api/users/auth/login' : '/auth/login', 
    credentials
  )),
  getProfile: () => retryRequest(() => api.get(
    process.env.NODE_ENV === 'production' ? '/api/users/auth/profile' : '/auth/profile'
  )),
  updateProfile: (profileData) => retryRequest(() => api.put(
    process.env.NODE_ENV === 'production' ? '/api/users/auth/profile' : '/auth/profile', 
    profileData
  )),
  logout: () => retryRequest(() => api.post(
    process.env.NODE_ENV === 'production' ? '/api/users/auth/logout' : '/auth/logout'
  )),
};

export const healthAPI = {
  checkGateway: () => api.get('/health'),
  checkUserService: () => api.get('/api/users/health'),
};

export default api;