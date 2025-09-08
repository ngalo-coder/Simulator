import React from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb, { BreadcrumbItem } from './Breadcrumb';
import SpecialtyNavigation from './SpecialtyNavigation';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';

interface SpecialtyHeaderProps {
  specialtyName: string;
  specialtySlug: string;
  caseCount?: number;
  showNavigation?: boolean;
  showBreadcrumbs?: boolean;
  className?: string;
}

/**
 * Specialty page header component
 * Shows specialty name, breadcrumbs, and navigation between specialties
 */
const SpecialtyHeader: React.FC<SpecialtyHeaderProps> = ({
  specialtyName,
  specialtySlug,
  caseCount,
  showNavigation = true,
  showBreadcrumbs = true,
  className = ''
}) => {
  const { specialtyRoutes } = useSpecialtyContext();
  
  // Find current specialty route to get case count if not provided
  const currentRoute = specialtyRoutes.find(route => route.slug === specialtySlug);
  const displayCaseCount = caseCount ?? currentRoute?.caseCount ?? 0;

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Home',
      href: '/dashboard'
    },
    {
      label: 'Browse Cases',
      href: '/browse-cases'
    },
    {
      label: specialtyName,
      isActive: true
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Breadcrumb Navigation */}
      {showBreadcrumbs && (
        <Breadcrumb items={breadcrumbItems} />
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {specialtyName} Cases
            </h1>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full font-medium">
              Specialty
            </span>
            {displayCaseCount > 0 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-full">
                {displayCaseCount} case{displayCaseCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Explore and practice cases specifically in {specialtyName}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          <Link 
            to="/browse-cases"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-2 py-1"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Browse Specialties
          </Link>
          
          <Link 
            to="/simulation"
            className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            All Cases
          </Link>
        </div>
      </div>

      {/* Specialty Navigation */}
      {showNavigation && specialtyRoutes.length > 1 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Switch Specialty:
          </h3>
          <SpecialtyNavigation 
            showCaseCounts={true}
            maxVisible={5}
          />
        </div>
      )}
    </div>
  );
};

export default SpecialtyHeader;