import React from 'react';
import { clsx } from 'clsx';

export interface SpecialtyGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    large?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SpecialtyGrid: React.FC<SpecialtyGridProps> = ({
  children,
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    large: 4
  },
  gap = 'md',
  className = ''
}) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  const gridClasses = clsx(
    'grid',
    gapClasses[gap],
    {
      'grid-cols-1': columns.mobile === 1,
      'md:grid-cols-2': columns.tablet === 2,
      'lg:grid-cols-3': columns.desktop === 3,
      'xl:grid-cols-4': columns.large === 4,
      '2xl:grid-cols-5': columns.large === 5,
    },
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

export default SpecialtyGrid;