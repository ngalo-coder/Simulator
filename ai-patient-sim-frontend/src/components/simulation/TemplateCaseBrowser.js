// ai-patient-sim-frontend/src/components/simulation/TemplateCaseBrowser.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Play, 
  MapPin, 
  User, 
  Stethoscope,
  BookOpen,
  ChevronDown,
  X
} from 'lucide-react';
import simulationAPI from '../../utils/simulationApi';
import toast from 'react-hot-toast';

const TemplateCaseBrowser = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    specialty: '',
    difficulty: '',
    programArea: '',
    location: '',
    tags: []
  });

  useEffect(() => {
    loadTemplateCases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cases, searchTerm, activeFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTemplateCases = async () => {
    try {
      setLoading(true);
      const response = await simulationAPI.getTemplateCases();
      
      if (response.success) {
        setCases(response.cases);
        setFilterOptions(response.filterOptions);
      } else {
        toast.error('Failed to load template cases');
      }
    } catch (error) {
      console.error('Error loading template cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cases];

    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(case_ => 
        case_.title.toLowerCase().includes(searchLower) ||
        case_.specialty.toLowerCase().includes(searchLower) ||
        case_.patientInfo.chiefComplaint.toLowerCase().includes(searchLower) ||
        case_.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply filters
    if (activeFilters.specialty) {
      filtered = filtered.filter(case_ => case_.specialty === activeFilters.specialty);
    }

    if (activeFilters.difficulty) {
      filtered = filtered.filter(case_ => case_.difficulty === activeFilters.difficulty);
    }

    if (activeFilters.programArea) {
      filtered = filtered.filter(case_ => case_.programArea === activeFilters.programArea);
    }

    if (activeFilters.location) {
      filtered = filtered.filter(case_ => case_.location === activeFilters.location);
    }

    if (activeFilters.tags.length > 0) {
      filtered = filtered.filter(case_ => 
        activeFilters.tags.some(tag => case_.tags.includes(tag))
      );
    }

    setFilteredCases(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleTagToggle = (tag) => {
    setActiveFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      specialty: '',
      difficulty: '',
      programArea: '',
      location: '',
      tags: []
    });
    setSearchTerm('');
  };

  const startSimulation = async (caseId) => {
    try {
      const response = await simulationAPI.startTemplateSimulation(caseId);
      
      if (response.success) {
        toast.success('Simulation started successfully!');
        navigate(`/template-simulation/${response.simulation.id}`);
      } else {
        toast.error(response.error || 'Failed to start simulation');
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
      toast.error('Failed to start simulation');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpecialtyIcon = (specialty) => {
    switch (specialty.toLowerCase()) {
      case 'pediatrics': return '👶';
      case 'internal medicine': return '🏥';
      case 'cardiology': return '❤️';
      case 'emergency medicine': return '🚨';
      default: return '🩺';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading template cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Template Cases</h1>
              <p className="text-gray-600 mt-1">
                Choose from {filteredCases.length} available clinical scenarios
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search cases by title, specialty, or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {(searchTerm || Object.values(activeFilters).some(v => v && (Array.isArray(v) ? v.length > 0 : true))) && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Specialty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialty
                  </label>
                  <select
                    value={activeFilters.specialty}
                    onChange={(e) => handleFilterChange('specialty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Specialties</option>
                    {filterOptions.specialties?.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={activeFilters.difficulty}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Levels</option>
                    {filterOptions.difficulties?.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>

                {/* Program Area Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program Area
                  </label>
                  <select
                    value={activeFilters.programArea}
                    onChange={(e) => handleFilterChange('programArea', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Programs</option>
                    {filterOptions.programAreas?.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    value={activeFilters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    {filterOptions.locations?.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags Filter */}
              {filterOptions.tags && filterOptions.tags.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          activeFilters.tags.includes(tag)
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map(case_ => (
            <div key={case_.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Case Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getSpecialtyIcon(case_.specialty)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                        {case_.title}
                      </h3>
                      <p className="text-sm text-gray-600">{case_.specialty}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(case_.difficulty)}`}>
                    {case_.difficulty}
                  </span>
                </div>

                {/* Patient Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {case_.patientInfo.name}, {case_.patientInfo.age} years old
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    "{case_.patientInfo.chiefComplaint}"
                  </p>
                </div>

                {/* Case Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{case_.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>{case_.programArea}</span>
                  </div>
                </div>

                {/* Tags */}
                {case_.tags && case_.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {case_.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {case_.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                        +{case_.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Case Actions */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => startSimulation(case_.id)}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Simulation</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find more cases.
            </p>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateCaseBrowser;