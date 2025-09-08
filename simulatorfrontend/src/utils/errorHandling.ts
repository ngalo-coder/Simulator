/**
 * Comprehensive error handling utilities for specialty routing and API operations
 */

export interface ErrorDetails {
  type: 'network' | 'auth' | 'validation' | 'server' | 'client' | 'unknown';
  message: string;
  userMessage: string;
  shouldRetry: boolean;
  shouldRedirect?: string;
  statusCode?: number;
}

/**
 * Analyzes an error and returns structured error details
 */
export function analyzeError(error: unknown, context?: string): ErrorDetails {
  // Default error details
  let details: ErrorDetails = {
    type: 'unknown',
    message: 'An unknown error occurred',
    userMessage: 'Something went wrong. Please try again.',
    shouldRetry: true
  };

  if (error instanceof Error) {
    details.message = error.message;

    // Network errors
    if (error.message.includes('fetch') || 
        error.message.includes('Network') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_NETWORK')) {
      details.type = 'network';
      details.userMessage = 'Network error. Please check your internet connection and try again.';
      details.shouldRetry = true;
    }
    
    // Authentication errors
    else if (error.message.includes('401') || 
             error.message.includes('Unauthorized') ||
             error.message.includes('Session expired')) {
      details.type = 'auth';
      details.userMessage = 'Your session has expired. Please log in again.';
      details.shouldRetry = false;
      details.shouldRedirect = '/login';
      details.statusCode = 401;
    }
    
    // Validation errors
    else if (error.message.includes('400') || 
             error.message.includes('Bad Request') ||
             error.message.includes('Invalid') ||
             error.message.includes('validation')) {
      details.type = 'validation';
      details.userMessage = context 
        ? `Invalid ${context}. Please check your input and try again.`
        : 'Invalid input. Please check your data and try again.';
      details.shouldRetry = false;
      details.statusCode = 400;
    }
    
    // Not found errors
    else if (error.message.includes('404') || 
             error.message.includes('Not Found') ||
             error.message.includes('not found')) {
      details.type = 'client';
      details.userMessage = context 
        ? `${context} not found. Please check the URL or browse available options.`
        : 'The requested resource was not found.';
      details.shouldRetry = false;
      details.statusCode = 404;
    }
    
    // Rate limiting
    else if (error.message.includes('429') || 
             error.message.includes('Too Many Requests')) {
      details.type = 'client';
      details.userMessage = 'Too many requests. Please wait a moment and try again.';
      details.shouldRetry = true;
      details.statusCode = 429;
    }
    
    // Server errors
    else if (error.message.includes('500') || 
             error.message.includes('502') ||
             error.message.includes('503') ||
             error.message.includes('504') ||
             error.message.includes('Internal Server Error') ||
             error.message.includes('Bad Gateway') ||
             error.message.includes('Service Unavailable') ||
             error.message.includes('Gateway Timeout')) {
      details.type = 'server';
      details.userMessage = 'Server error. Please try again in a few moments.';
      details.shouldRetry = true;
      details.statusCode = parseInt(error.message.match(/\d{3}/)?.[0] || '500');
    }
    
    // Timeout errors
    else if (error.message.includes('timeout') || 
             error.message.includes('Timeout')) {
      details.type = 'network';
      details.userMessage = 'Request timed out. Please try again.';
      details.shouldRetry = true;
    }
    
    // Chunk loading errors (common in SPAs)
    else if (error.message.includes('ChunkLoadError') || 
             error.message.includes('Loading chunk')) {
      details.type = 'client';
      details.userMessage = 'Failed to load application resources. Please refresh the page.';
      details.shouldRetry = true;
    }
  }
  
  // Handle non-Error objects
  else if (typeof error === 'string') {
    details.message = error;
    details.userMessage = error;
  }
  
  return details;
}

/**
 * Determines if an error should trigger a retry mechanism
 */
export function shouldRetryError(error: unknown): boolean {
  const details = analyzeError(error);
  return details.shouldRetry && details.type !== 'auth' && details.type !== 'validation';
}

/**
 * Gets a user-friendly error message for specialty-related operations
 */
export function getSpecialtyErrorMessage(error: unknown, specialtyName?: string, operation?: string): string {
  const details = analyzeError(error, specialtyName);
  
  if (specialtyName && operation) {
    switch (details.type) {
      case 'network':
        return `Network error while ${operation} for ${specialtyName}. Please check your connection.`;
      case 'auth':
        return 'Your session has expired. Please log in again.';
      case 'validation':
        return `Invalid specialty "${specialtyName}". Please check the URL.`;
      case 'client':
        return `Specialty "${specialtyName}" not found. Please browse available specialties.`;
      case 'server':
        return `Server error while ${operation} for ${specialtyName}. Please try again.`;
      default:
        return `Failed to ${operation} for ${specialtyName}. Please try again.`;
    }
  }
  
  return details.userMessage;
}

/**
 * Creates a retry function with exponential backoff
 */
export function createRetryFunction(
  operation: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): () => Promise<any> {
  return async () => {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on the last attempt or for non-retryable errors
        if (attempt === maxRetries || !shouldRetryError(error)) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
}

/**
 * Wraps an async operation with comprehensive error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string,
  onError?: (error: ErrorDetails) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const details = analyzeError(error, context);
    
    if (onError) {
      onError(details);
    }
    
    throw error;
  }
}

/**
 * Validates specialty slug format and provides detailed error information
 */
export function validateSpecialtySlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug || typeof slug !== 'string') {
    return { isValid: false, error: 'No specialty parameter provided' };
  }

  const trimmedSlug = slug.trim();
  
  if (!trimmedSlug) {
    return { isValid: false, error: 'Empty specialty parameter' };
  }

  // Check for valid characters
  const validSlugPattern = /^[a-z0-9_-]+$/;
  if (!validSlugPattern.test(trimmedSlug)) {
    return { isValid: false, error: 'Invalid specialty URL format - contains invalid characters' };
  }

  // Check for leading/trailing separators
  if (/^[_-]|[_-]$/.test(trimmedSlug)) {
    return { isValid: false, error: 'Invalid specialty URL format - starts or ends with separator' };
  }

  // Check for consecutive separators
  if (/[_-]{2,}/.test(trimmedSlug)) {
    return { isValid: false, error: 'Invalid specialty URL format - consecutive separators' };
  }

  return { isValid: true };
}