import React from 'react';
import Card from './Card';

interface EnhancedProgramCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  colorScheme: 'basic' | 'specialty';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  progress?: number;
  isNew?: boolean;
  isPopular?: boolean;
  features?: string[];
  onClick?: () => void;
  className?: string;
}

const EnhancedProgramCard: React.FC<EnhancedProgramCardProps> = ({
  title,
  description,
  icon,
  colorScheme,
  difficulty = 'beginner',
  prerequisites = [],
  progress = 0,
  isNew = false,
  isPopular = false,
  features = [],
  onClick,
  className = ''
}) => {
  const colorSchemes = {
    basic: {
      primary: 'from-green-500 to-blue-500',
      secondary: 'from-green-50 to-blue-50',
      border: 'border-green-200',
      accent: 'text-green-600',
      bg: 'bg-gradient-to-br from-green-50 to-blue-50',
      icon: 'bg-green-100 text-green-600',
      progress: 'bg-green-500'
    },
    specialty: {
      primary: 'from-purple-500 to-yellow-500',
      secondary: 'from-purple-50 to-yellow-50',
      border: 'border-purple-200',
      accent: 'text-purple-600',
      bg: 'bg-gradient-to-br from-purple-50 to-yellow-50',
      icon: 'bg-purple-100 text-purple-600',
      progress: 'bg-purple-500'
    }
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 border-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    advanced: 'bg-red-100 text-red-800 border-red-200'
  };

  const currentScheme = colorSchemes[colorScheme];

  return (
    <Card
      variant="elevated"
      className={`group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${currentScheme.bg} ${currentScheme.border} ${className}`}
      onClick={onClick}
    >
      {/* Header with Icon and Badges */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${currentScheme.icon} shadow-lg`}>
            {icon}
          </div>

          <div className="flex flex-col items-end space-y-2">
            {isNew && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                NEW
              </span>
            )}
            {isPopular && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                🔥 Popular
              </span>
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${difficultyColors[difficulty]}`}>
              {difficulty}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Progress Ring */}
      {progress > 0 && (
        <div className="absolute top-4 right-4">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={currentScheme.progress}
                strokeWidth="2"
                strokeDasharray={`${progress}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      )}


      {/* Features List */}
      {features.length > 0 && (
        <div className="px-6 pb-4">
          <div className="space-y-1">
            {features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center text-xs text-gray-600">
                <svg className="w-3 h-3 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </div>
            ))}
            {features.length > 3 && (
              <div className="text-xs text-gray-500">
                +{features.length - 3} more features
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <div className="px-6 pb-4">
          <div className="text-xs text-gray-500 mb-1">Prerequisites:</div>
          <div className="flex flex-wrap gap-1">
            {prerequisites.map((prereq, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border"
              >
                {prereq}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="p-6 pt-0">
        <button
          className={`w-full py-3 px-4 bg-gradient-to-r ${currentScheme.primary} text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200 group-hover:shadow-xl`}
        >
          <span className="flex items-center justify-center">
            Explore Program
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  );
};

export default EnhancedProgramCard;