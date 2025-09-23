import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiService';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';
import SpecialtyCard from '../components/ui/SpecialtyCard';
import SpecialtyGrid from '../components/ui/SpecialtyGrid';
import SpecialtyCardSkeleton from '../components/ui/SpecialtyCardSkeleton';
import SpecialtySearchAndFilter from '../components/ui/SpecialtySearchAndFilter';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  SpecialtyConfig,
  getSpecialtyConfig,
  getAvailableSpecialties,
  getDifficultyLabel
} from '../utils/specialtyConfig';

// Enhanced Program Area Card Component
const EnhancedProgramCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  colorScheme: 'basic' | 'specialty';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  features: string[];
  isPopular?: boolean;
  isNew?: boolean;
  onClick: () => void;
}> = ({
  title,
  description,
  icon,
  colorScheme,
  difficulty,
  prerequisites,
  features,
  isPopular,
  isNew,
  onClick
}) => {
  const colorClasses = {
    basic: 'border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50',
    specialty: 'border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50'
  };

  return (
    <Card
      variant="elevated"
      padding="lg"
      hover={true}
      interactive={true}
      onClick={onClick}
      className={`relative overflow-hidden transition-all duration-300 ${colorClasses[colorScheme]}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-lg ${
            colorScheme === 'basic' ? 'bg-blue-100' : 'bg-purple-100'
          }`}>
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {difficulty}
              </Badge>
              {isPopular && (
                <Badge variant="info" className="text-xs">Popular</Badge>
              )}
              {isNew && (
                <Badge variant="success" className="text-xs">New</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4 leading-relaxed">{description}</p>

      {/* Features */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Features:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Prerequisites:</strong> {prerequisites.join(', ')}
          </p>
        </div>
      )}

      {/* Action Button */}
      <Button
        variant="primary"
        className="w-full mt-4"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        Explore {title} →
      </Button>
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
    error: specialtyError,
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

  // Filter states (only used in specialty step)
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');

  // Dynamic program area configurations based on specialty visibility
  const programAreaConfig = useMemo(() => {
    const config: Record<string, any> = {};

    // Basic Program - includes specialties visible in basic program
    const basicSpecialties = getAvailableSpecialties().filter(specialty => {
      const visibility = specialtyVisibility[specialty.id];
      return visibility?.isVisible && visibility?.programArea === 'basic';
    });

    if (basicSpecialties.length > 0) {
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
        specialties: basicSpecialties.map(s => s.id)
      };
    }

    // Specialty Program - includes specialties visible in specialty program
    const specialtySpecialties = getAvailableSpecialties().filter(specialty => {
      const visibility = specialtyVisibility[specialty.id];
      return visibility?.isVisible && visibility?.programArea === 'specialty';
    });

    if (specialtySpecialties.length > 0) {
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
        specialties: specialtySpecialties.map(s => s.id)
      };
    }

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

  // Filter specialties based on current filters
  const filteredSpecialties = useMemo(() => {
    return programSpecialties.filter(specialty => {
      // Search filter
      if (searchTerm) {
        const matchesSearch = specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             specialty.description.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
      }

      // Difficulty filter
      if (difficultyFilter && specialty.difficulty !== difficultyFilter) {
        return false;
      }

      // Duration filter
      if (durationFilter && specialty.estimatedDuration !== durationFilter) {
        return false;
      }

      // Phase filter
      if (phaseFilter && specialty.phase !== phaseFilter) {
        return false;
      }

      return true;
    });
  }, [programSpecialties, searchTerm, difficultyFilter, durationFilter, phaseFilter]);

  // Load user progress data and specialty visibility
  useEffect(() => {
    loadUserProgress();
    loadSpecialtyVisibility();
  }, []);

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

      response.specialties.forEach((setting: any) => {
        visibilityMap[setting.specialtyId] = {
          isVisible: setting.isVisible,
          programArea: setting.programArea
        };
      });

      // Set defaults for specialties not in the response
      getAvailableSpecialties().forEach(specialty => {
        if (!visibilityMap[specialty.id]) {
          // Only set defaults for specialties that are truly missing from the database
          // Don't override existing database data with phase-based defaults
          visibilityMap[specialty.id] = {
            isVisible: true,
            programArea: 'basic' // Default to basic program for new specialties
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
          isVisible: true,
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
    setDifficultyFilter('');
    setDurationFilter('');
    setPhaseFilter('');
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
    const progress = userProgress[specialty.id];

    let variant: 'default' | 'compact' | 'featured' = 'default';
    if (specialty.phase === 'current') {
      variant = 'featured';
    } else if (filteredSpecialties.length > 6) {
      variant = 'compact';
    }

    return (
      <SpecialtyCard
        key={specialty.id}
        specialty={specialty}
        userProgress={progress}
        variant={variant}
        showProgress={true}
        showRecommendations={true}
        onClick={() => handleSpecialtyClick(specialty)}
        onContinue={() => handleContinueLearning(specialty)}
        onViewCases={() => handleViewCases(specialty)}
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
        setDifficultyFilter('');
        setDurationFilter('');
        setPhaseFilter('');
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 'program' ? 'Choose Program Area' : `Choose Specialty - ${selectedProgramArea}`}
            </h1>
            <p className="text-gray-600">
              {step === 'program'
                ? 'Select a program area to explore available medical cases'
                : `Select a specialty within ${selectedProgramArea}`
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </Button>

            {step === 'specialty' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToPrograms}
                className="flex items-center space-x-2"
              >
                <span>←</span>
                <span>Back to Programs</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
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
        </nav>
      </div>

      {/* Program Area Selection */}
      {step === 'program' && (
        <div className="space-y-6">
          {/* Program Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(programAreaConfig).map(([programKey, config]) => (
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

          {/* Featured Specialties Preview */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Featured Specialties This Week
              </h3>
              <p className="text-gray-600">
                Popular specialties and new additions to help you advance your skills
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getAvailableSpecialties()
                .filter(specialty => {
                  const visibility = specialtyVisibility[specialty.id];
                  return visibility?.isVisible && (visibility?.programArea === 'basic' || visibility?.programArea === 'specialty');
                })
                .slice(0, 3)
                .map((specialty, index) => {
                  const progress = userProgress[specialty.id];
                  const isNew = index === 0;
                  const isPopular = specialty.caseCount > 25;

                  return (
                    <div
                      key={specialty.id}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        // Find which program contains this specialty
                        const programWithSpecialty = Object.entries(programAreaConfig)
                          .find(([_, config]) => config.specialties.includes(specialty.id));

                        if (programWithSpecialty) {
                          handleProgramAreaSelect(programWithSpecialty[0]);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${specialty.color}15` }}
                          >
                            {specialty.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{specialty.name}</h4>
                            <p className="text-sm text-gray-600">{specialty.caseCount} cases</p>
                          </div>
                        </div>
                        {isNew && (
                          <Badge variant="info" className="text-xs">NEW</Badge>
                        )}
                        {isPopular && (
                          <Badge variant="warning" className="text-xs">🔥</Badge>
                        )}
                      </div>
                      {progress && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress.completionRate)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all duration-300"
                              style={{
                                width: `${progress.completionRate}%`,
                                backgroundColor: specialty.color
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
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
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar with Filters */}
              <div className="lg:w-80 flex-shrink-0">
                <SpecialtySearchAndFilter
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  difficultyFilter={difficultyFilter}
                  onDifficultyChange={setDifficultyFilter}
                  durationFilter={durationFilter}
                  onDurationChange={setDurationFilter}
                  specialtyFilter=""
                  onSpecialtyChange={() => {}}
                  phaseFilter={phaseFilter}
                  onPhaseChange={setPhaseFilter}
                  difficultyOptions={difficultyOptions}
                  durationOptions={durationOptions}
                  specialtyOptions={[]}
                  phaseOptions={phaseOptions}
                  resultsCount={filteredSpecialties.length}
                  totalCount={programSpecialties.length}
                />
              </div>

              {/* Main Content Area */}
              <div className="flex-1">
                {/* Active Filters */}
                {(searchTerm || difficultyFilter || durationFilter || phaseFilter) && (
                  <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-600">Active filters:</span>
                      {searchTerm && (
                        <Badge variant="info" className="cursor-pointer" onClick={() => setSearchTerm('')}>
                          Search: "{searchTerm}" ×
                        </Badge>
                      )}
                      {difficultyFilter && (
                        <Badge variant="info" className="cursor-pointer" onClick={() => setDifficultyFilter('')}>
                          {getDifficultyLabel(difficultyFilter as any)} ×
                        </Badge>
                      )}
                      {durationFilter && (
                        <Badge variant="info" className="cursor-pointer" onClick={() => setDurationFilter('')}>
                          {durationFilter} ×
                        </Badge>
                      )}
                      {phaseFilter && (
                        <Badge variant="info" className="cursor-pointer" onClick={() => setPhaseFilter('')}>
                          {phaseFilter} ×
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Specialty Grid */}
                {filteredSpecialties.length === 0 ? (
                  renderEmptyState()
                ) : (
                  <SpecialtyGrid
                    columns={{
                      mobile: 1,
                      tablet: filteredSpecialties.length > 4 ? 2 : 1,
                      desktop: filteredSpecialties.length > 6 ? 3 : 2,
                      large: filteredSpecialties.length > 8 ? 4 : 3
                    }}
                    gap="md"
                  >
                    {filteredSpecialties.map(renderSpecialtyCard)}
                  </SpecialtyGrid>
                )}

                {/* Load More / Pagination could go here */}
                {filteredSpecialties.length > 0 && filteredSpecialties.length < programSpecialties.length && (
                  <div className="mt-8 text-center">
                    <p className="text-gray-600">
                      Showing {filteredSpecialties.length} of {programSpecialties.length} specialties
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Access Section */}
      <div className="mt-12">
        <Card variant="elevated" padding="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/simulation')}
            >
              <span className="mr-2">📚</span>
              Browse All Cases
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/dashboard')}
            >
              <span className="mr-2">🏠</span>
              Back to Dashboard
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                const inProgress = Object.entries(userProgress)
                  .filter(([_, progress]) => progress.isInProgress)
                  .map(([id]) => getSpecialtyConfig(id))
                  .filter(Boolean);

                if (inProgress.length > 0) {
                  handleSpecialtyClick(inProgress[0]!);
                }
              }}
            >
              <span className="mr-2">▶️</span>
              Continue Learning
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <span className="mr-2">🔄</span>
              {refreshing ? 'Syncing...' : 'Sync Progress'}
            </Button>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Click "Sync Progress" if you notice your completion status isn't updating after working on cases.
              Progress is automatically calculated based on your case completion status.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedSpecialtySelectionPage;