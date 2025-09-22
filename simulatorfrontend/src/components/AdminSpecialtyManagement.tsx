import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/apiService';
import { Button, Card, Badge, Loading, Alert } from '../components/ui';
import {
  SpecialtyConfig,
  getSpecialtyConfig,
  getAvailableSpecialties,
  getSpecialtyColor,
  getSpecialtyIcon
} from '../utils/specialtyConfig';

interface SpecialtyVisibility {
  specialtyId: string;
  isVisible: boolean;
  programArea: string;
  lastModified: Date;
  modifiedBy: string;
}

interface SpecialtyVisibilityResponse {
  specialties: SpecialtyVisibility[];
  total: number;
}

const AdminSpecialtyManagement: React.FC = () => {
  const [specialties, setSpecialties] = useState<SpecialtyConfig[]>([]);
  const [visibilitySettings, setVisibilitySettings] = useState<Record<string, SpecialtyVisibility>>({});

  // Program area options
  const programAreas = [
    { value: 'basic', label: 'Basic Program' },
    { value: 'specialty', label: 'Specialty Program' }
  ];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('all');

  // Program area options for filtering
  const programAreaOptions = [
    { value: 'all', label: 'All Programs' },
    { value: 'basic', label: 'Basic Program' },
    { value: 'specialty', label: 'Specialty Program' }
  ];

  const visibilityOptions = [
    { value: 'all', label: 'All Specialties' },
    { value: 'visible', label: 'Visible Only' },
    { value: 'hidden', label: 'Hidden Only' }
  ];

  useEffect(() => {
    loadSpecialtyData();
  }, []);

  const loadSpecialtyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all available specialties
      const allSpecialties = getAvailableSpecialties();
      setSpecialties(allSpecialties);

      // Load visibility settings from API
      const response: SpecialtyVisibilityResponse = await api.getSpecialtyVisibility();
      const visibilityMap: Record<string, SpecialtyVisibility> = {};

      response.specialties.forEach(setting => {
        visibilityMap[setting.specialtyId] = setting;
      });

      // Set default visibility for specialties not in the response
      allSpecialties.forEach(specialty => {
        if (!visibilityMap[specialty.id]) {
          visibilityMap[specialty.id] = {
            specialtyId: specialty.id,
            isVisible: true, // Default to visible
            programArea: 'basic', // Default to basic program for new specialties
            lastModified: new Date(),
            modifiedBy: 'system'
          };
        }
      });

      setVisibilitySettings(visibilityMap);
    } catch (error: any) {
      console.error('Error loading specialty data:', error);
      setError(`Failed to load specialty data: ${error.message || 'Unknown error'}`);

      // Fallback: create default visibility settings
      const allSpecialties = getAvailableSpecialties();
      const defaultVisibility: Record<string, SpecialtyVisibility> = {};

      allSpecialties.forEach(specialty => {
        defaultVisibility[specialty.id] = {
          specialtyId: specialty.id,
          isVisible: true,
          programArea: 'basic', // Default to basic program for error cases
          lastModified: new Date(),
          modifiedBy: 'system'
        };
      });

      setSpecialties(allSpecialties);
      setVisibilitySettings(defaultVisibility);
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityToggle = (specialtyId: string) => {
    setVisibilitySettings(prev => ({
      ...prev,
      [specialtyId]: {
        ...prev[specialtyId],
        isVisible: !prev[specialtyId].isVisible,
        lastModified: new Date()
      }
    }));
  };

  const handleProgramToggle = (specialtyId: string, programArea: string) => {
    setVisibilitySettings(prev => {
      const current = prev[specialtyId];

      return {
        ...prev,
        [specialtyId]: {
          ...current,
          programArea,
          lastModified: new Date()
        }
      };
    });
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const changes = Object.values(visibilitySettings).map(setting => ({
        specialtyId: setting.specialtyId,
        isVisible: setting.isVisible,
        programArea: setting.programArea
      }));

      await api.updateSpecialtyVisibility(changes);

      setSuccess('Specialty visibility settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving specialty visibility:', error);
      setError(`Failed to save changes: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all specialty visibility to defaults? This will restore the original settings.')) {
      const defaultVisibility: Record<string, SpecialtyVisibility> = {};

      specialties.forEach(specialty => {
        defaultVisibility[specialty.id] = {
          specialtyId: specialty.id,
          isVisible: true,
          programArea: 'basic', // Default to basic program for reset
          lastModified: new Date(),
          modifiedBy: 'admin'
        };
      });

      setVisibilitySettings(defaultVisibility);
    }
  };

  // Filter specialties based on search and filters
  const filteredSpecialties = useMemo(() => {
    return specialties.filter(specialty => {
      const visibility = visibilitySettings[specialty.id];

      // Search filter
      if (searchTerm) {
        const matchesSearch = specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              specialty.description.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
      }

      // Program filter
      if (filterProgram !== 'all') {
        const matchesProgram = visibility.programArea === filterProgram;
        if (!matchesProgram) return false;
      }

      // Visibility filter
      if (filterVisibility !== 'all') {
        const matchesVisibility = filterVisibility === 'visible' ? visibility.isVisible : !visibility.isVisible;
        if (!matchesVisibility) return false;
      }

      return true;
    });
  }, [specialties, visibilitySettings, searchTerm, filterProgram, filterVisibility]);

  const getSpecialtyStatusColor = (isVisible: boolean) => {
    return isVisible
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
  };

  const getSpecialtyStatusText = (isVisible: boolean) => {
    return isVisible ? 'Visible' : 'Hidden';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Specialty Visibility Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Control which specialties are visible to users and in which program areas</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={saving}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveChanges}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <span>💾</span>
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">Error</h3>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✅</span>
            </div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">Success</h3>
              <p className="text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        </Alert>
      )}

      {/* Filters */}
      <Card variant="elevated" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Specialties</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Program Area</label>
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {programAreas.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visibility Status</label>
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {visibilityOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Specialty List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Specialties ({filteredSpecialties.length})
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredSpecialties.length} of {specialties.length} specialties
          </div>
        </div>

        {filteredSpecialties.length === 0 ? (
          <Card variant="elevated" padding="lg" className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Specialties Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No specialties match your current filters. Try adjusting your search criteria.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSpecialties.map(specialty => {
              const visibility = visibilitySettings[specialty.id];
              const isVisible = visibility.isVisible;

              return (
                <Card key={specialty.id} variant="elevated" padding="md" className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Specialty Icon and Info */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${specialty.color}15` }}
                      >
                        {specialty.icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{specialty.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{specialty.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {specialty.caseCount} cases
                          </Badge>
                          <Badge
                            variant={isVisible ? "success" : "error"}
                            className="text-xs"
                          >
                            {getSpecialtyStatusText(isVisible)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          <strong>Phase:</strong> {specialty.phase}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          <strong>Difficulty:</strong> {specialty.difficulty}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          <strong>Duration:</strong> {specialty.estimatedDuration}
                        </span>
                      </div>

                      {/* Program Area Selection */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Program Area:
                        </label>
                        <div className="flex flex-wrap gap-4">
                          {programAreas.map(program => (
                            <label key={program.value} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`program-${specialty.id}`}
                                value={program.value}
                                checked={visibility.programArea === program.value}
                                onChange={(e) => handleProgramToggle(specialty.id, e.target.value)}
                                className="border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{program.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Visibility Toggle */}
                    <div className="flex-shrink-0">
                      <Button
                        variant={isVisible ? "danger" : "success"}
                        size="sm"
                        onClick={() => handleVisibilityToggle(specialty.id)}
                        className="whitespace-nowrap"
                      >
                        {isVisible ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <Card variant="elevated" padding="md" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Visibility Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800 dark:text-blue-200">Total Specialties:</span>
            <span className="ml-2 text-blue-700 dark:text-blue-300">{specialties.length}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800 dark:text-blue-200">Visible:</span>
            <span className="ml-2 text-blue-700 dark:text-blue-300">
              {Object.values(visibilitySettings).filter(s => s.isVisible).length}
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800 dark:text-blue-200">Hidden:</span>
            <span className="ml-2 text-blue-700 dark:text-blue-300">
              {Object.values(visibilitySettings).filter(s => !s.isVisible).length}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminSpecialtyManagement;