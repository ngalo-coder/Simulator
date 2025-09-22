import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/apiService';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';
import { EnhancedProgramCard, SearchAndFilter } from '../components/ui';

// Removed unused interfaces - using dynamic data from API instead

const CaseBrowsingPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const {
    currentSpecialty,
    availableSpecialties,
    specialtyRoutes,
    loading: specialtyLoading,
    error: specialtyError,
    navigateToSpecialty,
    getSpecialtyFromSlug,
    clearError,
    forceRefreshSpecialties
  } = useSpecialtyContext();

  const [step, setStep] = useState<'program' | 'specialty'>('program');
  const [selectedProgramArea, setSelectedProgramArea] = useState<string>('');
  const [programAreas, setProgramAreas] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialtyCounts, setSpecialtyCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  
  // Detect if we're in specialty context from URL or current specialty
  const isSpecialtyContext = !!(currentSpecialty || params.specialty);
  const contextSpecialty = currentSpecialty || (params.specialty ? getSpecialtyFromSlug(params.specialty) : null);

  // Program area configurations with descriptions and icons
  const programAreaConfig: Record<string, { description: string; icon: string }> = {
    'Basic Program': {
      description: 'Foundational medical cases covering essential clinical skills and common presentations',
      icon: '🏥'
    },
    'Specialty Program': {
      description: 'Advanced cases in specialized medical fields requiring deeper clinical expertise',
      icon: '🔬'
    }
  };

  // Specialty configurations with descriptions
  const specialtyConfig: Record<string, string> = {
    'General Surgery': 'Surgical cases covering common procedures and surgical decision-making',
    'Internal Medicine': 'Complex medical cases focusing on diagnosis and management of internal conditions',
    'Pediatrics': 'Child and adolescent health cases with age-specific considerations',
    'Reproductive Health': 'Cases related to reproductive system health and family planning',
    'Emergency Medicine': 'Acute care scenarios requiring rapid assessment and intervention',
    'Cardiology': 'Heart and cardiovascular system cases',
    'Neurology': 'Neurological conditions and brain-related cases',
    'Psychiatry': 'Mental health and psychiatric condition cases',
    'Nursing': 'Nursing care cases focusing on patient assessment, intervention, and care planning',
    'Laboratory': 'Laboratory medicine cases covering diagnostic testing and result interpretation',
    'Pharmacy': 'Pharmacology cases focusing on medication management and pharmaceutical care',
    'Radiology': 'Medical imaging cases covering interpretation of X-rays, CT scans, and other imaging modalities',
    'Ophthalmology': 'Eye care cases covering vision assessment and ocular disease management'
  };

  // Enhanced program configurations with real data
  const enhancedProgramConfig = {
    'Basic Program': {
      description: 'Foundational medical cases covering essential clinical skills and common presentations across multiple specialties',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      colorScheme: 'basic' as const,
      difficulty: 'beginner' as const,
      prerequisites: [],
      features: [
        'Core clinical skills',
        'Common presentations',
        'Basic procedures',
        'Patient communication'
      ],
      isPopular: true
    },
    'Specialty Program': {
      description: 'Advanced cases in specialized medical fields requiring deeper clinical expertise and complex decision-making',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      colorScheme: 'specialty' as const,
      difficulty: 'intermediate' as const,
      prerequisites: ['Basic Program'],
      features: [
        'Advanced diagnostics',
        'Complex cases',
        'Specialized procedures',
        'Multi-system involvement'
      ],
      isNew: true
    }
  };

  // Filter options with real data (showing specialty counts)
  const totalSpecialties = programAreas.length > 0 ? programAreas.reduce((total, area) => total + (specialtyCounts[area] || 0), 0) : 0;

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner', count: Math.floor(totalSpecialties * 0.4) },
    { value: 'intermediate', label: 'Intermediate', count: Math.floor(totalSpecialties * 0.5) },
    { value: 'advanced', label: 'Advanced', count: Math.floor(totalSpecialties * 0.1) }
  ];

  const durationOptions = [
    { value: '15-30', label: '15-30 minutes', count: Math.floor(totalSpecialties * 0.6) },
    { value: '30-45', label: '30-45 minutes', count: Math.floor(totalSpecialties * 0.3) },
    { value: '45-60', label: '45-60 minutes', count: Math.floor(totalSpecialties * 0.1) },
    { value: '60+', label: '60+ minutes', count: Math.floor(totalSpecialties * 0.05) }
  ];

  const specialtyOptions = specialties.map(specialty => ({
    value: specialty.toLowerCase().replace(/\s+/g, '-'),
    label: specialty,
    count: specialtyCounts[specialty] || 0
  }));

  useEffect(() => {
    // If we're in specialty context, skip the normal flow and show specialty-specific content
    if (isSpecialtyContext && contextSpecialty) {
      // Set up the component to show specialty-specific cases
      setStep('specialty');
      // Find the program area for this specialty by checking available data
      fetchSpecialtyProgramArea(contextSpecialty);
    } else {
      fetchProgramAreas();
    }
  }, [isSpecialtyContext, contextSpecialty]);

  useEffect(() => {
    if (selectedProgramArea && !isSpecialtyContext) {
      fetchSpecialtiesForProgram(selectedProgramArea);
    }
  }, [selectedProgramArea, isSpecialtyContext]);

  // Handle specialty error states
  useEffect(() => {
    if (specialtyError && isSpecialtyContext) {
      // Show error for invalid specialty
      console.error('Specialty error:', specialtyError);
    }
  }, [specialtyError, isSpecialtyContext]);

  const fetchProgramAreas = async () => {
    try {
      setLoading(true);
      const response = await api.getCaseCategories();
      setProgramAreas(response.program_areas || []);
    } catch (error) {
      console.error('Error fetching program areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialtyProgramArea = async (specialty: string) => {
    try {
      setLoading(true);
      // Fetch all categories to find which program area contains this specialty
      const response = await api.getCaseCategories();
      const allProgramAreas = response.program_areas || [];
      
      // Check each program area to find the one containing our specialty
      for (const programArea of allProgramAreas) {
        const programResponse = await api.getCaseCategories({ program_area: programArea });
        const programSpecialties = programResponse.specialties || [];
        
        if (programSpecialties.includes(specialty)) {
          setSelectedProgramArea(programArea);
          setSpecialties(programSpecialties);
          setSpecialtyCounts(programResponse.specialty_counts || {});
          break;
        }
      }
      
      setProgramAreas(allProgramAreas);
    } catch (error) {
      console.error('Error fetching specialty program area:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialtiesForProgram = async (programArea: string) => {
    try {
      setLoading(true);
      const response = await api.getCaseCategories({ program_area: programArea });
      setSpecialties(response.specialties || []);
      
      // Use case counts from backend response (no need for individual API calls)
      setSpecialtyCounts(response.specialty_counts || {});
    } catch (error) {
      console.error('Error fetching specialties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramAreaSelect = (programArea: string) => {
    setSelectedProgramArea(programArea);
    setStep('specialty');
  };

  const handleSpecialtySelect = (specialty: string) => {
    // Save the specialty context for smart "All Cases" functionality
    api.setSpecialtyContext(selectedProgramArea, specialty);
    
    // Navigate to the specialty-specific route
    navigateToSpecialty(specialty);
  };

  const handleBackToPrograms = () => {
    if (isSpecialtyContext) {
      // If we're in specialty context, navigate back to browse-cases
      navigate('/browse-cases');
    } else {
      setStep('program');
      setSelectedProgramArea('');
      setSpecialties([]);
      setSpecialtyCounts({});
    }
  };

  const handleNavigateToSpecialty = (specialty: string) => {
    navigateToSpecialty(specialty);
  };

  const handleViewAllCases = () => {
    if (contextSpecialty) {
      // Navigate to specialty-specific cases page
      navigateToSpecialty(contextSpecialty);
    } else {
      // Navigate to general simulation page
      navigate('/simulation');
    }
  };

  const handleRefreshSpecialties = async () => {
    try {
      setRefreshing(true);
      await forceRefreshSpecialties();
      console.log('Specialties refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh specialties:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if ((loading && step === 'program') || (specialtyLoading && isSpecialtyContext)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isSpecialtyContext ? 'Loading specialty information...' : 'Loading program areas...'}
          </p>
        </div>
      </div>
    );
  }

  // Handle specialty error states
  if (specialtyError && isSpecialtyContext) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">
            Specialty Not Available
          </h3>
          <p className="text-red-700 mb-4">
            {specialtyError}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleRefreshSpecialties}
              disabled={refreshing}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Specialties'}
            </button>
            <button
              onClick={() => {
                clearError();
                navigate('/browse-cases');
              }}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Browse All Cases
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSpecialtyContext && contextSpecialty
                ? `${contextSpecialty} Cases`
                : step === 'program' 
                ? 'Choose Program Area' 
                : 'Choose Specialty'
              }
            </h1>
            <p className="text-gray-600">
              {isSpecialtyContext && contextSpecialty
                ? `Browse cases and simulations in ${contextSpecialty}`
                : step === 'program' 
                ? 'Select a program area to explore available medical cases'
                : `Select a specialty within ${selectedProgramArea}`
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefreshSpecialties}
              disabled={refreshing || specialtyLoading}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Refresh specialties"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">Refresh</span>
            </button>

            {(step === 'specialty' || isSpecialtyContext) && (
              <button
                onClick={handleBackToPrograms}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>←</span>
                <span>{isSpecialtyContext ? 'Browse All Cases' : 'Back to Programs'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          {isSpecialtyContext && contextSpecialty ? (
            <>
              <span 
                className="hover:text-blue-600 cursor-pointer"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </span>
              <span>→</span>
              <span 
                className="hover:text-blue-600 cursor-pointer"
                onClick={() => navigate('/browse-cases')}
              >
                Browse Cases
              </span>
              <span>→</span>
              <span className="font-semibold text-blue-600">
                {contextSpecialty}
              </span>
            </>
          ) : (
            <>
              <span 
                className={`${step === 'program' ? 'font-semibold text-blue-600' : 'hover:text-blue-600 cursor-pointer'}`}
                onClick={step === 'specialty' ? handleBackToPrograms : undefined}
              >
                Program Area
              </span>
              {step === 'specialty' && (
                <>
                  <span>→</span>
                  <span className="font-semibold text-blue-600">
                    {selectedProgramArea} → Specialty
                  </span>
                </>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Specialty Context Content */}
      {isSpecialtyContext && contextSpecialty && (
        <div>
          {/* Specialty Information Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-blue-900 mb-2">
                  {contextSpecialty}
                </h2>
                <p className="text-blue-700 mb-4">
                  {specialtyConfig[contextSpecialty] || 'Specialized medical cases in this field'}
                </p>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-blue-600">
                    {specialtyCounts[contextSpecialty] || 0} available specialties
                  </span>
                  <button
                    onClick={handleViewAllCases}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View All Cases →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation to Other Specialties */}
          {availableSpecialties.length > 1 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Explore Other Specialties
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSpecialties
                  .filter(specialty => specialty !== contextSpecialty)
                  .slice(0, 6) // Show max 6 other specialties
                  .map((specialty) => {
                    const route = specialtyRoutes.find(r => r.specialty === specialty);
                    const caseCount = route?.caseCount || 0;
                    
                    return (
                      <div
                        key={specialty}
                        onClick={() => handleNavigateToSpecialty(specialty)}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <h4 className="font-medium text-gray-900 mb-1">{specialty}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {specialtyConfig[specialty] || 'Specialized medical cases'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {caseCount} specialt{caseCount !== 1 ? 'ies' : 'y'}
                          </span>
                          <span className="text-xs text-blue-600">View →</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {availableSpecialties.length > 7 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate('/browse-cases')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All Specialties →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty State for Specialty with No Cases */}
          {specialtyCounts[contextSpecialty] === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Cases Available Yet
              </h3>
              <p className="text-gray-600 mb-4">
                There are no specialties available for {contextSpecialty} at the moment.
                New specialties are added regularly, so please check back soon.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/browse-cases')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Other Specialties
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Program Selection with Search and Filters */}
      {!isSpecialtyContext && step === 'program' && (
        <div className="space-y-6">
          {/* Search and Filter Sidebar */}
          <div className="lg:fixed lg:top-32 lg:left-4 lg:w-80 z-10">
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              difficultyFilter={difficultyFilter}
              onDifficultyChange={setDifficultyFilter}
              durationFilter={durationFilter}
              onDurationChange={setDurationFilter}
              specialtyFilter={specialtyFilter}
              onSpecialtyChange={setSpecialtyFilter}
              difficultyOptions={difficultyOptions}
              durationOptions={durationOptions}
              specialtyOptions={specialtyOptions}
              resultsCount={Object.entries(enhancedProgramConfig)
                .filter(([key]) =>
                  key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  enhancedProgramConfig[key as keyof typeof enhancedProgramConfig].description.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .filter(([key]) =>
                  !difficultyFilter || enhancedProgramConfig[key as keyof typeof enhancedProgramConfig].difficulty === difficultyFilter
                ).length}
            />
          </div>

          {/* Enhanced Program Cards Grid */}
          <div className="lg:ml-80">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Object.entries(enhancedProgramConfig)
                .filter(([key]) =>
                  key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  enhancedProgramConfig[key as keyof typeof enhancedProgramConfig].description.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .filter(([key]) =>
                  !difficultyFilter || enhancedProgramConfig[key as keyof typeof enhancedProgramConfig].difficulty === difficultyFilter
                )
                .map(([programKey, config]) => (
                  <EnhancedProgramCard
                    key={programKey}
                    title={programKey}
                    description={config.description}
                    icon={config.icon}
                    colorScheme={config.colorScheme}
                    difficulty={config.difficulty}
                    prerequisites={config.prerequisites}
                    features={config.features}
                    isPopular={'isPopular' in config ? config.isPopular : false}
                    isNew={'isNew' in config ? config.isNew : false}
                    onClick={() => handleProgramAreaSelect(programKey)}
                  />
                ))}
            </div>

            {/* Featured Cases Section */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Featured Cases This Week
                </h3>
                <p className="text-gray-600">
                  Popular cases and new additions to help you advance your skills
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {specialties.slice(0, 3).map((specialty, index) => {
                  const specialtyCount = specialtyCounts[specialty] || 0;
                  const isNew = index === 0;
                  const isPopular = specialtyCount > 20;

                  return {
                    title: `${specialty} Specialty`,
                    specialty: specialty,
                    duration: specialtyCount > 30 ? "45 min" : specialtyCount > 15 ? "30 min" : "20 min",
                    difficulty: specialtyCount > 30 ? "advanced" as const : specialtyCount > 15 ? "intermediate" as const : "beginner" as const,
                    isNew,
                    isPopular
                  };
                }).map((featuredCase, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{featuredCase.title}</h4>
                      {featuredCase.isNew && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          NEW
                        </span>
                      )}
                      {featuredCase.isPopular && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          🔥
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{featuredCase.specialty}</span>
                      <span>{featuredCase.duration}</span>
                    </div>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${
                      featuredCase.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      featuredCase.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {featuredCase.difficulty}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specialty Selection */}
      {!isSpecialtyContext && step === 'specialty' && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading specialties...</p>
            </div>
          ) : specialties.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Specialties Available
              </h3>
              <p className="text-gray-600 mb-4">
                There are no specialties available for {selectedProgramArea} at the moment.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleRefreshSpecialties}
                  disabled={refreshing}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Specialties'}
                </button>
                <button
                  onClick={handleBackToPrograms}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Choose Different Program
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialties.map((specialty) => {
                const description = specialtyConfig[specialty] || 'Specialized medical cases in this field';
                const caseCount = specialtyCounts[specialty] || 0;
                
                return (
                  <div
                    key={specialty}
                    onClick={() => handleSpecialtySelect(specialty)}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {specialty}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {caseCount} specialt{caseCount !== 1 ? 'ies' : 'y'}
                        </span>
                        {caseCount > 0 && (
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        )}
                      </div>
                      <span className="text-sm text-blue-600 font-medium">
                        View Cases →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Access */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
        <div className="flex flex-wrap gap-3">
          {isSpecialtyContext && contextSpecialty ? (
            <>
              <button
                onClick={handleViewAllCases}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                View {contextSpecialty} Cases
              </button>
              <button
                onClick={() => navigate('/browse-cases')}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors text-sm"
              >
                Browse All Specialties
              </button>
              <button
                onClick={() => {
                  api.clearSpecialtyContext();
                  navigate('/simulation');
                }}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors text-sm"
              >
                All Cases (No Filter)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  // Check if there's a current specialty context
                  const context = api.getSpecialtyContext();
                  if (context) {
                    // Navigate with context awareness - will show all cases in the current specialty
                    navigate('/simulation');
                  } else {
                    // Clear any context and show truly all cases
                    api.clearSpecialtyContext();
                    navigate('/simulation');
                  }
                }}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors text-sm"
              >
                {(() => {
                  const context = api.getSpecialtyContext();
                  return context ? `All ${context.specialty} Cases` : 'Browse All Cases';
                })()}
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseBrowsingPage;