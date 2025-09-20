/**
 * Centralized error handling utilities for consistent error management across the application
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  timestamp: Date;
}

export interface ErrorResponse {
  message: string;
  error?: boolean;
  status?: number;
  code?: string;
  details?: any;
}

// Error types for different scenarios
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Custom error classes
export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends Error {
  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'ServerError';
  }
}

// Error handler utility functions
export function handleApiError(error: any): ApiError {
  console.error('API Error:', error);

  // Handle different error types
  if (error instanceof AuthenticationError) {
    return {
      message: error.message,
      status: 401,
      code: ErrorType.AUTHENTICATION_ERROR,
      timestamp: new Date()
    };
  }

  if (error instanceof AuthorizationError) {
    return {
      message: error.message,
      status: 403,
      code: ErrorType.AUTHORIZATION_ERROR,
      timestamp: new Date()
    };
  }

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      status: 400,
      code: ErrorType.VALIDATION_ERROR,
      details: error.details,
      timestamp: new Date()
    };
  }

  if (error instanceof NotFoundError) {
    return {
      message: error.message,
      status: 404,
      code: ErrorType.NOT_FOUND_ERROR,
      timestamp: new Date()
    };
  }

  if (error instanceof NetworkError) {
    return {
      message: error.message,
      status: error.status || 0,
      code: ErrorType.NETWORK_ERROR,
      timestamp: new Date()
    };
  }

  // Handle HTTP response errors
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return {
          message: data?.message || 'Bad request',
          status: 400,
          code: ErrorType.VALIDATION_ERROR,
          details: data?.details,
          timestamp: new Date()
        };

      case 401:
        return {
          message: data?.message || 'Authentication required',
          status: 401,
          code: ErrorType.AUTHENTICATION_ERROR,
          timestamp: new Date()
        };

      case 403:
        return {
          message: data?.message || 'Access denied',
          status: 403,
          code: ErrorType.AUTHORIZATION_ERROR,
          timestamp: new Date()
        };

      case 404:
        return {
          message: data?.message || 'Resource not found',
          status: 404,
          code: ErrorType.NOT_FOUND_ERROR,
          timestamp: new Date()
        };

      case 408:
        return {
          message: data?.message || 'Request timeout',
          status: 408,
          code: ErrorType.TIMEOUT_ERROR,
          timestamp: new Date()
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          message: data?.message || 'Server error',
          status,
          code: ErrorType.SERVER_ERROR,
          timestamp: new Date()
        };

      default:
        return {
          message: data?.message || `HTTP ${status} error`,
          status,
          code: ErrorType.UNKNOWN_ERROR,
          timestamp: new Date()
        };
    }
  }

  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
    return {
      message: 'Network connection failed. Please check your internet connection.',
      status: 0,
      code: ErrorType.NETWORK_ERROR,
      timestamp: new Date()
    };
  }

  // Handle timeout errors
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return {
      message: 'Request timed out. Please try again.',
      status: 408,
      code: ErrorType.TIMEOUT_ERROR,
      timestamp: new Date()
    };
  }

  // Default error handling
  return {
    message: error.message || 'An unexpected error occurred',
    status: 500,
    code: ErrorType.UNKNOWN_ERROR,
    timestamp: new Date()
  };
}

// User-friendly error message mapping
export function getUserFriendlyErrorMessage(error: ApiError): string {
  switch (error.code) {
    case ErrorType.NETWORK_ERROR:
      return 'Connection failed. Please check your internet connection and try again.';

    case ErrorType.AUTHENTICATION_ERROR:
      return 'Please sign in to continue.';

    case ErrorType.AUTHORIZATION_ERROR:
      return 'You don\'t have permission to perform this action.';

    case ErrorType.VALIDATION_ERROR:
      return error.message || 'Please check your input and try again.';

    case ErrorType.NOT_FOUND_ERROR:
      return 'The requested resource could not be found.';

    case ErrorType.TIMEOUT_ERROR:
      return 'The request took too long. Please try again.';

    case ErrorType.SERVER_ERROR:
      return 'Server error occurred. Please try again later.';

    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

// Error logging utility
export function logError(error: ApiError, context?: string): void {
  const logData = {
    message: error.message,
    code: error.code,
    status: error.status,
    timestamp: error.timestamp,
    context,
    details: error.details
  };

  console.error('Error logged:', logData);

  // In a real application, you might want to send this to an error reporting service
  // like Sentry, LogRocket, or Bugsnag
}

// Error recovery suggestions
export function getErrorRecoverySuggestion(error: ApiError): string | null {
  switch (error.code) {
    case ErrorType.NETWORK_ERROR:
      return 'Check your internet connection and try again.';

    case ErrorType.AUTHENTICATION_ERROR:
      return 'Sign in again to continue.';

    case ErrorType.AUTHORIZATION_ERROR:
      return 'Contact your administrator for access.';

    case ErrorType.TIMEOUT_ERROR:
      return 'Try again with a smaller request or check your connection.';

    case ErrorType.SERVER_ERROR:
      return 'Wait a moment and try again, or contact support if the problem persists.';

    default:
      return null;
  }
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandler(): void {
  window.addEventListener('unhandledrejection', (event) => {
    const error = handleApiError(event.reason);
    logError(error, 'Unhandled Promise Rejection');
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    const error: ApiError = {
      message: event.message,
      code: ErrorType.UNKNOWN_ERROR,
      timestamp: new Date()
    };
    logError(error, 'Unhandled Error');
  });
}

// Utility to create error responses for testing
export function createTestError(type: ErrorType, message?: string): ApiError {
  const baseError: ApiError = {
    message: message || 'Test error',
    timestamp: new Date()
  };

  switch (type) {
    case ErrorType.AUTHENTICATION_ERROR:
      return { ...baseError, status: 401, code: type };

    case ErrorType.AUTHORIZATION_ERROR:
      return { ...baseError, status: 403, code: type };

    case ErrorType.VALIDATION_ERROR:
      return { ...baseError, status: 400, code: type };

    case ErrorType.NOT_FOUND_ERROR:
      return { ...baseError, status: 404, code: type };

    case ErrorType.SERVER_ERROR:
      return { ...baseError, status: 500, code: type };

    default:
      return { ...baseError, code: type };
  }
}