import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/apiService';

interface Case {
  id: string;
  title: string;
  description: string;
  specialty?: string;
  patient_age?: number;
  patient_gender?: string;
  chief_complaint?: string;
}

const SimulationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSimulation, setStartingSimulation] = useState(false);
  
  // Initialize filters with preselected values from navigation state or specialty context
  const [filters, setFilters] = useState(() => {
    const preselectedFilters = location.state?.preselectedFilters;
    
    // If no preselected filters, try to use specialty context for smart "All Cases"
    if (!preselectedFilters?.program_area && !preselectedFilters?.specialty) {
      const context = api.getSpecialtyContext();
      if (context) {
        return {
          program_area: context.programArea,
          specialty: context.specialty,
          search: ''
        };
      }
    }
    
    return {
      program_area: preselectedFilters?.program_area || '',
      specialty: preselectedFilters?.specialty || '',
      search: ''
    };
  });
  
  // Check if user came with preselected filters (direct navigation from case browsing)
  const hasPreselectedFilters = Boolean(
    location.state?.preselectedFilters?.program_area && 
    location.state?.preselectedFilters?.specialty
  );
  
  // Check if we're using specialty context (smart "All Cases")
  const isUsingSpecialtyContext = Boolean(
    !hasPreselectedFilters && 
    filters.program_area && 
    filters.specialty
  );
  const [categories, setCategories] = useState<{
    program_areas: string[];
    specialties: string[];
    specialized_areas: string[];
  }>({
    program_areas: [],
    specialties: [],
    specialized_areas: []
  });
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCases();
  }, [filters]);

  useEffect(() => {
    // When program area changes, update available specialties and reset specialty filter
    if (filters.program_area) {
      fetchSpecialtiesForProgramArea(filters.program_area);
      setFilters(prev => ({ ...prev, specialty: '' })); // Reset specialty when program area changes
    } else if (categories.specialties && Array.isArray(categories.specialties)) {
      setAvailableSpecialties(categories.specialties);
    }
  }, [filters.program_area, categories.specialties]);

  const fetchCategories = async () => {
    try {
      const response = await api.getCaseCategories();
      if (response) {
        setCategories(response);
        setAvailableSpecialties(response.specialties || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set default empty categories to prevent crashes
      setCategories({
        program_areas: [],
        specialties: [],
        specialized_areas: []
      });
      setAvailableSpecialties([]);
    }
  };

  const fetchSpecialtiesForProgramArea = async (programArea: string) => {
    try {
      const response = await api.getCaseCategories({ program_area: programArea });
      if (response && response.specialties) {
        setAvailableSpecialties(response.specialties);
      } else {
        setAvailableSpecialties([]);
      }
    } catch (error) {
      console.error('Error fetching specialties for program area:', error);
      setAvailableSpecialties([]);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await api.getCases(filters);
      if (response && Array.isArray(response.cases)) {
        setCases(response.cases);
      } else {
        setCases([]);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = async (case_: Case) => {
    try {
      setStartingSimulation(true);
      const response = await api.startSimulation(case_.id);
      
      // Determine return URL based on current context
      let returnUrl = '/simulation';
      if (hasPreselectedFilters && filters.specialty) {
        // If we have preselected filters, try to construct specialty URL
        const specialtySlug = filters.specialty.toLowerCase().replace(/\s+/g, '_');
        returnUrl = `/${specialtySlug}`;
      } else if (isUsingSpecialtyContext && filters.specialty) {
        // If using specialty context, construct specialty URL
        const specialtySlug = filters.specialty.toLowerCase().replace(/\s+/g, '_');
        returnUrl = `/${specialtySlug}`;
      }
      
      // Navigate to simulation interface with session ID and specialty context
      navigate(`/simulation/${case_.id}/session/${response.sessionId}`, {
        state: {
          specialtyContext: {
            specialty: filters.specialty,
            returnUrl: returnUrl
          }
        }
      });
    } catch (error) {
      console.error('Error starting simulation:', error);
      alert('Failed to start simulation. Please try again.');
    } finally {
      setStartingSimulation(false);
    }
  };



  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            {hasPreselectedFilters ? (
              <>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {filters.specialty} Cases
                  </h1>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {filters.program_area}
                  </span>
                </div>
                <p className="text-gray-600">
                  Ready to practice? Choose a case below to start your simulation.
                </p>
              </>
            ) : isUsingSpecialtyContext ? (
              <>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    All {filters.specialty} Cases
                  </h1>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    {filters.program_area}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Smart Filter
                  </span>
                </div>
                <p className="text-gray-600">
                  Showing all cases in {filters.specialty}. Want to see cases from other specialties?{' '}
                  <button 
                    onClick={() => {
                      api.clearSpecialtyContext();
                      setFilters({ program_area: '', specialty: '', search: '' });
                    }}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear filter
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  All Patient Cases
                </h1>
                <p className="text-gray-600">
                  {filters.program_area && filters.specialty 
                    ? `Showing cases for ${filters.specialty} in ${filters.program_area}`
                    : 'Browse all available cases or use filters to narrow your selection'
                  }
                </p>
              </>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {(hasPreselectedFilters || isUsingSpecialtyContext) && (
              <Link 
                to="/browse-cases"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
              >
                <span>←</span>
                <span>Change Specialty</span>
              </Link>
            )}
            {!hasPreselectedFilters && !isUsingSpecialtyContext && (filters.program_area || filters.specialty) && (
              <Link 
                to="/browse-cases"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
              >
                <span>←</span>
                <span>Browse by Category</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filters - Only show if user didn't come with preselected filters and not using specialty context */}
      {!hasPreselectedFilters && !isUsingSpecialtyContext && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter Cases</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Program Area - Primary Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center">
                Program Area
                <span className="ml-1 text-blue-600 text-xs">(Step 1)</span>
              </span>
            </label>
            <select
              value={filters.program_area}
              onChange={(e) => setFilters({...filters, program_area: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Program Areas</option>
              {categories.program_areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Specialty - Secondary Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center">
                Specialty
                <span className="ml-1 text-blue-600 text-xs">(Step 2)</span>
              </span>
            </label>
            <select
              value={filters.specialty}
              onChange={(e) => setFilters({...filters, specialty: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!filters.program_area && availableSpecialties.length === 0}
            >
              <option value="">
                {filters.program_area ? 'All Specialties' : 'Select Program Area First'}
              </option>
              {availableSpecialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
            {filters.program_area && availableSpecialties.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No specialties available for selected program area</p>
            )}
          </div>



          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Search cases..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Summary */}
        {(filters.program_area || filters.specialty || filters.search) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-blue-800 font-medium">Active filters:</span>
                {filters.program_area && (
                  <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                    Program: {filters.program_area}
                  </span>
                )}
                {filters.specialty && (
                  <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                    Specialty: {filters.specialty}
                  </span>
                )}

                {filters.search && (
                  <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                    Search: "{filters.search}"
                  </span>
                )}
              </div>
              <button
                onClick={() => setFilters({ program_area: '', specialty: '', search: '' })}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Simple search for preselected filters or specialty context */}
      {(hasPreselectedFilters || isUsingSpecialtyContext) && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Search within these cases..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {filters.search && (
              <button
                onClick={() => setFilters({...filters, search: ''})}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cases Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading cases...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {(hasPreselectedFilters || isUsingSpecialtyContext) ? (
            <>
              <p className="text-gray-600 mb-2">No cases found in {filters.specialty}.</p>
              <p className="text-sm text-gray-500 mb-4">
                {filters.search 
                  ? 'Try a different search term or browse other specialties.'
                  : 'There are currently no cases available in this specialty.'
                }
              </p>
              <div className="flex justify-center space-x-3">
                {filters.search && (
                  <button
                    onClick={() => setFilters({...filters, search: ''})}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
                <Link
                  to="/browse-cases"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Browse Other Specialties
                </Link>
                {isUsingSpecialtyContext && (
                  <button
                    onClick={() => {
                      api.clearSpecialtyContext();
                      setFilters({ program_area: '', specialty: '', search: '' });
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Show All Cases
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-2">No cases found matching your criteria.</p>
              <p className="text-sm text-gray-500 mb-4">
                Try adjusting your filters or search terms to find more cases.
              </p>
              <button
                onClick={() => setFilters({ program_area: '', specialty: '', search: '' })}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            </>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default SimulationPage;