import React from 'react';

interface RetakeButtonProps {
  caseId: string;
  caseTitle: string;
  previousSessionId?: string;
  className?: string;
  onRetakeStart?: () => void;
  disabled?: boolean;
}

const RetakeButton: React.FC<RetakeButtonProps> = ({
  className = '',
  onRetakeStart,
  disabled = false
}) => {
  const handleRetakeClick = () => {
    if (onRetakeStart) {
      onRetakeStart();
    }
    // This will be implemented to trigger retake modal
  };

  return (
    <button
      onClick={handleRetakeClick}
      disabled={disabled}
      className={`inline-flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.01] ${className}`}
    >
      <span>🔄</span>
      <span>Retake Case</span>
    </button>
  );
};

export default RetakeButton;