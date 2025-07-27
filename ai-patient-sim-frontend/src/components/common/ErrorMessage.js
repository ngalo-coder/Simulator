import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`alert alert-error ${className}`}>
      <div className="flex">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};

export default ErrorMessage;