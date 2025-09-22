import React from 'react';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';
import {
  SpecialtyConfig,
  getSpecialtyColor,
  getSpecialtyIcon,
  getDifficultyColor,
  getDifficultyLabel
} from '../../utils/specialtyConfig';

export interface SpecialtyCardProps {
  specialty: SpecialtyConfig;
  userProgress?: {
    completedCases: number;
    totalCases: number;
    completionRate: number;
    lastAccessed?: Date;
    isInProgress?: boolean;
  };
  variant?: 'default' | 'compact' | 'featured';
  showProgress?: boolean;
  showRecommendations?: boolean;
  onClick?: () => void;
  onContinue?: () => void;
  onViewCases?: () => void;
  className?: string;
}

const SpecialtyCard: React.FC<SpecialtyCardProps> = ({
  specialty,
  userProgress,
  variant = 'default',
  showProgress = true,
  showRecommendations = true,
  onClick,
  onContinue,
  onViewCases,
  className = ''
}) => {
  const progress = userProgress || {
    completedCases: 0,
    totalCases: specialty.caseCount,
    completionRate: 0,
    isInProgress: false
  };

  const isLocked = specialty.prerequisites && specialty.prerequisites.length > 0;
  const isCompleted = progress.completionRate >= 100;
  const isAvailable = !isLocked || progress.completedCases > 0;

  const cardStyles = {
    borderLeft: `4px solid ${specialty.color}`,
    background: isLocked && !isAvailable
      ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      : `linear-gradient(135deg, ${specialty.color}08 0%, ${specialty.color}05 100%)`
  };

  const renderProgressRing = () => {
    if (!showProgress) return null;

    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress.completionRate / 100) * circumference;

    return (
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="22"
            cy="22"
            r={radius}
            stroke={specialty.color}
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold" style={{ color: specialty.color }}>
            {Math.round(progress.completionRate)}%
          </span>
        </div>
      </div>
    );
  };

  const renderDifficultyBadge = () => (
    <Badge
      variant="outline"
      className="text-xs"
      style={{
        borderColor: getDifficultyColor(specialty.difficulty),
        color: getDifficultyColor(specialty.difficulty)
      }}
    >
      {getDifficultyLabel(specialty.difficulty)}
    </Badge>
  );

  const renderStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge variant="success" className="text-xs">
          ✓ Completed
        </Badge>
      );
    }
    if (progress.isInProgress) {
      return (
        <Badge variant="warning" className="text-xs">
          In Progress
        </Badge>
      );
    }
    if (isLocked && !isAvailable) {
      return (
        <Badge variant="secondary" className="text-xs">
          🔒 Locked
        </Badge>
      );
    }
    return null;
  };

  const renderRecommendations = () => {
    if (!showRecommendations) return null;

    const recommendations = [];
    if (specialty.phase === 'current') {
      recommendations.push('Most Popular');
    }
    if (specialty.caseCount > 30) {
      recommendations.push('Comprehensive');
    }
    if (specialty.difficulty === 'beginner') {
      recommendations.push('Great for Beginners');
    }

    return recommendations.length > 0 ? (
      <div className="flex flex-wrap gap-1 mt-2">
        {recommendations.map((rec, index) => (
          <Badge key={index} variant="info" className="text-xs">
            {rec}
          </Badge>
        ))}
      </div>
    ) : null;
  };

  const renderActionButtons = () => {
    if (variant === 'compact') return null;

    return (
      <div className="flex gap-2 mt-4">
        {isCompleted ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onViewCases}
            className="flex-1"
          >
            Review Cases
          </Button>
        ) : progress.isInProgress ? (
          <Button
            size="sm"
            variant="primary"
            onClick={onContinue}
            className="flex-1"
            style={{ backgroundColor: specialty.color }}
          >
            Continue Learning
          </Button>
        ) : (
          <Button
            size="sm"
            variant="primary"
            onClick={onViewCases}
            className="flex-1"
            style={{ backgroundColor: specialty.color }}
          >
            View Cases
          </Button>
        )}

        {variant === 'featured' && (
          <Button
            size="sm"
            variant="outline"
            onClick={onClick}
          >
            Learn More
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card
      variant="elevated"
      padding="md"
      hover={true}
      interactive={true}
      onClick={onClick}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
      style={cardStyles}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-sm"
            style={{ backgroundColor: `${specialty.color}15` }}
          >
            {specialty.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {specialty.name}
            </h3>
            {variant !== 'compact' && (
              <p className="text-sm text-gray-600 mt-1">
                {specialty.caseCount} cases • {specialty.estimatedDuration}
              </p>
            )}
          </div>
        </div>

        {showProgress && renderProgressRing()}
      </div>

      {/* Description */}
      {variant !== 'compact' && (
        <p className="text-gray-700 text-sm mb-3 leading-relaxed">
          {specialty.description}
        </p>
      )}

      {/* Badges and Status */}
      <div className="flex flex-wrap gap-2 mb-3">
        {renderDifficultyBadge()}
        {renderStatusBadge()}
        {variant === 'featured' && (
          <Badge variant="info" className="text-xs">
            Featured
          </Badge>
        )}
      </div>

      {/* Recommendations */}
      {renderRecommendations()}

      {/* Progress Stats */}
      {showProgress && variant !== 'compact' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              Progress: {progress.completedCases} of {progress.totalCases} cases
            </span>
            {progress.lastAccessed && (
              <span className="text-gray-500">
                Last: {progress.lastAccessed.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Prerequisites Warning */}
      {isLocked && !isAvailable && variant !== 'compact' && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            Requires: {specialty.prerequisites?.join(', ')}
          </p>
        </div>
      )}
    </Card>
  );
};

export default SpecialtyCard;