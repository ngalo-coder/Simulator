import React, { memo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOptimizedSpecialtyPage } from '../hooks/useOptimizedSpecialtyPage';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';
import SpecialtyHeader from '../components/SpecialtyHeader';
import { SkeletonSpecialtyPage } from '../components/SkeletonLoader';

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
    handlePageChange,
    handleStartSimulation: optimizedStartSimulation,
    retryFetch,
  } = useOptimizedSpecialtyPage();










  // Enhanced simulation start handler with specialty context
  const handleStartSimulation = useCallback(async (case_: Case) => {
    try {
      await optimizedStartSimulation(case_);

      // Navigate to simulation interface, preserving specialty context
      navigate(`/simulation/${case_.id}`, {
        state: {
          specialtyContext: {
            specialty: specialtyName,
            returnUrl: `/specialty/${specialtyName.toLowerCase().replace(/\s+/g, '_')}`
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
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Cases
          </h2>
          <p className="text-gray-600 mb-6">
            There was a problem loading the {specialtyName} cases. Please try again.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/browse-cases"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Browse Specialties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Specialty Header with breadcrumbs */}
      <SpecialtyHeader
        specialtyName={specialtyName}
        showBreadcrumbs={true}
        className="mb-6"
      />




      {/* Cases Grid */}
      {loading && cases.length === 0 ? (
        <SkeletonSpecialtyPage />
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Cases
          </h3>
          <p className="text-gray-600 mb-6">
            There was a problem loading the cases. Please try again.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => {
                retryFetch();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/browse-cases"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Browse Specialties
            </Link>
          </div>
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filters.search ? 'No Matching Cases Found' : `No ${specialtyName} Cases Available`}
          </h3>
          <p className="text-gray-600 mb-4">
            {filters.search
              ? `No cases found matching "${filters.search}" in ${specialtyName}. Try adjusting your search.`
              : `There are currently no cases available in ${specialtyName}.`
            }
          </p>
          <div className="flex justify-center space-x-3">
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
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {filters.search
                ? `Found ${casesResponse.totalCases} case${casesResponse.totalCases !== 1 ? 's' : ''} matching "${filters.search}" in ${specialtyName}`
                : `${casesResponse.totalCases} case${casesResponse.totalCases !== 1 ? 's' : ''} available in ${specialtyName}`
              }
            </p>
            
          </div>

          {/* Cases grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((case_) => {
              const extendedCase = case_ as ExtendedCase;
              return (
                <div
                  key={case_.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="mb-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {case_.title}
                      </h3>
                      {extendedCase.isCompleted && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {case_.description}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    {case_.patient_age && case_.patient_gender && (
                      <div className="text-gray-600">
                        Patient: {case_.patient_age}y {case_.patient_gender}
                      </div>
                    )}
                    {case_.chief_complaint && (
                      <div className="text-gray-600 text-xs">
                        Chief Complaint: {case_.chief_complaint}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleStartSimulation(case_)}
                    disabled={startingSimulation}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {startingSimulation ? 'Starting...' : 'Start Simulation'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {casesResponse.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-4">
              <button
                onClick={() => handlePageChange(casesResponse.currentPage - 1)}
                disabled={!casesResponse.hasPrevPage}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {casesResponse.currentPage} of {casesResponse.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(casesResponse.currentPage + 1)}
                disabled={!casesResponse.hasNextPage}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
});

SpecialtyCasePage.displayName = 'SpecialtyCasePage';

export default SpecialtyCasePage;