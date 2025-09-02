/**
 * Lazy-loaded wrapper for SpecialtyCasePage with loading states
 * Implements code splitting and performance optimizations
 */

import React, { Suspense, lazy, memo } from 'react';
import { SkeletonSpecialtyPage } from './SkeletonLoader';
import LoadingSpinner from './LoadingSpinner';

// Lazy load the SpecialtyCasePage component
const SpecialtyCasePage = lazy(() => import('../pages/SpecialtyCasePage'));

interface LazySpecialtyPageProps {
  // Any props that need to be passed to the specialty page
}

/**
 * Loading fallback component with skeleton
 */
const SpecialtyPageFallback: React.FC = memo(() => {
  return (
    <div className="max-w-6xl mx-auto">
      <SkeletonSpecialtyPage animate={true} />
      
      {/* Optional loading indicator overlay */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center space-x-2">
          <LoadingSpinner size="sm" text="" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Loading specialty page...
          </span>
        </div>
      </div>
    </div>
  );
});

SpecialtyPageFallback.displayName = 'SpecialtyPageFallback';

/**
 * Lazy-loaded specialty page with optimized loading states
 */
const LazySpecialtyPage: React.FC<LazySpecialtyPageProps> = memo((props) => {
  return (
    <Suspense fallback={<SpecialtyPageFallback />}>
      <SpecialtyCasePage {...props} />
    </Suspense>
  );
});

LazySpecialtyPage.displayName = 'LazySpecialtyPage';

export default LazySpecialtyPage;