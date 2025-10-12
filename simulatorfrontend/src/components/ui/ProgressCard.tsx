import React from 'react';
import Card from './Card';

interface ProgressCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'medical' | 'stable' | 'warning' | 'emergency' | 'info';
  size?: 'sm' | 'md' | 'lg';
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  size = 'md',
  trend,
  className = ''
}) => {
  const colorClasses = {
    medical: {
      bg: 'bg-gradient-to-br from-medical-50 to-medical-100',
      border: 'border-l-medical-500',
      icon: 'bg-medical-100 text-medical-600',
      text: 'text-medical-700',
      accent: 'text-medical-600'
    },
    stable: {
      bg: 'bg-gradient-to-br from-stable-50 to-stable-100',
      border: 'border-l-stable-500',
      icon: 'bg-stable-100 text-stable-600',
      text: 'text-stable-700',
      accent: 'text-stable-600'
    },
    warning: {
      bg: 'bg-gradient-to-br from-warning-50 to-warning-100',
      border: 'border-l-warning-500',
      icon: 'bg-warning-100 text-warning-600',
      text: 'text-warning-700',
      accent: 'text-warning-600'
    },
    emergency: {
      bg: 'bg-gradient-to-br from-emergency-50 to-emergency-100',
      border: 'border-l-emergency-500',
      icon: 'bg-emergency-100 text-emergency-600',
      text: 'text-emergency-700',
      accent: 'text-emergency-600'
    },
    info: {
      bg: 'bg-gradient-to-br from-info-50 to-info-100',
      border: 'border-l-info-500',
      icon: 'bg-info-100 text-info-600',
      text: 'text-info-700',
      accent: 'text-info-600'
    }
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const titleSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const currentColor = colorClasses[color];

  const getContrastColor = () => '#111827';

  const contrast = getContrastColor();

  return (
    <Card
      variant="elevated"
      className={`${currentColor.bg} ${currentColor.border} hover-lift transition-all duration-300 transform hover:scale-102 hover:shadow-lg ${className}`}
      padding="none"
      role="group"
      aria-label={`${title} progress card`}
    >
      <div className={`${sizeClasses[size]} text-center`}>
        {/* Icon */}
        <div
          className={`${iconSizeClasses[size]} ${currentColor.icon} rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm`}
          style={{ color: contrast }}
          aria-hidden={true}
        >
          {icon}
        </div>

        {/* Value */}
        <div className={`${valueSizeClasses[size]} font-bold ${currentColor.text} mb-1`}>
          {value}
        </div>

        {/* Title */}
        <div className={`${titleSizeClasses[size]} ${currentColor.accent} font-medium mb-2`}>
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            className="text-xs text-gray-600 dark:text-gray-300"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {subtitle}
          </div>
        )}

        {/* Trend */}
        {trend && (
          <div className={`mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            trend.value >= 0
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <svg
              className={`w-3 h-3 mr-1 ${trend.value >= 0 ? 'rotate-0' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProgressCard;