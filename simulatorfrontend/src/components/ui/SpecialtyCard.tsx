import React from 'react';
import Card from './Card';
import { SpecialtyConfig } from '../../utils/specialtyConfig';

export interface SpecialtyCardProps {
  specialty: SpecialtyConfig;
  variant?: 'default' | 'compact' | 'featured';
  onClick?: () => void;
  className?: string;
}

const SpecialtyCard: React.FC<SpecialtyCardProps> = ({
  specialty,
  variant = 'default',
  onClick,
  className = ''
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-4';
      case 'featured':
        return 'p-8 ring-2 ring-gradient-to-r from-blue-200 to-purple-200 shadow-2xl';
      default:
        return 'p-6';
    }
  };

  return (
    <Card
      variant="elevated"
      padding="lg"
      hover={true}
      interactive={true}
      onClick={onClick}
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 bg-gradient-to-br from-white via-gray-50 to-blue-50/30 ${getVariantClasses()} ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100 to-purple-100 opacity-20 rounded-full transform translate-x-10 -translate-y-10"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-100 to-pink-100 opacity-20 rounded-full transform -translate-x-8 translate-y-8"></div>

      <div className="relative">
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0"
            style={{ backgroundColor: `${specialty.color}15`, border: `2px solid ${specialty.color}30` }}
          >
            <div className="text-gray-700 group-hover:text-gray-900 transition-colors">
              {specialty.icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                {specialty.name}
              </h3>
            </div>

            {specialty.description && (
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 line-clamp-2">
                {specialty.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-blue-600 font-semibold text-xs sm:text-sm">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {specialty.caseCount || 0} case{(specialty.caseCount || 0) !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="text-gray-400 text-lg sm:text-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                →
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SpecialtyCard;