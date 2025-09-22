import React from 'react';
import Card from './Card';

export interface SpecialtyCardSkeletonProps {
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

const SpecialtyCardSkeleton: React.FC<SpecialtyCardSkeletonProps> = ({
  variant = 'default',
  className = ''
}) => {
  const isCompact = variant === 'compact';

  return (
    <Card
      variant="elevated"
      padding="md"
      className={`animate-pulse ${className}`}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
            {!isCompact && (
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            )}
          </div>
        </div>

        {!isCompact && (
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        )}
      </div>

      {/* Description */}
      {!isCompact && (
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      )}

      {/* Badges */}
      <div className="flex gap-2 mb-3">
        <div className="h-5 bg-gray-200 rounded w-16"></div>
        <div className="h-5 bg-gray-200 rounded w-20"></div>
      </div>

      {/* Progress Stats */}
      {!isCompact && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isCompact && (
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          {variant === 'featured' && (
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          )}
        </div>
      )}
    </Card>
  );
};

export default SpecialtyCardSkeleton;