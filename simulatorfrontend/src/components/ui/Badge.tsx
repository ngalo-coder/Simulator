import { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}, ref) => {
  const baseClasses = 'status-badge inline-flex items-center font-medium transition-colors duration-200';

  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200',
    primary: 'bg-medical-100 dark:bg-medical-900/30 text-medical-800 dark:text-medical-200',
    secondary: 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200',
    success: 'status-active',
    warning: 'status-warning',
    error: 'status-critical',
    info: 'status-info',
    outline: 'border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-secondary bg-transparent',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    {
      'pl-1.5': dot,
    },
    className
  );

  return (
    <span
      ref={ref}
      className={classes}
      role={variant === 'error' || variant === 'warning' ? 'alert' : undefined}
      {...props}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            {
              'bg-medical-500': variant === 'primary',
              'bg-stable-500': variant === 'success',
              'bg-warning-500': variant === 'warning',
              'bg-emergency-500': variant === 'error',
              'bg-info-500': variant === 'info',
              'bg-gray-400': variant === 'default' || variant === 'secondary',
            }
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;