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
  getAvailableSpecialties,
  getDifficultyLabel
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

interface UserProgress {
  completedCases: number;
  totalCases: number;
  completionRate: number;
  lastAccessed?: Date;
  isInProgress?: boolean;
}

const EnhancedSpecialtySelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    loading: specialtyLoading,
    navigateToSpecialty,
    forceRefreshSpecialties
  } = useSpecialtyContext();

  // State management
  const [step, setStep] = useState<'program' | 'specialty'>('program');
  const [selectedProgramArea, setSelectedProgramArea] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
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

  // Filter options for specialty step
  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner', count: programSpecialties.filter(s => s.difficulty === 'beginner').length },
    { value: 'intermediate', label: 'Intermediate', count: programSpecialties.filter(s => s.difficulty === 'intermediate').length },
    { value: 'advanced', label: 'Advanced', count: programSpecialties.filter(s => s.difficulty === 'advanced').length }
  ];

  const durationOptions = [
    { value: '20-30 min', label: '20-30 minutes', count: programSpecialties.filter(s => s.estimatedDuration === '20-30 min').length },
    { value: '30-45 min', label: '30-45 minutes', count: programSpecialties.filter(s => s.estimatedDuration === '30-45 min').length },
    { value: '45-60 min', label: '45-60 minutes', count: programSpecialties.filter(s => s.estimatedDuration === '45-60 min').length },
    { value: '60+ min', label: '60+ minutes', count: programSpecialties.filter(s => s.estimatedDuration === '60+ min').length }
  ];

  const phaseOptions = [
    { value: 'current', label: 'Available Now', count: programSpecialties.filter(s => s.phase === 'current').length },
    { value: 'phase1', label: 'Phase 1', count: programSpecialties.filter(s => s.phase === 'phase1').length },
    { value: 'phase2', label: 'Phase 2', count: programSpecialties.filter(s => s.phase === 'phase2').length }
  ];

  // Filter specialties based on search term
  const filteredSpecialties = useMemo(() => {
    if (!searchTerm) return programSpecialties;

    return programSpecialties.filter(specialty =>
      specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialty.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [programSpecialties, searchTerm]);

  // Load user progress data and specialty visibility
  useEffect(() => {
    loadUserProgress();
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

  const loadUserProgress = async () => {
    try {
      setLoading(true);
      // In real app, this would fetch from API
      // For now, we'll create more realistic progress data
      const mockProgress: Record<string, UserProgress> = {};

      getAvailableSpecialties().forEach(specialty => {
        // Create more realistic progress based on specialty
        let baseProgress = 0;
        switch (specialty.id) {
          case 'internal_medicine':
            baseProgress = 65; // Most progress in Internal Medicine
            break;
          case 'gastroenterology':
            baseProgress = 30; // Some progress in GI
            break;
          case 'ophthalmology':
            baseProgress = 15; // Less progress in Ophthalmology
            break;
          default:
            baseProgress = Math.floor(Math.random() * 40); // Random for others
        }

        // Add some randomization but keep it realistic
        const progress = Math.max(0, Math.min(100, baseProgress + (Math.random() - 0.5) * 20));

        mockProgress[specialty.id] = {
          completedCases: Math.floor((progress / 100) * specialty.caseCount),
          totalCases: specialty.caseCount,
          completionRate: progress,
          lastAccessed: progress > 0 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
          isInProgress: progress > 0 && progress < 100
        };
      });

      setUserProgress(mockProgress);
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      setLoading(false);
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

  // Function to refresh progress for a specific specialty
  const refreshSpecialtyProgress = async (specialtyId: string) => {
    try {
      // In real app, this would fetch updated progress from API
      const specialty = getSpecialtyConfig(specialtyId);
      if (!specialty) return;

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update progress for this specialty
      setUserProgress(prev => {
        const currentProgress = prev[specialtyId];
        if (!currentProgress) return prev;

        // Simulate slight progress change (in real app, this would be actual data)
        const progressChange = (Math.random() - 0.5) * 10;
        const newProgress = Math.max(0, Math.min(100, currentProgress.completionRate + progressChange));

        return {
          ...prev,
          [specialtyId]: {
            ...currentProgress,
            completedCases: Math.floor((newProgress / 100) * specialty.caseCount),
            completionRate: newProgress,
            lastAccessed: new Date(),
            isInProgress: newProgress > 0 && newProgress < 100
          }
        };
      });
    } catch (error) {
      console.error('Error refreshing specialty progress:', error);
    }
  };

  // Function to update progress when case status changes
  const updateProgressFromCaseStatus = (specialtyId: string, caseCompleted: boolean) => {
    setUserProgress(prev => {
      const specialty = getSpecialtyConfig(specialtyId);
      if (!specialty || !prev[specialtyId]) return prev;

      const currentProgress = prev[specialtyId];
      const totalCases = specialty.caseCount;

      // Calculate new completion rate based on case status change
      let newCompletedCases = currentProgress.completedCases;
      if (caseCompleted) {
        newCompletedCases = Math.min(totalCases, newCompletedCases + 1);
      } else {
        newCompletedCases = Math.max(0, newCompletedCases - 1);
      }

      const newCompletionRate = (newCompletedCases / totalCases) * 100;

      return {
        ...prev,
        [specialtyId]: {
          ...currentProgress,
          completedCases: newCompletedCases,
          completionRate: newCompletionRate,
          lastAccessed: new Date(),
          isInProgress: newCompletionRate > 0 && newCompletionRate < 100
        }
      };
    });
  };

  const handleProgramAreaSelect = (programArea: string) => {
    setSelectedProgramArea(programArea);
    setStep('specialty');
  };

  const handleSpecialtyClick = (specialty: SpecialtyConfig) => {
    navigateToSpecialty(specialty.name);
  };

  const handleContinueLearning = (specialty: SpecialtyConfig) => {
    // Navigate to continue the specific specialty
    navigateToSpecialty(specialty.name);
  };

  const handleViewCases = (specialty: SpecialtyConfig) => {
    // Navigate to view all cases in the specialty
    navigateToSpecialty(specialty.name);
  };

  const handleBackToPrograms = () => {
    setStep('program');
    setSelectedProgramArea('');
    setSearchTerm('');
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await forceRefreshSpecialties();
      await loadUserProgress();
      await loadSpecialtyVisibility();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Expose functions for external use (when case status changes)
  React.useEffect(() => {
    // Make functions available globally for debugging/testing
    (window as any).refreshSpecialtyProgress = refreshSpecialtyProgress;
    (window as any).updateProgressFromCaseStatus = updateProgressFromCaseStatus;
    (window as any).loadUserProgress = loadUserProgress;

    return () => {
      delete (window as any).refreshSpecialtyProgress;
      delete (window as any).updateProgressFromCaseStatus;
      delete (window as any).loadUserProgress;
    };
  }, []);

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

  const renderEmptyState = () => (
    <Card variant="elevated" padding="lg" className="text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No Specialties Found
      </h3>
      <p className="text-gray-600 mb-4">
        No specialties match your current filters. Try adjusting your search criteria.
      </p>
      <Button variant="primary" onClick={() => {
        setSearchTerm('');
      }}>
        Clear Filters
      </Button>
    </Card>
  );

  if (loading || specialtyLoading) {
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
          {loading ? (
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