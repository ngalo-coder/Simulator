import React, { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  type = 'text',
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  fullWidth = false,
  variant = 'outlined',
  id,
  disabled,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = 'medical-input block transition-all duration-200';

  const variants = {
    default: 'border-gray-300 dark:border-dark-border focus:border-medical-500 focus:ring-medical-500',
    filled: 'border-0 bg-gray-50 dark:bg-dark-surface focus:bg-white dark:focus:bg-dark-card focus:ring-2 focus:ring-medical-500',
    outlined: 'border border-gray-300 dark:border-dark-border focus:border-medical-500 focus:ring-2 focus:ring-medical-500',
  };

  const hasError = !!error;
  const errorClasses = hasError
    ? 'border-emergency-500 focus:border-emergency-500 focus:ring-emergency-500'
    : '';

  const disabledClasses = disabled
    ? 'bg-gray-50 dark:bg-dark-card cursor-not-allowed opacity-60'
    : '';

  const classes = clsx(
    baseClasses,
    variants[variant],
    errorClasses,
    disabledClasses,
    {
      'pl-10': leftIcon,
      'pr-10': rightIcon,
      'w-full': fullWidth,
    },
    className
  );

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="medical-label"
        >
          {label}
          {props.required && <span className="text-emergency-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 dark:text-dark-secondary">
              {leftIcon}
            </span>
          </div>
        )}

        <input
          ref={ref}
          type={type}
          id={inputId}
          className={classes}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            hasError
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-gray-400 dark:text-dark-secondary">
              {rightIcon}
            </span>
          </div>
        )}
      </div>

      {helperText && !hasError && (
        <p
          id={`${inputId}-helper`}
          className="mt-1 text-sm text-gray-500 dark:text-dark-secondary"
        >
          {helperText}
        </p>
      )}

      {hasError && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-emergency-600 dark:text-emergency-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;