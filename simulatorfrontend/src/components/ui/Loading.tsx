import { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'medical';
  text?: string;
  fullScreen?: boolean;
}

const Loading = forwardRef<HTMLDivElement, LoadingProps>(({
  className,
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  ...props
}, ref) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const SpinnerIcon = () => (
    <svg
      className={clsx('animate-spin', sizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const DotsIcon = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={clsx(
            'bg-current rounded-full animate-bounce',
            {
              'w-1 h-1': size === 'xs',
              'w-1.5 h-1.5': size === 'sm',
              'w-2 h-2': size === 'md',
              'w-3 h-3': size === 'lg',
              'w-4 h-4': size === 'xl',
            }
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );

  const PulseIcon = () => (
    <div className={clsx('rounded-full animate-pulse', sizes[size], 'bg-current opacity-75')} />
  );

  const MedicalIcon = () => (
    <div className="relative">
      <svg
        className={clsx('animate-pulse-medical', sizes[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M22 12h-4l-3 9L9 3l-3 9H2"
        />
      </svg>
      <div className="absolute inset-0 rounded-full border-2 border-current animate-ping opacity-30" />
    </div>
  );

  const renderIcon = () => {
    switch (variant) {
      case 'dots':
        return <DotsIcon />;
      case 'pulse':
        return <PulseIcon />;
      case 'medical':
        return <MedicalIcon />;
      default:
        return <SpinnerIcon />;
    }
  };

  const content = (
    <div
      ref={ref}
      className={clsx(
        'flex flex-col items-center justify-center space-y-3',
        {
          'min-h-screen': fullScreen,
          'p-8': fullScreen,
        },
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <div className="flex items-center justify-center">
        {renderIcon()}
      </div>

      {text && (
        <p className={clsx(
          'text-gray-600 dark:text-dark-secondary font-medium',
          textSizes[size]
        )}>
          {text}
        </p>
      )}

      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-dark-surface z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
});

Loading.displayName = 'Loading';

export default Loading;