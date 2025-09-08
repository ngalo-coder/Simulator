import React from 'react';
import { Link } from 'react-router-dom';

interface SpecialtyFallbackProps {
  error?: string;
  specialtySlug?: string;
  specialtyName?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

const SpecialtyFallback: React.FC<SpecialtyFallbackProps> = ({
  error = 'Unknown error',
  specialtySlug,
  specialtyName,
  onRetry,
  showRetry = false
}) => {
  const getErrorContent = () => {
    switch (error) {
      case 'Invalid specialty URL format':
        return {
          icon: '❌',
          title: 'Invalid Specialty URL',
          message: `The specialty URL "${specialtySlug}" is not in a valid format.`,
          suggestion: 'Please use a valid specialty link from the browse page.'
        };
      
      case 'Specialty not found':
        return {
          icon: '🔍',
          title: 'Specialty Not Found',
          message: specialtyName 
            ? `The specialty "${specialtyName}" was not found.`
            : 'The requested specialty was not found.',
          suggestion: 'This specialty may not exist or may not have any cases available.'
        };
      
      case 'Failed to validate specialty':
        return {
          icon: '⚠️',
          title: 'Unable to Validate Specialty',
          message: 'We encountered an error while checking if this specialty exists.',
          suggestion: 'This might be a temporary network issue. Please try again.'
        };
      
      case 'Network error':
        return {
          icon: '🌐',
          title: 'Network Error',
          message: 'Unable to connect to the server.',
          suggestion: 'Please check your internet connection and try again.'
        };
      
      case 'Session expired':
        return {
          icon: '🔒',
          title: 'Session Expired',
          message: 'Your session has expired for security reasons.',
          suggestion: 'Please sign in again to continue.'
        };
      
      default:
        return {
          icon: '⚠️',
          title: 'Something Went Wrong',
          message: 'We encountered an unexpected error.',
          suggestion: 'Please try again or browse available specialties.'
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">{errorContent.icon}</div>
        
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          {errorContent.title}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          {errorContent.message}
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {errorContent.suggestion}
        </p>
        
        <div className="space-y-3">
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
          
          <Link
            to="/browse-cases"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Browse Available Specialties
          </Link>
          
          <Link
            to="/simulation"
            className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            View All Cases
          </Link>
          
          <Link
            to="/dashboard"
            className="block w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
        
        {/* Additional help section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Need help? Here are some suggestions:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 text-left">
            <li>• Check that the specialty URL is spelled correctly</li>
            <li>• Try browsing from the main specialties page</li>
            <li>• Refresh the page if you're experiencing network issues</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpecialtyFallback;