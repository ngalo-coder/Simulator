import axios from 'axios';

// Use the deployed gateway URL - don't fallback to localhost:4000
const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 'https://ai-patient-sim-gateway.onrender.com';

console.log('🔧 API Base URL:', API_BASE_URL);

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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Simplified - no retries for now to speed things up
export const authAPI = {
  register: (userData) => api.post('/api/users/auth/register', userData),
  login: (credentials) => api.post('/api/users/auth/login', credentials),
  getProfile: () => api.get('/api/users/auth/profile'),
  updateProfile: (profileData) => api.put('/api/users/auth/profile', profileData),
  logout: () => api.post('/api/users/auth/logout'),
};

export const healthAPI = {
  checkGateway: () => api.get('/health'),
  checkUserService: () => api.get('/api/users/health'),
};

export default api;