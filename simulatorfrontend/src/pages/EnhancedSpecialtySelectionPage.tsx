import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiService';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';
import SpecialtyCard from '../components/ui/SpecialtyCard';
import SpecialtyGrid from '../components/ui/SpecialtyGrid';
import SpecialtyCardSkeleton from '../components/ui/SpecialtyCardSkeleton';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  SpecialtyConfig,
  getSpecialtyConfig,
  getAvailableSpecialties
} from '../utils/specialtyConfig';

// Enhanced Program Area Card Component
const SimpleProgramCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  colorScheme: 'basic' | 'specialty';
  casesCount?: number;
  onClick: () => void;
}> = ({
  title,
  description,
  icon,
  colorScheme,
  casesCount,
  onClick
}) => {
  const colorSchemes = {
    basic: {
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50',
      border: 'border-blue-200/60',
      iconBg: 'bg-gradient-to-br from-blue-100 to-indigo-200',
      hover: 'hover:shadow-blue-200/50 hover:shadow-2xl hover:-translate-y-1',
      text: 'text-blue-700',
      accent: 'text-blue-600'
    },
    specialty: {
      gradient: 'from-purple-500 to-pink-600',
      bg: 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50',
      border: 'border-purple-200/60',
      iconBg: 'bg-gradient-to-br from-purple-100 to-pink-200',
      hover: 'hover:shadow-purple-200/50 hover:shadow-2xl hover:-translate-y-1',
      text: 'text-purple-700',
      accent: 'text-purple-600'
    }
  };

  const scheme = colorSchemes[colorScheme];

  return (
    <Card
      variant="elevated"
      padding="lg"
      hover={true}
      interactive={true}
      onClick={onClick}
      className={`group relative overflow-hidden transition-all duration-300 ${scheme.bg} ${scheme.border} ${scheme.hover} border-2 backdrop-blur-sm`}
    >
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${scheme.gradient} opacity-5 rounded-full transform translate-x-16 -translate-y-16`}></div>
      <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${scheme.gradient} opacity-5 rounded-full transform -translate-x-12 translate-y-12`}></div>

      <div className="relative">
        <div className="flex items-start gap-6">
          <div className={`w-16 h-16 ${scheme.iconBg} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <div className={`text-transparent bg-clip-text bg-gradient-to-br ${scheme.gradient}`}>
              {icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                {title}
              </h3>
              {colorScheme === 'specialty' && (
                <span className={`px-3 py-1 ${scheme.bg} ${scheme.text} text-xs font-semibold rounded-full border ${scheme.border}`}>
                  NEW
                </span>
              )}
            </div>
            <p className="text-gray-700 leading-relaxed mb-4 text-base">
              {description}
            </p>

            <div className="flex items-center justify-between">
              {typeof casesCount === 'number' && (
                <div className={`flex items-center gap-2 ${scheme.accent} font-semibold`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {casesCount} case{casesCount !== 1 ? 's' : ''} available
                </div>
              )}

              <div className={`text-2xl ${scheme.text} opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0`}>
                →
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};


const EnhancedSpecialtySelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    loading: specialtyLoading,
    navigateToSpecialty
  } = useSpecialtyContext();

  // State management
  const [step, setStep] = useState<'program' | 'specialty'>('program');
  const [selectedProgramArea, setSelectedProgramArea] = useState<string>('');
  const [specialtyVisibility, setSpecialtyVisibility] = useState<Record<string, { isVisible: boolean; programArea: string }>>({});

  // Program areas counts from backend
  const [programAreaCounts, setProgramAreaCounts] = useState<Record<string, number>>({});

  // Simple search state
  const [searchTerm, setSearchTerm] = useState('');

  // Dynamic program area configurations based on specialty visibility
  const programAreaConfig = useMemo(() => {
    const config: Record<string, any> = {};

    // Get ALL specialties from visibility data (not just those in static config)
    const basicSpecialtyIds = Object.entries(specialtyVisibility)
      .filter(([_, vis]) => vis.isVisible && vis.programArea === 'Basic Program')
      .map(([id]) => id);

    const specialtySpecialtyIds = Object.entries(specialtyVisibility)
      .filter(([_, vis]) => vis.isVisible && vis.programArea === 'Specialty Program')
      .map(([id]) => id);

    console.log('Basic specialties from visibility:', basicSpecialtyIds);
    console.log('Specialty specialties from visibility:', specialtySpecialtyIds);

    // Always show Basic Program card (even if there are zero visible specialties)
    config['Basic Program'] = {
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
        isPopular: true,
        specialties: basicSpecialtyIds,
        casesCount: programAreaCounts['Basic Program'] ?? 0
      };

    // Always show Specialty Program card
    config['Specialty Program'] = {
        description: 'Advanced cases in specialized medical fields requiring deeper clinical expertise and complex decision-making',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
        colorScheme: 'specialty' as const,
        difficulty: 'intermediate' as const,
        prerequisites: basicSpecialtyIds.length > 0 ? ['Basic Program'] : [],
        features: [
          'Advanced diagnostics',
          'Complex cases',
          'Specialized procedures',
          'Multi-system involvement'
        ],
        isNew: true,
        specialties: specialtySpecialtyIds,
        casesCount: programAreaCounts['Specialty Program'] ?? 0
      };

    return config;
  }, [specialtyVisibility, programAreaCounts]);

  // Get specialties for selected program area
  const programSpecialties = useMemo(() => {
    if (!selectedProgramArea) return [];

    const config = programAreaConfig[selectedProgramArea as keyof typeof programAreaConfig];
    if (!config) return [];

    // Map specialty IDs to configs, creating default configs for specialties not in static config
    return config.specialties.map((id: string) => {
      // Try to get from static config first
      const staticConfig = getSpecialtyConfig(id);
      if (staticConfig) return staticConfig;

      // Create a default config for backend specialties not in static config
      const displayName = id.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      return {
        id,
        name: displayName,
        description: `Specialized medical cases in ${displayName}`,
        color: '#6B7280',
        icon: '🏥',
        caseCount: 0,
        difficulty: 'intermediate' as const,
        estimatedDuration: '30-45 min',
        phase: 'current' as const,
        category: 'secondary' as const
      };
    }).filter(Boolean) as SpecialtyConfig[];
  }, [selectedProgramArea, programAreaConfig]);


  // Filter specialties based on search term
  const filteredSpecialties = useMemo(() => {
    if (!searchTerm) return programSpecialties;

    return programSpecialties.filter(specialty =>
      specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialty.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [programSpecialties, searchTerm]);

  // Load specialty visibility and program area counts
  useEffect(() => {
    loadSpecialtyVisibility();
    loadProgramAreasCounts();
  }, []);

  const loadProgramAreasCounts = async () => {
    try {
      const resp = await api.getAdminProgramAreasWithCounts();
      // Backend may return { data: { programAreas: [...] } } or { programAreas: [...] }
      const areas = resp?.data?.programAreas || resp?.programAreas || [];
      const counts: Record<string, number> = {};
      areas.forEach((pa: any) => {
        const name = pa.name || pa._id || pa.id;
        counts[name] = typeof pa.casesCount === 'number' ? pa.casesCount : (pa.caseCount || 0);
      });
      console.log('Program area counts loaded:', counts);
      setProgramAreaCounts(counts);
    } catch (error) {
      console.warn('Could not load program area counts', error);
      // Set fallback counts based on database knowledge
      setProgramAreaCounts({
        'Basic Program': 78,
        'Specialty Program': 33
      });
    }
  };


  const loadSpecialtyVisibility = async () => {
    try {
      const response = await api.getSpecialtyVisibility();
      console.log('Raw visibility response from backend:', response);
      const visibilityMap: Record<string, { isVisible: boolean; programArea: string }> = {};

      // Normalize program area from backend format to frontend format
      const normalizeProgramArea = (area: string) => {
        if (area === 'basic') return 'Basic Program';
        if (area === 'specialty') return 'Specialty Program';
        // If already in correct format, return as is
        if (area === 'Basic Program' || area === 'Specialty Program') return area;
        return area;
      };

      // Build lookup of frontend specialties by id and by normalized name
      const frontendSpecialties = getAvailableSpecialties();
      const frontendById: Record<string, any> = {};
      const frontendByNormalizedName: Record<string, any> = {};
      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '_');
      frontendSpecialties.forEach(s => {
        frontendById[s.id] = s;
        frontendByNormalizedName[normalize(s.name)] = s;
      });

      response.specialties.forEach((setting: any) => {
        const normalizedProgramArea = normalizeProgramArea(setting.programArea);
        
        console.log(`Processing specialty: ${setting.specialtyId}, visible: ${setting.isVisible}, programArea: ${setting.programArea} -> ${normalizedProgramArea}`);
        
        // Always map the raw backend specialtyId as a source of truth
        visibilityMap[setting.specialtyId] = {
          isVisible: setting.isVisible,
          programArea: normalizedProgramArea
        };

        // Also try to map the backend id to a frontend config id so the UI uses frontend IDs
        // backend id may already be a normalized name or may match frontend id
        const normalized = normalize(setting.specialtyId);
        if (frontendById[setting.specialtyId]) {
          visibilityMap[frontendById[setting.specialtyId].id] = {
            isVisible: setting.isVisible,
            programArea: normalizedProgramArea
          };
        } else if (frontendByNormalizedName[setting.specialtyId]) {
          visibilityMap[frontendByNormalizedName[setting.specialtyId].id] = {
            isVisible: setting.isVisible,
            programArea: normalizedProgramArea
          };
        } else if (frontendByNormalizedName[normalized]) {
          visibilityMap[frontendByNormalizedName[normalized].id] = {
            isVisible: setting.isVisible,
            programArea: normalizedProgramArea
          };
        }
      });

      // Set defaults for specialties not in the response
      getAvailableSpecialties().forEach(specialty => {
        if (!visibilityMap[specialty.id]) {
          // If the backend did not report this specialty, assume it is hidden by default
          // (backend is authoritative). Also warn so we can detect ID mismatches.
          console.warn(`Specialty visibility missing from backend response for id= ${specialty.id}; defaulting to hidden.`);
          visibilityMap[specialty.id] = {
            isVisible: false,
            programArea: 'Basic Program' // Default to Basic Program when unknown
          };
        }
      });

      console.log('Final visibility map:', visibilityMap);
      setSpecialtyVisibility(visibilityMap);
    } catch (error) {
      console.error('Error loading specialty visibility:', error);
      // Set default visibility for all specialties - don't override with phase-based logic
      const defaultVisibility: Record<string, { isVisible: boolean; programArea: string }> = {};
      getAvailableSpecialties().forEach(specialty => {
        defaultVisibility[specialty.id] = {
          isVisible: false,
          programArea: 'Basic Program' // Default to Basic Program for error cases
        };
      });
      setSpecialtyVisibility(defaultVisibility);
    }
  };


  const handleProgramAreaSelect = (programArea: string) => {
    setSelectedProgramArea(programArea);
    setStep('specialty');
  };

  const handleSpecialtyClick = (specialty: SpecialtyConfig) => {
    navigateToSpecialty(specialty.name);
  };


  const handleBackToPrograms = () => {
    setStep('program');
    setSelectedProgramArea('');
    setSearchTerm('');
  };



  const renderSpecialtyCard = (specialty: SpecialtyConfig) => {
    return (
      <SpecialtyCard
        key={specialty.id}
        specialty={specialty}
        onClick={() => handleSpecialtyClick(specialty)}
      />
    );
  };

  const renderLoadingSkeleton = () => (
    <SpecialtyGrid columns={{ mobile: 1, tablet: 2, desktop: 3, large: 4 }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <SpecialtyCardSkeleton key={index} />
      ))}
    </SpecialtyGrid>
  );


  if (specialtyLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {step === 'program' ? 'Choose Your Learning Path' : `${selectedProgramArea} Specialties`}
              </h1>
            </div>
          </div>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            {step === 'program'
              ? 'Embark on your medical education journey with our comprehensive simulation platform'
              : `Explore specialized cases and advance your expertise in ${selectedProgramArea}`
            }
          </p>
        </div>

        {/* Program Area Selection */}
        {step === 'program' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
              {Object.entries(programAreaConfig).map(([programKey, config]) => (
                <SimpleProgramCard
                  key={programKey}
                  title={programKey}
                  description={config.description}
                  icon={config.icon}
                  colorScheme={config.colorScheme}
                  casesCount={config.casesCount}
                  onClick={() => handleProgramAreaSelect(programKey)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Specialty Selection */}
        {step === 'specialty' && (
          <div className="space-y-8">
            {/* Enhanced Back Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBackToPrograms}
                className="flex items-center gap-2 hover:bg-white/80 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Programs
              </Button>
              <div className="text-sm text-gray-500 bg-white/60 px-3 py-1 rounded-full">
                {programSpecialties.length} specialt{programSpecialties.length !== 1 ? 'ies' : 'y'} available
              </div>
            </div>

            {specialtyLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                </div>
                <p className="text-gray-600 mt-6 text-lg">Loading specialties...</p>
              </div>
            ) : programSpecialties.length === 0 ? (
              <Card variant="elevated" padding="lg" className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Specialties Available
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  There are no specialties available for {selectedProgramArea} at the moment.
                </p>
                <Button variant="primary" onClick={handleBackToPrograms} className="px-8">
                  Choose Different Program
                </Button>
              </Card>
            ) : (
              <div className="max-w-6xl mx-auto">
                {/* Enhanced Search */}
                <div className="relative mb-8">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search specialties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-14 pr-4 py-4 text-lg border-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all duration-200"
                  />
                </div>

                {/* Specialty Grid */}
                {filteredSpecialties.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Specialties Found</h3>
                    <p className="text-gray-600 text-lg">Try adjusting your search terms or browse all specialties.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {filteredSpecialties.map(renderSpecialtyCard)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Navigation */}
        <div className="mt-16 text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="bg-white/60 hover:bg-white/80 backdrop-blur-sm border-2 border-white/40 px-8 py-3 text-gray-700 hover:text-gray-900 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSpecialtySelectionPage;