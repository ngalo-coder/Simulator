import React, { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  difficultyFilter: string;
  onDifficultyChange: (difficulty: string) => void;
  durationFilter: string;
  onDurationChange: (duration: string) => void;
  specialtyFilter: string;
  onSpecialtyChange: (specialty: string) => void;
  difficultyOptions: FilterOption[];
  durationOptions: FilterOption[];
  specialtyOptions: FilterOption[];
  resultsCount?: number;
  className?: string;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  difficultyFilter,
  onDifficultyChange,
  durationFilter,
  onDurationChange,
  specialtyFilter,
  onSpecialtyChange,
  difficultyOptions,
  durationOptions,
  specialtyOptions,
  resultsCount,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const FilterSection: React.FC<{
    title: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    showAll?: boolean;
  }> = ({ title, value, onChange, options, showAll = false }) => {
    const displayOptions = showAll ? options : options.slice(0, 4);
    const hasMore = options.length > 4;

    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">{title}</div>
        <div className="space-y-1">
          <button
            onClick={() => onChange('')}
            className={`w-full text-left px-2 py-1 text-sm rounded ${
              value === ''
                ? 'bg-blue-100 text-blue-800 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All {title.toLowerCase()}
          </button>
          {displayOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`w-full text-left px-2 py-1 text-sm rounded flex items-center justify-between ${
                value === option.value
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{option.label}</span>
              {option.count !== undefined && (
                <span className="text-xs text-gray-500">({option.count})</span>
              )}
            </button>
          ))}
          {!showAll && hasMore && (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full text-left px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              +{options.length - 4} more...
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search cases by symptoms, conditions, or skills..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {resultsCount !== undefined && (
          <div className="mt-2 text-sm text-gray-600">
            {resultsCount} result{resultsCount !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => {
              onSearchChange('');
              onDifficultyChange('');
              onDurationChange('');
              onSpecialtyChange('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FilterSection
            title="Difficulty"
            value={difficultyFilter}
            onChange={onDifficultyChange}
            options={difficultyOptions}
            showAll={isExpanded}
          />

          <FilterSection
            title="Duration"
            value={durationFilter}
            onChange={onDurationChange}
            options={durationOptions}
            showAll={isExpanded}
          />

          <FilterSection
            title="Specialty"
            value={specialtyFilter}
            onChange={onSpecialtyChange}
            options={specialtyOptions}
            showAll={isExpanded}
          />

          {/* Smart Categories */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Categories</div>
            <div className="space-y-1">
              <button className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                By Clinical Skill
              </button>
              <button className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                By Patient Type
              </button>
              <button className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                By Learning Objective
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Show less filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilter;