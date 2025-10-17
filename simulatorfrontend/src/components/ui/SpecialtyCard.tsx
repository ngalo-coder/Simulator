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
  return (
    <Card
      variant="elevated"
      padding="md"
      hover={true}
      interactive={true}
      onClick={onClick}
      className={`transition-all duration-200 hover:shadow-md ${className}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
          style={{ backgroundColor: `${specialty.color}20` }}
        >
          {specialty.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{specialty.name}</h3>
          <p className="text-sm text-gray-600">{specialty.caseCount} cases</p>
        </div>
        <div className="text-gray-400">→</div>
      </div>
    </Card>
  );
};

export default SpecialtyCard;