import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { isValidSpecialtySlug, slugToSpecialty } from '../utils/urlUtils';
import { api } from '../services/apiService';
import { useNotification } from './NotificationToast';
import SpecialtyFallback from './SpecialtyFallback';

interface SpecialtyRouteGuardProps {
  children: React.ReactNode;
}

interface SpecialtyValidationState {
  isLoading: boolean;
  isValid: boolean;
  error?: string;
}

const SpecialtyRouteGuard: React.FC<SpecialtyRouteGuardProps> = ({ children }) => {
  const { specialty } = useParams<{ specialty: string }>();
  const { addNotification } = useNotification();
  const [validationState, setValidationState] = useState<SpecialtyValidationState>({
    isLoading: true,
    isValid: false,
  });

  useEffect(() => {
    const validateSpecialty = async () => {
      if (!specialty) {
        setValidationState({
          isLoading: false,
          isValid: false,
          error: 'No specialty parameter provided',
        });
        addNotification('Invalid specialty URL - no specialty specified', 'error');
        return;
      }

      // First check if the slug format is valid
      if (!isValidSpecialtySlug(specialty)) {
        setValidationState({
          isLoading: false,
          isValid: false,
          error: 'Invalid specialty URL format',
        });
        addNotification(
          `Invalid specialty URL format: "${specialty}". Please use a valid specialty link.`,
          'error'
        );
        return;
      }

      try {
        // Fetch available specialties from the API to validate
        const categories = await api.getCaseCategories();
        const availableSpecialties = categories.specialties || [];
        
        // Convert slug back to specialty name and check if it exists
        const specialtyName = slugToSpecialty(specialty);
        const isValidSpecialty = availableSpecialties.some(
          (availableSpecialty: string) => 
            availableSpecialty.toLowerCase() === specialtyName.toLowerCase()
        );

        if (isValidSpecialty) {
          setValidationState({
            isLoading: false,
            isValid: true,
          });
        } else {
          setValidationState({
            isLoading: false,
            isValid: false,
            error: 'Specialty not found',
          });
          addNotification(
            `Specialty "${specialtyName}" not found. Redirecting to available specialties.`,
            'warning'
          );
        }
      } catch (error) {
        console.error('Error validating specialty:', error);
        setValidationState({
          isLoading: false,
          isValid: false,
          error: 'Failed to validate specialty',
        });
        
        // Provide different error messages based on error type
        if (error instanceof Error) {
          if (error.message.includes('Session expired') || error.message.includes('401')) {
            addNotification('Session expired. Please log in again.', 'error');
          } else if (error.message.includes('Network') || error.message.includes('fetch')) {
            addNotification('Network error. Please check your connection and try again.', 'error');
          } else {
            addNotification('Unable to validate specialty. Redirecting to case browsing.', 'error');
          }
        } else {
          addNotification('An unexpected error occurred. Redirecting to case browsing.', 'error');
        }
      }
    };

    validateSpecialty();
  }, [specialty, addNotification]);

  // Show loading state while validating
  if (validationState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Validating specialty...</span>
      </div>
    );
  }

  // Show fallback component if specialty is invalid
  if (!validationState.isValid) {
    const retryValidation = () => {
      setValidationState({ isLoading: true, isValid: false });
      // Re-trigger validation by updating the effect dependency
      setTimeout(() => {
        setValidationState(prev => ({ ...prev, isLoading: true }));
      }, 100);
    };

    return (
      <SpecialtyFallback
        error={validationState.error}
        specialtySlug={specialty}
        specialtyName={specialty ? slugToSpecialty(specialty) : undefined}
        onRetry={validationState.error === 'Failed to validate specialty' ? retryValidation : undefined}
        showRetry={validationState.error === 'Failed to validate specialty'}
      />
    );
  }

  // Render children if specialty is valid
  return <>{children}</>;
};

export default SpecialtyRouteGuard;