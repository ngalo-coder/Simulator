import React from 'react';

interface EnhancedProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  contextualLabel?: string;
  className?: string;
  milestones?: Array<{
    value: number;
    label: string;
    color?: string;
  }>;
}

const EnhancedProgressBar: React.FC<EnhancedProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  showLabel = true,
  label,
  contextualLabel,
  className = '',
  milestones = []
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  // Progressive color scheme: red → yellow → green
  const getProgressColor = (percent: number) => {
    if (percent < 30) {
      // Red to yellow transition (0-30%)
      const ratio = percent / 30;
      return `rgb(${Math.round(244 + (255 - 244) * ratio)}, ${Math.round(67 + (235 - 67) * ratio)}, ${Math.round(54 + (59 - 54) * ratio)})`;
    } else if (percent < 70) {
      // Yellow to green transition (30-70%)
      const ratio = (percent - 30) / 40;
      return `rgb(${Math.round(255 + (76 - 255) * ratio)}, ${Math.round(235 + (175 - 235) * ratio)}, ${Math.round(59 + (80 - 59) * ratio)})`;
    } else {
      // Green (70%+)
      return `rgb(76, 175, 80)`;
    }
  };

  const getContextualMessage = (percent: number) => {
    if (percent < 20) return "Getting Started - Every journey begins with a single step!";
    if (percent < 40) return "Building Momentum - You're making great progress!";
    if (percent < 60) return "Steady Progress - Keep up the excellent work!";
    if (percent < 80) return "Strong Performance - You're doing fantastic!";
    return "Expert Level - Outstanding achievement!";
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label and percentage */}
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className={`font-medium text-gray-900 dark:text-white ${textSizeClasses[size]}`}>
              {label || 'Progress'}
            </div>
            {contextualLabel && (
              <div className={`text-gray-600 dark:text-gray-300 ${textSizeClasses[size]} mt-1`}>
                {contextualLabel}
              </div>
            )}
          </div>
          <div className={`font-bold ${textSizeClasses[size]} text-gray-900 dark:text-white`}>
            {Math.round(percentage)}%
          </div>
        </div>
      )}

      {/* Progress bar container */}
      <div className="relative">
        <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${sizeClasses[size]} shadow-inner overflow-hidden`}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{
              width: `${percentage}%`,
              backgroundColor: getProgressColor(percentage)
            }}
          />
        </div>

        {/* Milestones */}
        {milestones.map((milestone, index) => {
          const milestonePosition = (milestone.value / max) * 100;
          if (milestonePosition <= percentage) return null;

          return (
            <div
              key={index}
              className="absolute top-0 h-full w-0.5 bg-gray-400 dark:bg-gray-500 opacity-60"
              style={{ left: `${milestonePosition}%` }}
              title={milestone.label}
            />
          );
        })}
      </div>

      {/* Contextual message */}
      <div className={`mt-2 ${textSizeClasses[size]} text-gray-600 dark:text-gray-300 italic`}>
        {getContextualMessage(percentage)}
      </div>

      {/* Milestone indicators */}
      {milestones.length > 0 && (
        <div className="flex justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
          {milestones.map((milestone, index) => (
            <div
              key={index}
              className="text-center"
              style={{ width: `${100 / milestones.length}%` }}
            >
              <div className="font-medium">{milestone.label}</div>
              <div>{milestone.value}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedProgressBar;