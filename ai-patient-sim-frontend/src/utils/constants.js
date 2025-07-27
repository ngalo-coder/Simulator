// Application constants
export const APP_CONFIG = {
    name: 'AI Patient Simulation Platform',
    version: '1.0.0',
    description: 'Interactive medical training with virtual patients',
    
    // API Configuration
    api: {
      baseURL: process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:3000',
      timeout: 10000,
    },
    
    // Authentication
    auth: {
      tokenKey: 'authToken',
      userKey: 'user',
      tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    },
    
    // UI Configuration
    ui: {
      toastDuration: 4000,
      loadingDelay: 300,
    }
  };
  
  // User roles
  export const USER_ROLES = {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin'
  };
  
  // Role permissions
  export const PERMISSIONS = {
    [USER_ROLES.STUDENT]: [
      'view_cases',
      'start_simulation',
      'view_own_progress'
    ],
    [USER_ROLES.INSTRUCTOR]: [
      'view_cases',
      'create_cases',
      'edit_cases',
      'view_student_progress',
      'assign_cases'
    ],
    [USER_ROLES.ADMIN]: [
      'manage_users',
      'manage_institutions',
      'view_system_analytics',
      'manage_all_cases'
    ]
  };
  
  // API endpoints
  export const API_ENDPOINTS = {
    auth: {
      login: '/api/users/auth/login',
      register: '/api/users/auth/register',
      profile: '/api/users/auth/profile',
      logout: '/api/users/auth/logout'
    },
    health: {
      gateway: '/health',
      users: '/api/users/health'
    }
  };
  
  // Form validation rules
  export const VALIDATION_RULES = {
    email: {
      required: 'Email is required',
      pattern: {
        value: /^\S+@\S+$/i,
        message: 'Invalid email address'
      }
    },
    password: {
      required: 'Password is required',
      minLength: {
        value: 6,
        message: 'Password must be at least 6 characters'
      }
    },
    name: {
      required: 'This field is required',
      minLength: {
        value: 2,
        message: 'Must be at least 2 characters'
      },
      maxLength: {
        value: 50,
        message: 'Must be less than 50 characters'
      }
    },
    institution: {
      required: 'Institution is required',
      minLength: {
        value: 2,
        message: 'Must be at least 2 characters'
      }
    }
  };
  
  // Error messages
  export const ERROR_MESSAGES = {
    network: 'Network error. Please check your connection.',
    unauthorized: 'Session expired. Please login again.',
    forbidden: 'You do not have permission to perform this action.',
    notFound: 'The requested resource was not found.',
    serverError: 'Server error. Please try again later.',
    validation: 'Please check your input and try again.',
    generic: 'Something went wrong. Please try again.'
  };
  
  // Success messages
  export const SUCCESS_MESSAGES = {
    login: 'Login successful!',
    register: 'Account created successfully!',
    logout: 'Logged out successfully',
    profileUpdate: 'Profile updated successfully!',
    generic: 'Operation completed successfully!'
  };