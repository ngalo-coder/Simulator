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

// Simplified Program Area Card Component
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
  const colorClasses = {
    basic: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
    specialty: 'border-purple-200 bg-purple-50 hover:bg-purple-100'
  };

  return (
    <Card
      variant="elevated"
      padding="lg"
      hover={true}
      interactive={true}
      onClick={onClick}
      className={`transition-all duration-200 ${colorClasses[colorScheme]}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
          colorScheme === 'basic' ? 'bg-blue-200' : 'bg-purple-200'
        }`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-2">{description}</p>
          {typeof casesCount === 'number' && (
            <div className="text-xs text-gray-500">{casesCount} cases available</div>
          )}
        </div>
        <div className="text-2xl">→</div>
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

    // Basic Program - includes specialties visible in basic program
    const basicSpecialties = getAvailableSpecialties().filter(specialty => {
      const visibility = specialtyVisibility[specialty.id];
      return visibility?.isVisible && visibility?.programArea === 'basic';
    });

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
        specialties: basicSpecialties.map(s => s.id),
        casesCount: programAreaCounts['Basic Program'] ?? basicSpecialties.reduce((acc, s) => acc + (s.caseCount || 0), 0)
      };

    // Specialty Program - includes specialties visible in specialty program
    const specialtySpecialties = getAvailableSpecialties().filter(specialty => {
      const visibility = specialtyVisibility[specialty.id];
      return visibility?.isVisible && visibility?.programArea === 'specialty';
    });

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
        prerequisites: basicSpecialties.length > 0 ? ['Basic Program'] : [],
        features: [
          'Advanced diagnostics',
          'Complex cases',
          'Specialized procedures',
          'Multi-system involvement'
        ],
        isNew: true,
        specialties: specialtySpecialties.map(s => s.id),
        casesCount: programAreaCounts['Specialty Program'] ?? specialtySpecialties.reduce((acc, s) => acc + (s.caseCount || 0), 0)
      };

    return config;
  }, [specialtyVisibility]);

  // Get specialties for selected program area
  const programSpecialties = useMemo(() => {
    if (!selectedProgramArea) return [];

    const config = programAreaConfig[selectedProgramArea as keyof typeof programAreaConfig];
    if (!config) return [];

    return config.specialties.map((id: string) => getSpecialtyConfig(id)).filter(Boolean) as SpecialtyConfig[];
  }, [selectedProgramArea]);


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
      setProgramAreaCounts(counts);
    } catch (error) {
      console.warn('Could not load program area counts', error);
    }
  };


  const loadSpecialtyVisibility = async () => {
    try {
      const response = await api.getSpecialtyVisibility();
      const visibilityMap: Record<string, { isVisible: boolean; programArea: string }> = {};

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
        // Always map the raw backend specialtyId as a source of truth
        visibilityMap[setting.specialtyId] = {
          isVisible: setting.isVisible,
          programArea: setting.programArea
        };

        // Also try to map the backend id to a frontend config id so the UI uses frontend IDs
        // backend id may already be a normalized name or may match frontend id
        const normalized = normalize(setting.specialtyId);
        if (frontendById[setting.specialtyId]) {
          visibilityMap[frontendById[setting.specialtyId].id] = {
            isVisible: setting.isVisible,
            programArea: setting.programArea
          };
        } else if (frontendByNormalizedName[setting.specialtyId]) {
          visibilityMap[frontendByNormalizedName[setting.specialtyId].id] = {
            isVisible: setting.isVisible,
            programArea: setting.programArea
          };
        } else if (frontendByNormalizedName[normalized]) {
          visibilityMap[frontendByNormalizedName[normalized].id] = {
            isVisible: setting.isVisible,
            programArea: setting.programArea
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
            programArea: 'basic' // Default to basic program when unknown
          };
        }
      });

      setSpecialtyVisibility(visibilityMap);
    } catch (error) {
      console.error('Error loading specialty visibility:', error);
      // Set default visibility for all specialties - don't override with phase-based logic
      const defaultVisibility: Record<string, { isVisible: boolean; programArea: string }> = {};
      getAvailableSpecialties().forEach(specialty => {
        defaultVisibility[specialty.id] = {
          isVisible: false,
          programArea: 'basic' // Default to basic program for error cases
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Simple Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {step === 'program' ? 'Choose Your Learning Path' : `Choose Specialty`}
        </h1>
        <p className="text-gray-600">
          {step === 'program'
            ? 'Select a program to start your medical training'
            : `Select a specialty within ${selectedProgramArea}`
          }
        </p>
      </div>

      {/* Program Area Selection */}
      {step === 'program' && (
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div>
          {specialtyLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading specialties...</p>
            </div>
          ) : programSpecialties.length === 0 ? (
            <Card variant="elevated" padding="lg" className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Specialties Available
              </h3>
              <p className="text-gray-600 mb-4">
                There are no specialties available for {selectedProgramArea} at the moment.
              </p>
              <Button variant="primary" onClick={handleBackToPrograms}>
                Choose Different Program
              </Button>
            </Card>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Simple Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search specialties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Specialty Grid */}
              {filteredSpecialties.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Specialties Found</h3>
                  <p className="text-gray-600">Try adjusting your search terms.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSpecialties.map(renderSpecialtyCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Simple Navigation */}
      <div className="mt-8 text-center">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default EnhancedSpecialtySelectionPage;