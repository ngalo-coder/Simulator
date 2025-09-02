import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';

interface SpecialtyNavigationProps {
  className?: string;
  showCaseCounts?: boolean;
  maxVisible?: number;
}

/**
 * Specialty navigation component
 * Provides navigation links to switch between specialties
 */
const SpecialtyNavigation: React.FC<SpecialtyNavigationProps> = ({ 
  className = '',
  showCaseCounts = true,
  maxVisible = 6
}) => {
  const { 
    specialtyRoutes, 
    loading, 
    error 
  } = useSpecialtyContext();
  
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || specialtyRoutes.length === 0) {
    return null;
  }

  const visibleRoutes = showAll ? specialtyRoutes : specialtyRoutes.slice(0, maxVisible);
  const hasMore = specialtyRoutes.length > maxVisible;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 items-center">
        {visibleRoutes.map((route) => (
          <Link
            key={route.slug}
            to={`/${route.slug}`}
            className={`
              inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${route.isActive
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            `}
            aria-current={route.isActive ? 'page' : undefined}
          >
            <span>{route.specialty}</span>
            {showCaseCounts && route.caseCount > 0 && (
              <span className={`
                ml-2 px-1.5 py-0.5 text-xs rounded-full
                ${route.isActive
                  ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }
              `}>
                {route.caseCount}
              </span>
            )}
          </Link>
        ))}
        
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {showAll ? (
              <>
                <span>Show Less</span>
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span>+{specialtyRoutes.length - maxVisible} More</span>
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SpecialtyNavigation;