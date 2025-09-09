import React, { memo, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOptimizedSpecialtyPage } from '../hooks/useOptimizedSpecialtyPage';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';
import SpecialtyHeader from '../components/SpecialtyHeader';
import { SkeletonSpecialtyPage } from '../components/SkeletonLoader';
import {
  INTERNAL_MEDICINE_SUB_CATEGORIES,
  getSubCategoriesWithCounts,
  SubCategoryWithCount
} from '../utils/internalMedicineCategories';

interface Case {
  id: string;
  title: string;
  description: string;
  specialty?: string;
  patient_age?: number;
  patient_gender?: string;
  chief_complaint?: string;
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

  // Check if this is Internal Medicine specialty
  const isInternalMedicine = useMemo(() => {
    return specialtyName.toLowerCase() === 'internal medicine';
  }, [specialtyName]);

  // Get sub-categories with case counts for Internal Medicine
  const subCategoriesWithCounts = useMemo((): SubCategoryWithCount[] => {
    if (!isInternalMedicine || !cases.length) return [];
    return getSubCategoriesWithCounts(cases);
  }, [isInternalMedicine, cases]);



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

      {/* Internal Medicine Sub-Category Tabs */}
      {isInternalMedicine && subCategoriesWithCounts.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sub-Specialties</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange({ sub_category: '', page: 1 })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !filters.sub_category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Internal Medicine ({casesResponse.totalCases})
            </button>
            {subCategoriesWithCounts
              .filter(cat => cat.count > 0)
              .map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleFilterChange({
                    sub_category: category.id,
                    page: 1
                  })}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filters.sub_category === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={category.description}
                >
                  {category.name} ({category.count})
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Search and Filtering */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        {/* Basic Search */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder={`Search within ${specialtyName} cases...`}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              showAdvancedFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
          </button>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters() && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-blue-800 font-medium">Active filters:</span>
                    {filters.search && (
                      <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                        Search: "{filters.search}"
                      </span>
                    )}
                    {filters.patient_gender && (
                      <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                        Gender: {filters.patient_gender}
                      </span>
                    )}
                    {(filters.patient_age_min !== undefined || filters.patient_age_max !== undefined) && (
                      <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                        Age: {filters.patient_age_min || 0}-{filters.patient_age_max || '∞'}
                      </span>
                    )}
                    {filters.sub_category && (
                      <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((case_) => (
              <div key={case_.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {case_.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                    {case_.description}
                  </p>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  {case_.specialty && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Specialty:</span>
                      <span className="text-gray-900">{case_.specialty}</span>
                    </div>
                  )}

                  {case_.patient_age && case_.patient_gender && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Patient:</span>
                      <span className="text-gray-900">{case_.patient_age}y {case_.patient_gender}</span>
                    </div>
                  )}
                  {case_.chief_complaint && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Chief Complaint:</span>
                      <span className="text-gray-900 text-right">{case_.chief_complaint}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleStartSimulation(case_)}
                  disabled={startingSimulation}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {startingSimulation ? 'Starting...' : 'Start Simulation'}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {casesResponse.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button
                onClick={() => handlePageChange(casesResponse.currentPage - 1)}
                disabled={!casesResponse.hasPrevPage}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pageNum === casesResponse.currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(casesResponse.currentPage + 1)}
                disabled={!casesResponse.hasNextPage}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Quick Navigation */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/simulation"
            className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors text-sm"
          >
            Browse All Cases
          </Link>
          <Link
            to="/browse-cases"
            className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors text-sm"
          >
            Other Specialties
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
});

SpecialtyCasePage.displayName = 'SpecialtyCasePage';

export default SpecialtyCasePage;