// ai-patient-sim-frontend/src/components/simulation/CaseSelection.js - FIXED
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulationAPI } from '../../utils/simulationApi';
import { 
  Heart, 
  Baby, 
  Brain, 
  Stethoscope, 
  Users, 
  Activity,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const PROGRAM_ICONS = {
  'internal_medicine': Heart,
  'pediatrics': Baby,
  'psychiatry': Brain,
  'emergency_medicine': Activity,
  'family_medicine': Users,
  'surgery': Stethoscope
};

const DIFFICULTY_COLORS = {
  'Easy': 'bg-green-100 text-green-800',
  'Intermediate': 'bg-yellow-100 text-yellow-800',
  'Hard': 'bg-red-100 text-red-800',
  'student': 'bg-green-100 text-green-800',
  'resident': 'bg-blue-100 text-blue-800',
  'fellow': 'bg-purple-100 text-purple-800'
};

const CaseSelection = () => {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    programAreas: [],
    specialties: [],
    difficulties: []
  });
  const [filters, setFilters] = useState({
    programArea: '',
    specialty: '',
    difficulty: '',
    patientType: '',
    search: ''
  });
  const [startingSimulation, setStartingSimulation] = useState(null);
  
  const navigate = useNavigate();

  const applyFilters = useCallback(() => {
    let filtered = [...cases];

    if (filters.programArea) {
      filtered = filtered.filter(case_ => case_.programArea === filters.programArea);
    }

    if (filters.specialty) {
      filtered = filtered.filter(case_ => case_.specialty === filters.specialty);
    }

    if (filters.difficulty) {
      filtered = filtered.filter(case_ => case_.difficulty === filters.difficulty);
    }

    if (filters.patientType) {
      // Map template case structure to patient type
      filtered = filtered.filter(case_ => {
        if (filters.patientType === 'adult') {
          return !case_.hasGuardian;
        } else if (filters.patientType === 'pediatric_with_guardian') {
          return case_.hasGuardian;
        }
        return true;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(case_ => 
        case_.title?.toLowerCase().includes(searchLower) ||
        case_.patientInfo?.name?.toLowerCase().includes(searchLower) ||
        case_.patientInfo?.chiefComplaint?.toLowerCase().includes(searchLower) ||
        case_.specialty?.toLowerCase().includes(searchLower) ||
        case_.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCases(filtered);
  }, [cases, filters]);

  const fetchCases = useCallback(async () => {
    try {
      const response = await simulationAPI.getTemplateCases();
      const casesData = response.cases || [];
      setCases(casesData);

      // Extract unique filter options from the cases
      const programAreas = [...new Set(casesData.map(case_ => case_.programArea))].filter(Boolean).sort();
      const specialties = [...new Set(casesData.map(case_ => case_.specialty))].filter(Boolean).sort();
      const difficulties = [...new Set(casesData.map(case_ => case_.difficulty))].filter(Boolean).sort();

      setFilterOptions({
        programAreas,
        specialties,
        difficulties
      });

    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleStartSimulation = async (caseId) => {
    setStartingSimulation(caseId);
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
      toast.error(error.response?.data?.error || 'Failed to start simulation');
    } finally {
      setStartingSimulation(null);
    }
  };



  const getProgramAreaDisplay = (programArea) => {
    // Handle template case program areas
    if (programArea === 'Basic Program') return 'Basic Program';
    if (programArea === 'Specialty Program') return 'Specialty Program';
    
    const areas = {
      'internal_medicine': 'Internal Medicine',
      'pediatrics': 'Pediatrics',
      'psychiatry': 'Psychiatry',
      'emergency_medicine': 'Emergency Medicine',
      'family_medicine': 'Family Medicine',
      'surgery': 'Surgery',
      'obstetrics_gynecology': 'OB/GYN',
      'cardiology_fellowship': 'Cardiology'
    };
    return areas[programArea] || programArea;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medical Case Simulations</h1>
          <p className="mt-2 text-gray-600">
            Practice with AI patients in realistic clinical scenarios
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Filter Cases</h3>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredCases.length} of {cases.length} cases
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cases..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            {/* Program Area */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.programArea}
              onChange={(e) => setFilters({ ...filters, programArea: e.target.value })}
            >
              <option value="">All Programs</option>
              {filterOptions.programAreas.map(programArea => (
                <option key={programArea} value={programArea}>
                  {getProgramAreaDisplay(programArea)}
                </option>
              ))}
            </select>

            {/* Specialty */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.specialty}
              onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
            >
              <option value="">All Specialties</option>
              {filterOptions.specialties.map(specialty => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>

            {/* Difficulty */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            >
              <option value="">All Levels</option>
              {filterOptions.difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>

            {/* Patient Type */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.patientType}
              onChange={(e) => setFilters({ ...filters, patientType: e.target.value })}
            >
              <option value="">All Patient Types</option>
              <option value="adult">Adult Patient</option>
              <option value="pediatric_with_guardian">Pediatric + Guardian</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(filters.programArea || filters.specialty || filters.difficulty || filters.patientType || filters.search) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  programArea: '',
                  specialty: '',
                  difficulty: '',
                  patientType: '',
                  search: ''
                })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((case_) => {
            const IconComponent = PROGRAM_ICONS[case_.programArea] || Stethoscope;
            
            return (
              <div key={case_.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <IconComponent className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                          {case_.title || case_.patientInfo?.chiefComplaint || case_.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getProgramAreaDisplay(case_.programArea)} • {case_.specialty}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {case_.patientInfo?.name}, {case_.patientInfo?.age} • {case_.patientInfo?.gender}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Activity className="h-4 w-4 mr-2" />
                      <span className="font-medium">Chief Complaint:</span> {case_.patientInfo?.chiefComplaint}
                    </div>

                    {case_.patientInfo?.occupation && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Occupation: {case_.patientInfo.occupation}
                      </div>
                    )}

                    {case_.hasGuardian && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        Guardian speaks for patient
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Pediatric Case
                        </span>
                      </div>
                    )}

                    {case_.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="h-4 w-4 mr-2">🌍</span>
                        Location: {case_.location}
                      </div>
                    )}
                  </div>

                  {/* Case Details */}
                  <div className="mb-4">
                    {case_.tags && case_.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {case_.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {case_.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                            +{case_.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {case_.patientInfo?.emotionalTone && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Patient Mood:</span> {case_.patientInfo.emotionalTone}
                      </div>
                    )}

                    {case_.patientInfo?.backgroundStory && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Background:</span> {case_.patientInfo.backgroundStory}
                      </div>
                    )}

                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      🎯 Educational Simulation - Practice your clinical skills
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${DIFFICULTY_COLORS[case_.difficulty] || 'bg-gray-100 text-gray-800'}`}>
                        {case_.difficulty}
                      </span>
                      {case_.version && (
                        <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">
                          v{case_.version}
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleStartSimulation(case_.id)}
                      disabled={startingSimulation === case_.id}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {startingSimulation === case_.id ? 'Starting...' : 'Start Simulation'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredCases.length === 0 && !loading && (
          <div className="text-center py-12">
            <Stethoscope className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cases found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters to see more cases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseSelection;