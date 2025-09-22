import { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  interactive?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  interactive = false,
  children,
  ...props
}, ref) => {
  const baseClasses = 'medical-card transition-all duration-300';

  const variants = {
    default: 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border',
    elevated: 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-medical-lg',
    outlined: 'bg-transparent border-2 border-gray-300 dark:border-dark-border',
    glass: 'glass-medical-strong',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const interactiveClasses = interactive
    ? 'cursor-pointer hover:shadow-medical-lg focus-within:shadow-medical-lg focus-within:ring-2 focus-within:ring-medical-500 focus-within:ring-offset-2'
    : '';

  const hoverClasses = hover && !interactive
    ? 'hover-lift hover:shadow-medical-lg'
    : '';

  const classes = clsx(
    baseClasses,
    variants[variant],
    paddings[padding],
    interactiveClasses,
    hoverClasses,
    className
  );

  return (
    <div
      ref={ref}
      className={classes}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;