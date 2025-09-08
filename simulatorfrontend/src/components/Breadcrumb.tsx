import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb navigation component
 * Shows navigation trail: Home → Specialty → Cases
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav 
      className={`flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}
      aria-label="Breadcrumb navigation"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span 
              className="text-gray-400 dark:text-gray-500 select-none" 
              aria-hidden="true"
            >
              →
            </span>
          )}
          
          {item.href && !item.isActive ? (
            <Link
              to={item.href}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1"
              aria-current={item.isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className={`${
                item.isActive 
                  ? 'font-semibold text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              aria-current={item.isActive ? 'page' : undefined}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;