import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationToast';

interface SpecialtyErrorHandlerOptions {
  specialtyName?: string;
  context?: string;
  showNotifications?: boolean;
}

export const useSpecialtyErrorHandler = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const handleError = useCallback((
    error: unknown,
    options: SpecialtyErrorHandlerOptions = {}
  ) => {
    const {
      specialtyName = 'specialty',
      context = 'operation',
      showNotifications = true
    } = options;

    console.error(`Error in ${context}:`, error);

    if (!showNotifications) {
      return;
    }

    if (error instanceof Error) {
      // Handle authentication errors
      if (error.message.includes('Session expired') || 
          error.message.includes('401') || 
          error.message.includes('Unauthorized')) {
        addNotification('Your session has expired. Please log in again.', 'error');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      // Handle network errors
      if (error.message.includes('Network') || 
          error.message.includes('fetch') ||
          error.message.includes('Failed to fetch')) {
        addNotification(
          'Network error. Please check your internet connection and try again.',
          'error'
        );
        return;
      }

      // Handle server errors
      if (error.message.includes('500') || 
          error.message.includes('Internal Server Error')) {
        addNotification(
          'Server error. Please try again in a few moments.',
          'error'
        );
        return;
      }

      // Handle 404 errors
      if (error.message.includes('404') || 
          error.message.includes('Not Found')) {
        addNotification(
          `${specialtyName} not found. Please check the URL or browse available specialties.`,
          'warning'
        );
        return;
      }

      // Handle timeout errors
      if (error.message.includes('timeout') || 
          error.message.includes('Timeout')) {
        addNotification(
          'Request timed out. Please try again.',
          'warning'
        );
        return;
      }

      // Handle rate limiting
      if (error.message.includes('429') || 
          error.message.includes('Too Many Requests')) {
        addNotification(
          'Too many requests. Please wait a moment and try again.',
          'warning'
        );
        return;
      }

      // Generic error with specific context
      addNotification(
        `Failed to ${context} for ${specialtyName}. Please try again.`,
        'error'
      );
    } else {
      // Handle non-Error objects
      addNotification(
        `An unexpected error occurred during ${context}. Please try again.`,
        'error'
      );
    }
  }, [navigate, addNotification]);

  const handleSpecialtyNotFound = useCallback((specialtyName: string) => {
    addNotification(
      `Specialty "${specialtyName}" not found. Redirecting to available specialties.`,
      'warning'
    );
    setTimeout(() => {
      navigate('/browse-cases');
    }, 2000);
  }, [navigate, addNotification]);

  const handleInvalidSpecialtySlug = useCallback((slug: string) => {
    addNotification(
      `Invalid specialty URL format: "${slug}". Please use a valid specialty link.`,
      'error'
    );
    setTimeout(() => {
      navigate('/browse-cases');
    }, 2000);
  }, [navigate, addNotification]);

  const handleApiError = useCallback((
    error: unknown,
    operation: string,
    specialtyName?: string
  ) => {
    handleError(error, {
      specialtyName,
      context: operation,
      showNotifications: true
    });
  }, [handleError]);

  return {
    handleError,
    handleSpecialtyNotFound,
    handleInvalidSpecialtySlug,
    handleApiError
  };
};