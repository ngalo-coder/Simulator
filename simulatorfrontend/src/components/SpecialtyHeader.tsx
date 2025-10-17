import React from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb, { BreadcrumbItem } from './Breadcrumb';

interface SpecialtyHeaderProps {
  specialtyName: string;
  caseCount?: number;
  showBreadcrumbs?: boolean;
  className?: string;
}

/**
 * Specialty page header component
 * Shows specialty name, breadcrumbs, and navigation between specialties
 */
const SpecialtyHeader: React.FC<SpecialtyHeaderProps> = ({
  specialtyName,
  caseCount,
  showBreadcrumbs = true,
  className = ''
}) => {
  const displayCaseCount = caseCount ?? 0;

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

    </div>
  );
};

export default SpecialtyHeader;