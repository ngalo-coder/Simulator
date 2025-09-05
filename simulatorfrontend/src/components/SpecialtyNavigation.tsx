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
            <div key={i} className="h-8 bg-background-alt dark:bg-background-dark-alt rounded-lg w-24"></div>
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
                ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light border border-primary-dark dark:border-primary-light'
                : 'bg-background dark:bg-background-dark text-text dark:text-text-dark border border-border dark:border-border-dark hover:border-primary-dark dark:hover:border-primary-light hover:text-primary-dark dark:hover:text-primary-light'
              }
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
            `}
            aria-current={route.isActive ? 'page' : undefined}
          >
            <span>{route.specialty}</span>
            {showCaseCounts && route.caseCount > 0 && (
              <span className={`
                ml-2 px-1.5 py-0.5 text-xs rounded-full
                ${route.isActive
                  ? 'bg-primary dark:bg-primary-dark text-white dark:text-text-dark'
                  : 'bg-background-alt dark:bg-background-dark-alt text-text-muted dark:text-text-dark-muted'
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
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-background-alt dark:bg-background-dark-alt text-text-muted dark:text-text-dark-muted hover:bg-border dark:hover:bg-border-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
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