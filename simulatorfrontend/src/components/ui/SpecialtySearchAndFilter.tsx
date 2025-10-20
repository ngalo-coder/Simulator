import React from 'react';
import { clsx } from 'clsx';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface SpecialtySearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  difficultyFilter: string;
  onDifficultyChange: (difficulty: string) => void;
  durationFilter: string;
  onDurationChange: (duration: string) => void;
  specialtyFilter: string;
  onSpecialtyChange: (specialty: string) => void;
  phaseFilter: string;
  onPhaseChange: (phase: string) => void;
  difficultyOptions: FilterOption[];
  durationOptions: FilterOption[];
  specialtyOptions: FilterOption[];
  phaseOptions: FilterOption[];
  resultsCount: number;
  totalCount: number;
  className?: string;
}

const SpecialtySearchAndFilter: React.FC<SpecialtySearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  difficultyFilter,
  onDifficultyChange,
  durationFilter,
  onDurationChange,
  specialtyFilter,
  onSpecialtyChange,
  phaseFilter,
  onPhaseChange,
  difficultyOptions,
  durationOptions,
  specialtyOptions,
  phaseOptions,
  resultsCount,
  totalCount,
  className = ''
}) => {
  const clearAllFilters = () => {
    onSearchChange('');
    onDifficultyChange('');
    onDurationChange('');
    onSpecialtyChange('');
    onPhaseChange('');
  };

  const hasActiveFilters = searchTerm || difficultyFilter || durationFilter || specialtyFilter || phaseFilter;

  return (
    <Card
      variant="elevated"
      padding="md"
      className={clsx('sticky top-4', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Modules
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Showing {resultsCount} of {totalCount} modules
          </span>
          {hasActiveFilters && (
            <Badge variant="info" size="sm">
              Filtered
            </Badge>
          )}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty Level
        </label>
        <div className="space-y-2">
          <button
            onClick={() => onDifficultyChange('')}
            className={clsx(
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
              !difficultyFilter
                ? 'bg-medical-100 text-medical-800 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            All Levels
          </button>
          {difficultyOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onDifficultyChange(option.value)}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                difficultyFilter === option.value
                  ? 'bg-medical-100 text-medical-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <span>{option.label}</span>
              {option.count !== undefined && (
                <Badge variant="secondary" size="xs">
                  {option.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration
        </label>
        <div className="space-y-2">
          <button
            onClick={() => onDurationChange('')}
            className={clsx(
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
              !durationFilter
                ? 'bg-medical-100 text-medical-800 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            Any Duration
          </button>
          {durationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onDurationChange(option.value)}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                durationFilter === option.value
                  ? 'bg-medical-100 text-medical-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <span>{option.label}</span>
              {option.count !== undefined && (
                <Badge variant="secondary" size="xs">
                  {option.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Phase Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Availability
        </label>
        <div className="space-y-2">
          <button
            onClick={() => onPhaseChange('')}
            className={clsx(
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
              !phaseFilter
                ? 'bg-medical-100 text-medical-800 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            All Phases
          </button>
          {phaseOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onPhaseChange(option.value)}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                phaseFilter === option.value
                  ? 'bg-medical-100 text-medical-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <span>{option.label}</span>
              {option.count !== undefined && (
                <Badge variant="secondary" size="xs">
                  {option.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Specialty Filter */}
      {specialtyOptions.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specialty Type
          </label>
          <div className="space-y-2">
            <button
              onClick={() => onSpecialtyChange('')}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                !specialtyFilter
                  ? 'bg-medical-100 text-medical-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              All Modules
            </button>
            {specialtyOptions.slice(0, 5).map((option) => (
              <button
                key={option.value}
                onClick={() => onSpecialtyChange(option.value)}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                  specialtyFilter === option.value
                    ? 'bg-medical-100 text-medical-800 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <span>{option.label}</span>
                {option.count !== undefined && (
                  <Badge variant="secondary" size="xs">
                    {option.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SpecialtySearchAndFilter;