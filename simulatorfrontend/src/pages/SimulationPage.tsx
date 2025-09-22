import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/apiService';
import { RetakeModal } from '../components/retake';
import CaseCard from '../components/CaseCard';
import { Button, Card, Input, Badge, Loading } from '../components/ui';

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

const SimulationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSimulation, setStartingSimulation] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [selectedRetakeCase, setSelectedRetakeCase] = useState<Case | null>(null);
  
  const [filters, setFilters] = useState(() => {
    const preselectedFilters = location.state?.preselectedFilters;
    
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
  
  const hasPreselectedFilters = Boolean(
    location.state?.preselectedFilters?.program_area && 
    location.state?.preselectedFilters?.specialty
  );
  
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
    if (filters.program_area) {
      fetchSpecialtiesForProgramArea(filters.program_area);
      setFilters(prev => ({ ...prev, specialty: '' }));
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
      
      const [casesResponse, progressResponse] = await Promise.all([
        api.getCases(filters),
        api.getUserProgress().catch(() => null)
      ]);
      
      if (casesResponse && Array.isArray(casesResponse.cases)) {
        let enhancedCases = casesResponse.cases;
        
        if (progressResponse?.recentMetrics) {
          const completedCaseIds = new Set(progressResponse.recentMetrics.map((m: any) => m.caseId));
          
          enhancedCases = casesResponse.cases.map((case_: any) => ({
            ...case_,
            isCompleted: completedCaseIds.has(case_.id),
            lastCompletedAt: progressResponse.recentMetrics
              .find((m: any) => m.caseId === case_.id)?.completedAt,
            bestScore: progressResponse.recentMetrics
              .filter((m: any) => m.caseId === case_.id)
              .reduce((best: number, current: any) => Math.max(best, current.score || 0), 0) || undefined
          }));
        }
        
        setCases(enhancedCases);
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
      
      let returnUrl = '/simulation';
      if (hasPreselectedFilters && filters.specialty) {
        const specialtySlug = filters.specialty.toLowerCase().replace(/\s+/g, '_');
        returnUrl = `/${specialtySlug}`;
      } else if (isUsingSpecialtyContext && filters.specialty) {
        const specialtySlug = filters.specialty.toLowerCase().replace(/\s+/g, '_');
        returnUrl = `/${specialtySlug}`;
      }
      
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

  const handleRetakeCase = (case_: Case) => {
    setSelectedRetakeCase(case_);
    setShowRetakeModal(true);
  };

  const handleRetakeSuccess = (sessionId: string) => {
    if (selectedRetakeCase) {
      let returnUrl = '/simulation';
      if (hasPreselectedFilters && filters.specialty) {
        const specialtySlug = filters.specialty.toLowerCase().replace(/\s+/g, '_');
        returnUrl = `/${specialtySlug}`;
      } else if (isUsingSpecialtyContext && filters.specialty) {
        const specialtySlug = filters.specialty.toLowerCase().replace(/\s+/g, '_');
        returnUrl = `/${specialtySlug}`;
      }
      
      navigate(`/simulation/${selectedRetakeCase.id}/session/${sessionId}`, {
        state: {
          specialtyContext: {
            specialty: filters.specialty,
            returnUrl: returnUrl
          },
          isRetake: true
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-stable-50">
      {/* Medical Header with Hospital-like Design */}
      <div className="bg-gradient-medical text-white shadow-medical-lg border-b border-medical-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">
                    Virtual Patient Ward
                  </h1>
                  <p className="text-medical-100 text-sm lg:text-base">
                    Advanced Medical Simulation Environment
                  </p>
                </div>
              </div>

              {/* Live Status Indicator */}
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-white/10 rounded-lg">
                <div className="w-2 h-2 bg-stable-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">System Online</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-white">{cases.length}</div>
                  <div className="text-medical-100">Available Cases</div>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className="text-center">
                  <div className="font-semibold text-white">
                    {cases.filter(c => c.isCompleted).length}
                  </div>
                  <div className="text-medical-100">Completed</div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center space-x-2">
                {(hasPreselectedFilters || isUsingSpecialtyContext) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/browse-cases')}
                    className="text-white hover:bg-white/10"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Change Department
                  </Button>
                )}
                {!hasPreselectedFilters && !isUsingSpecialtyContext && (filters.program_area || filters.specialty) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/browse-cases')}
                    className="text-white hover:bg-white/10"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Browse Departments
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Department/Specialty Context Banner */}
          {(hasPreselectedFilters || isUsingSpecialtyContext) && (
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="primary" size="lg">
                    {filters.specialty} Department
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {filters.program_area}
                  </Badge>
                </div>
                <div className="text-medical-100 text-sm">
                  Ready to begin patient assessment? Select a case below to start your simulation session.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title for non-specialty context */}
        {!hasPreselectedFilters && !isUsingSpecialtyContext && (
          <div className="mb-8">
            <div className="text-center">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Patient Case Library
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {filters.program_area && filters.specialty
                  ? `Medical cases for ${filters.specialty} in ${filters.program_area} program`
                  : 'Comprehensive collection of virtual patient scenarios for medical training'
                }
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Medical Filters */}
        {!hasPreselectedFilters && !isUsingSpecialtyContext && (
          <Card className="mb-8 border-l-4 border-l-medical-500">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-medical-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Medical Case Filters</h3>
                  <p className="text-sm text-gray-600">Refine your search to find specific patient scenarios</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Program Area */}
                <div>
                  <label className="medical-label flex items-center">
                    <svg className="w-4 h-4 mr-2 text-medical-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Program Area
                    <Badge variant="info" size="xs" className="ml-2">Step 1</Badge>
                  </label>
                  <select
                    value={filters.program_area}
                    onChange={(e) => setFilters({...filters, program_area: e.target.value})}
                    className="medical-input mt-2"
                  >
                    <option value="">All Program Areas</option>
                    {categories.program_areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                {/* Specialty */}
                <div>
                  <label className="medical-label flex items-center">
                    <svg className="w-4 h-4 mr-2 text-medical-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Medical Specialty
                    <Badge variant="info" size="xs" className="ml-2">Step 2</Badge>
                  </label>
                  <select
                    value={filters.specialty}
                    onChange={(e) => setFilters({...filters, specialty: e.target.value})}
                    className="medical-input mt-2"
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
                    <p className="mt-2 text-xs text-warning-600 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      No specialties available for selected program area
                    </p>
                  )}
                </div>

                {/* Search */}
                <div>
                  <label className="medical-label flex items-center">
                    <svg className="w-4 h-4 mr-2 text-medical-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Cases
                  </label>
                  <Input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    placeholder="Search by patient name, condition, or symptoms..."
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Active Filters Summary */}
              {(filters.program_area || filters.specialty || filters.search) && (
                <div className="mt-6 p-4 bg-medical-50 dark:bg-medical-900/20 rounded-lg border border-medical-200 dark:border-medical-800">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-medical-800 dark:text-medical-200">
                        Active filters:
                      </span>
                      {filters.program_area && (
                        <Badge variant="primary" className="cursor-pointer hover:bg-medical-600" onClick={() => setFilters({...filters, program_area: ''})}>
                          Program: {filters.program_area} ×
                        </Badge>
                      )}
                      {filters.specialty && (
                        <Badge variant="primary" className="cursor-pointer hover:bg-medical-600" onClick={() => setFilters({...filters, specialty: ''})}>
                          Specialty: {filters.specialty} ×
                        </Badge>
                      )}
                      {filters.search && (
                        <Badge variant="secondary" className="cursor-pointer hover:bg-gray-600" onClick={() => setFilters({...filters, search: ''})}>
                          Search: "{filters.search}" ×
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilters({ program_area: '', specialty: '', search: '' })}
                      className="text-medical-600 hover:text-medical-800"
                    >
                      Clear all
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Simple search for preselected filters or specialty context */}
        {(hasPreselectedFilters || isUsingSpecialtyContext) && (
          <Card className="mb-8 border-l-4 border-l-medical-500">
            <div className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    placeholder="Search within these cases..."
                  />
                </div>
                {filters.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({...filters, search: ''})}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </Card>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {cases.map((case_) => (
            <CaseCard
              key={case_.id}
              case_={case_}
              onStartSimulation={handleStartSimulation}
              onRetake={handleRetakeCase}
              startingSimulation={startingSimulation}
            />
          ))}
        </div>
      )}
      
        {/* Cases Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loading size="lg" variant="medical" />
            <p className="text-gray-600 mt-4 text-lg">Loading patient cases...</p>
            <p className="text-gray-500 text-sm">Preparing medical simulation environment</p>
          </div>
        ) : cases.length === 0 ? (
          <Card className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-2">
                {(hasPreselectedFilters || isUsingSpecialtyContext) ? 'No Cases Available' : 'No Cases Found'}
              </h3>
              <p className="text-gray-600 dark:text-dark-secondary mb-6">
                {(hasPreselectedFilters || isUsingSpecialtyContext) ? (
                  <>
                    No cases found in {filters.specialty}.
                    {filters.search
                      ? ' Try a different search term or browse other specialties.'
                      : ' There are currently no cases available in this specialty.'
                    }
                  </>
                ) : (
                  'No cases found matching your criteria. Try adjusting your filters or search terms.'
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {filters.search && (
                  <Button
                    variant="secondary"
                    onClick={() => setFilters({...filters, search: ''})}
                  >
                    Clear Search
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={() => navigate('/browse-cases')}
                >
                  Browse Other Departments
                </Button>
                {isUsingSpecialtyContext && (
                  <Button
                    variant="success"
                    onClick={() => {
                      api.clearSpecialtyContext();
                      setFilters({ program_area: '', specialty: '', search: '' });
                    }}
                  >
                    Show All Cases
                  </Button>
                )}
                {!hasPreselectedFilters && !isUsingSpecialtyContext && (
                  <Button
                    variant="secondary"
                    onClick={() => setFilters({ program_area: '', specialty: '', search: '' })}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Cases Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-dark-card rounded-xl shadow-medical border border-gray-200 dark:border-dark-border">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-medical-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-dark-primary">
                    {cases.length} Total Cases
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-stable-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-dark-primary">
                    {cases.filter(c => c.isCompleted).length} Completed
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-dark-primary">
                    {cases.filter(c => !c.isCompleted).length} Available
                  </span>
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-dark-secondary">Sort by:</span>
                <select className="text-sm border border-gray-300 dark:border-dark-border rounded-md px-2 py-1 bg-white dark:bg-dark-surface">
                  <option>Most Recent</option>
                  <option>Difficulty</option>
                  <option>Specialty</option>
                  <option>Patient Age</option>
                </select>
              </div>
            </div>

            {/* Cases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {cases.map((case_) => (
                <CaseCard
                  key={case_.id}
                  case_={case_}
                  onStartSimulation={handleStartSimulation}
                  onRetake={handleRetakeCase}
                  startingSimulation={startingSimulation}
                />
              ))}
            </div>
          </div>
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
    </div>
  );
};

export default SimulationPage;
