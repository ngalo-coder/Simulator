import React, { memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOptimizedSpecialtyPage } from '../hooks/useOptimizedSpecialtyPage';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';
import SpecialtyHeader from '../components/SpecialtyHeader';
import { SkeletonSpecialtyPage } from '../components/SkeletonLoader';
import { RetakeModal } from '../components/retake';
import { INTERNAL_MEDICINE_SUB_CATEGORIES } from '../utils/internalMedicineCategories';

interface Case {
  id: string;
  title: string;
  description: string;
  specialty?: string;
  patient_age?: number;
  patient_gender?: string;
  chief_complaint?: string;
  isCompleted?: boolean;
  lastCompletedAt?: string;
  bestScore?: number;
}

// Extended interface for cases with completion data
interface ExtendedCase extends Case {
  isCompleted?: boolean;
  lastCompletedAt?: string;
  bestScore?: number;
}

const SpecialtyCasePage: React.FC = memo(() => {
  const navigate = useNavigate();
  const { } = useSpecialtyContext();
  
  // Use optimized hook for better performance
  const {
    cases,
    loading,
    error,
    specialtyName,
    filters,
    casesResponse,
    startingSimulation,
    handleFilterChange,
    handlePageChange,
    clearAllFilters,
    hasActiveFilters,
    handleStartSimulation: optimizedStartSimulation,
    retryFetch,
  } = useOptimizedSpecialtyPage();
  
  // State for UI
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  
  // Retake functionality state
  const [showRetakeModal, setShowRetakeModal] = React.useState(false);
  const [selectedRetakeCase, setSelectedRetakeCase] = React.useState<Case | null>(null);







  // Enhanced simulation start handler with specialty context
  const handleStartSimulation = React.useCallback(async (case_: Case) => {
    try {
      await optimizedStartSimulation(case_);
      
      // Navigate to simulation interface, preserving specialty context
      navigate(`/simulation/${case_.id}`, {
        state: {
          specialtyContext: {
            specialty: specialtyName,
            specialtySlug: specialtyName.toLowerCase().replace(/\s+/g, '_'),
            returnUrl: `/${specialtyName.toLowerCase().replace(/\s+/g, '_')}`
          }
        }
      });
    } catch (error) {
      // Error handling is done in the optimized hook
      console.error('Navigation error:', error);
    }
  }, [optimizedStartSimulation, navigate, specialtyName]);

  const handleRetakeCase = React.useCallback((case_: Case) => {
    setSelectedRetakeCase(case_);
    setShowRetakeModal(true);
  }, []);

  const handleRetakeSuccess = React.useCallback((sessionId: string) => {
    if (selectedRetakeCase) {
      navigate(`/simulation/${selectedRetakeCase.id}/session/${sessionId}`, {
        state: {
          specialtyContext: {
            specialty: specialtyName,
            specialtySlug: specialtyName.toLowerCase().replace(/\s+/g, '_'),
            returnUrl: `/${specialtyName.toLowerCase().replace(/\s+/g, '_')}`
          },
          isRetake: true
        }
      });
    }
  }, [selectedRetakeCase, navigate, specialtyName]);

  // Show skeleton loading state
  if (loading && !cases.length) {
    return <SkeletonSpecialtyPage />;
  }

  // Handle error states
  if (error === 'Invalid specialty URL') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Invalid Specialty URL
          </h2>
          <p className="text-gray-600 mb-6">
            The specialty URL you're trying to access is not valid.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/browse-cases"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Specialties
            </Link>
            <Link
              to="/simulation"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              All Cases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'Specialty not found') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Specialty Not Found
          </h2>
          <p className="text-gray-600 mb-2">
            The specialty "{specialtyName}" was not found.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This specialty may not exist or may not have any cases available.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/browse-cases"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Available Specialties
            </Link>
            <Link
              to="/simulation"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              View All Cases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Specialty Header with breadcrumbs and navigation */}
      <SpecialtyHeader 
        specialtyName={specialtyName}
        specialtySlug={specialtyName.toLowerCase().replace(/\s+/g, '_')}
        showNavigation={true}
        showBreadcrumbs={true}
        className="mb-8"
      />



      {/* Search and Filtering */}
      <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
        {/* Basic Search */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder={`Search within ${specialtyName} cases...`}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              showAdvancedFilters
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 focus:ring-blue-500'
                : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-hover focus:ring-gray-500'
            }`}
          >
            {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
          </button>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t pt-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Patient Gender Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Gender
                </label>
                <select
                  value={filters.patient_gender}
                  onChange={(e) => handleFilterChange({ patient_gender: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Patient Age Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Age
                </label>
                <input
                  type="number"
                  value={filters.patient_age_min || ''}
                  onChange={(e) => handleFilterChange({ 
                    patient_age_min: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="Min age"
                  min="0"
                  max="120"
                  className="w-full px-3 py-2.5 bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Age
                </label>
                <input
                  type="number"
                  value={filters.patient_age_max || ''}
                  onChange={(e) => handleFilterChange({ 
                    patient_age_max: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="Max age"
                  min="0"
                  max="120"
                  className="w-full px-3 py-2.5 bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                />
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters() && (
              <div className="mt-4 p-4 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm rounded-lg border border-blue-100/50 dark:border-blue-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">Active filters:</span>
                    {filters.search && (
                      <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 text-xs rounded-full border border-blue-200/50 dark:border-blue-700/50 shadow-sm">
                        Search: "{filters.search}"
                      </span>
                    )}
                    {filters.patient_gender && (
                      <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 text-xs rounded-full border border-blue-200/50 dark:border-blue-700/50 shadow-sm">
                        Gender: {filters.patient_gender}
                      </span>
                    )}
                    {(filters.patient_age_min !== undefined || filters.patient_age_max !== undefined) && (
                      <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 text-xs rounded-full border border-blue-200/50 dark:border-blue-700/50 shadow-sm">
                        Age: {filters.patient_age_min || 0}-{filters.patient_age_max || '∞'}
                      </span>
                    )}
                    {filters.sub_category && (
                      <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 text-xs rounded-full border border-blue-200/50 dark:border-blue-700/50 shadow-sm">
                        Sub-Specialty: {INTERNAL_MEDICINE_SUB_CATEGORIES.find(cat => cat.id === filters.sub_category)?.name || filters.sub_category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cases Grid */}
      {loading && cases.length === 0 ? (
        <SkeletonSpecialtyPage />
      ) : error === 'Failed to load cases' ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Cases
          </h3>
          <p className="text-gray-600 mb-2">
            There was an error loading the {specialtyName} cases.
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Retry attempt: {retryCount}/3
            </p>
          )}
          <p className="text-gray-600 mb-6">
            Please check your internet connection and try again.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => {
                setRetryCount(prev => prev + 1);
                retryFetch();
              }}
              disabled={retryCount >= 3}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {retryCount >= 3 ? 'Max Retries Reached' : 'Retry'}
            </button>
            <Link
              to="/browse-cases"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Browse Other Specialties
            </Link>
            <Link
              to="/simulation"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              View All Cases
            </Link>
          </div>
        </div>
      ) : error === 'Invalid response format' ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Data Format Error
          </h3>
          <p className="text-gray-600 mb-4">
            The server returned data in an unexpected format. This might be a temporary issue.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => {
                setRetryCount(prev => prev + 1);
                retryFetch();
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/browse-cases"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Browse Specialties
            </Link>
          </div>
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {hasActiveFilters() ? 'No Matching Cases Found' : `No ${specialtyName} Cases Available`}
          </h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters() 
              ? `No cases found matching your filters in ${specialtyName}. Try adjusting your search criteria.`
              : `There are currently no cases available in ${specialtyName}.`
            }
          </p>
          <div className="flex justify-center space-x-3">
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
            <Link
              to="/browse-cases"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Browse Other Specialties
            </Link>
            <Link
              to="/simulation"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              View All Cases
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Cases count and pagination info */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {hasActiveFilters() 
                  ? `Found ${casesResponse.totalCases} case${casesResponse.totalCases !== 1 ? 's' : ''} matching your filters in ${specialtyName}`
                  : `${casesResponse.totalCases} case${casesResponse.totalCases !== 1 ? 's' : ''} available in ${specialtyName}`
                }
              </p>
              {casesResponse.totalPages > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Page {casesResponse.currentPage} of {casesResponse.totalPages}
                  {casesResponse.totalCases > 0 && (
                    <span> • Showing {((casesResponse.currentPage - 1) * filters.limit) + 1}-{Math.min(casesResponse.currentPage * filters.limit, casesResponse.totalCases)} of {casesResponse.totalCases}</span>
                  )}
                </p>
              )}
            </div>
            
            {/* Cases per page selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange({ limit: parseInt(e.target.value) })}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
          </div>

          {/* Cases grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {cases.map((case_) => {
              const extendedCase = case_ as ExtendedCase;
              return (
                <div
                  key={case_.id}
                  className="relative rounded-2xl shadow-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-blue-300 dark:border-blue-500/30 dark:from-blue-900/30 dark:to-blue-800/20 p-6"
                >
                  {/* Decorative background */}
                  <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-300 dark:opacity-10 dark:group-hover:opacity-20" style={{background: 'radial-gradient(circle at 80% 20%, #3b82f6 0%, transparent 70%)'}} />                {/* Content */}
                <div className="relative z-10">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors duration-200">
                        {case_.title}
                      </h3>
                      {extendedCase.isCompleted && (
                        <div className="flex flex-col items-end ml-2 flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700/50 shadow-sm">
                            ✓ Completed
                          </span>
                          {extendedCase.bestScore && (
                            <span className="text-xs text-blue-600 dark:text-blue-300 font-semibold mt-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                              Best: {extendedCase.bestScore}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-3 leading-relaxed">
                      {case_.description}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    {case_.specialty && (
                      <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-700/50">
                        <span className="text-blue-600 dark:text-blue-300 font-medium">Specialty:</span>
                        <span className="text-blue-800 dark:text-blue-200 font-semibold bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded-md text-xs">{case_.specialty}</span>
                      </div>
                    )}

                    {case_.patient_age && case_.patient_gender && (
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700/50">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">Patient:</span>
                        <span className="text-gray-800 dark:text-gray-200 font-semibold">{case_.patient_age}y {case_.patient_gender}</span>
                      </div>
                    )}
                    {case_.chief_complaint && (
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-700/50">
                        <span className="text-amber-700 dark:text-amber-300 font-medium text-xs block mb-1">Chief Complaint:</span>
                        <span className="text-amber-800 dark:text-amber-200 font-semibold text-sm">{case_.chief_complaint}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleStartSimulation(case_)}
                      disabled={startingSimulation}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.01] flex items-center justify-center space-x-2"
                    >
                      {startingSimulation ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Starting...</span>
                        </>
                      ) : (
                        <>
                          <span>🩺</span>
                          <span>{extendedCase.isCompleted ? 'Start New Attempt' : 'Start Simulation'}</span>
                        </>
                      )}
                    </button>
                    
                    {extendedCase.isCompleted && (
                      <button
                        onClick={() => handleRetakeCase(case_)}
                        disabled={startingSimulation}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 hover:from-orange-600 hover:to-orange-700 dark:hover:from-orange-800 dark:hover:to-orange-900 text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-orange-300 dark:focus:ring-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.01] flex items-center justify-center space-x-2"
                      >
                        <span>🔄</span>
                        <span>Retake for Improvement</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );})}
          </div>

          {/* Pagination Controls */}
          {casesResponse.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button
                onClick={() => handlePageChange(casesResponse.currentPage - 1)}
                disabled={!casesResponse.hasPrevPage}
                className="px-4 py-2.5 text-sm font-semibold bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, casesResponse.totalPages) }, (_, i) => {
                  let pageNum;
                  if (casesResponse.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (casesResponse.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (casesResponse.currentPage >= casesResponse.totalPages - 2) {
                    pageNum = casesResponse.totalPages - 4 + i;
                  } else {
                    pageNum = casesResponse.currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        pageNum === casesResponse.currentPage
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white shadow-md'
                          : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-hover'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(casesResponse.currentPage + 1)}
                disabled={!casesResponse.hasNextPage}
                className="px-4 py-2.5 text-sm font-semibold bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Retake Modal */}
      <RetakeModal
        isOpen={showRetakeModal}
        onClose={() => {
          setShowRetakeModal(false);
          setSelectedRetakeCase(null);
        }}
        caseId={selectedRetakeCase?.id || ''}
        caseTitle={selectedRetakeCase?.title || ''}
        onRetakeSuccess={handleRetakeSuccess}
      />
    </div>
  );
});

SpecialtyCasePage.displayName = 'SpecialtyCasePage';

export default SpecialtyCasePage;