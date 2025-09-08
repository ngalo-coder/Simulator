/**
 * Skeleton loading components for better user experience
 * Provides various skeleton layouts for different content types
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

interface SkeletonCardProps extends SkeletonProps {
  showImage?: boolean;
  showActions?: boolean;
}

interface SkeletonListProps extends SkeletonProps {
  items?: number;
}

/**
 * Base skeleton component
 */
export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  animate = true 
}) => {
  return (
    <div 
      className={`bg-gray-200 dark:bg-gray-700 rounded ${
        animate ? 'animate-pulse' : ''
      } ${className}`}
    />
  );
};

/**
 * Skeleton for case cards
 */
export const SkeletonCaseCard: React.FC<SkeletonCardProps> = ({ 
  className = '',
  animate = true,
  showImage = false,
  showActions = true
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      {showImage && (
        <Skeleton 
          className="w-full h-32 mb-4" 
          animate={animate}
        />
      )}
      
      {/* Title */}
      <Skeleton 
        className="h-6 w-3/4 mb-3" 
        animate={animate}
      />
      
      {/* Description lines */}
      <Skeleton 
        className="h-4 w-full mb-2" 
        animate={animate}
      />
      <Skeleton 
        className="h-4 w-5/6 mb-2" 
        animate={animate}
      />
      <Skeleton 
        className="h-4 w-2/3 mb-4" 
        animate={animate}
      />
      
      {/* Metadata */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" animate={animate} />
          <Skeleton className="h-3 w-20" animate={animate} />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" animate={animate} />
          <Skeleton className="h-3 w-16" animate={animate} />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" animate={animate} />
          <Skeleton className="h-3 w-24" animate={animate} />
        </div>
      </div>
      
      {/* Action button */}
      {showActions && (
        <Skeleton 
          className="h-10 w-full" 
          animate={animate}
        />
      )}
    </div>
  );
};

/**
 * Skeleton for case grid
 */
export const SkeletonCaseGrid: React.FC<SkeletonListProps> = ({ 
  items = 6,
  className = '',
  animate = true
}) => {
  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: items }, (_, index) => (
        <SkeletonCaseCard 
          key={index}
          animate={animate}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton for specialty header
 */
export const SkeletonSpecialtyHeader: React.FC<SkeletonProps> = ({ 
  className = '',
  animate = true
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 mb-4">
        <Skeleton className="h-4 w-12" animate={animate} />
        <span className="text-gray-400">›</span>
        <Skeleton className="h-4 w-20" animate={animate} />
        <span className="text-gray-400">›</span>
        <Skeleton className="h-4 w-16" animate={animate} />
      </div>
      
      {/* Title */}
      <Skeleton className="h-8 w-64 mb-2" animate={animate} />
      
      {/* Subtitle */}
      <Skeleton className="h-4 w-48" animate={animate} />
    </div>
  );
};

/**
 * Skeleton for filters section
 */
export const SkeletonFilters: React.FC<SkeletonProps> = ({ 
  className = '',
  animate = true
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 ${className}`}>
      {/* Search bar */}
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="flex-1 h-10" animate={animate} />
        <Skeleton className="h-10 w-24" animate={animate} />
        <Skeleton className="h-10 w-16" animate={animate} />
      </div>
    </div>
  );
};

/**
 * Skeleton for pagination
 */
export const SkeletonPagination: React.FC<SkeletonProps> = ({ 
  className = '',
  animate = true
}) => {
  return (
    <div className={`flex items-center justify-center space-x-2 mt-8 ${className}`}>
      <Skeleton className="h-8 w-16" animate={animate} />
      <Skeleton className="h-8 w-8" animate={animate} />
      <Skeleton className="h-8 w-8" animate={animate} />
      <Skeleton className="h-8 w-8" animate={animate} />
      <Skeleton className="h-8 w-16" animate={animate} />
    </div>
  );
};

/**
 * Complete skeleton for specialty page
 */
export const SkeletonSpecialtyPage: React.FC<SkeletonProps> = ({ 
  className = '',
  animate = true
}) => {
  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <SkeletonSpecialtyHeader animate={animate} />
      <SkeletonFilters animate={animate} />
      
      {/* Cases count */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-48" animate={animate} />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-12" animate={animate} />
          <Skeleton className="h-8 w-16" animate={animate} />
          <Skeleton className="h-4 w-16" animate={animate} />
        </div>
      </div>
      
      <SkeletonCaseGrid animate={animate} />
      <SkeletonPagination animate={animate} />
    </div>
  );
};

/**
 * Skeleton for navigation items
 */
export const SkeletonNavigation: React.FC<SkeletonListProps> = ({ 
  items = 5,
  className = '',
  animate = true
}) => {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {Array.from({ length: items }, (_, index) => (
        <Skeleton 
          key={index}
          className="h-8 w-20" 
          animate={animate}
        />
      ))}
    </div>
  );
};

export default Skeleton;