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
  Star,
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
  'student': 'bg-green-100 text-green-800',
  'resident': 'bg-blue-100 text-blue-800',
  'fellow': 'bg-purple-100 text-purple-800'
};

const CaseSelection = () => {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    programArea: '',
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

    if (filters.difficulty) {
      filtered = filtered.filter(case_ => case_.difficulty === filters.difficulty);
    }

    if (filters.patientType) {
      filtered = filtered.filter(case_ => case_.patientType === filters.patientType);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(case_ => 
        case_.name?.toLowerCase().includes(searchLower) ||
        case_.chiefComplaint?.toLowerCase().includes(searchLower) ||
        case_.specialty?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCases(filtered);
  }, [cases, filters]);

  const fetchCases = useCallback(async () => {
    try {
      const response = await simulationAPI.getCases();
      setCases(response.cases || []);
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

  const handleStartSimulation = async (caseId, difficulty) => {
    setStartingSimulation(caseId);
    try {
      const response = await simulationAPI.startSimulation(caseId, difficulty);
      if (response.success) {
        toast.success('Simulation started successfully!');
        navigate(`/simulation/${response.simulation.id}`);
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

  const getPatientTypeDisplay = (patientType) => {
    const types = {
      'adult': 'Adult Patient',
      'pediatric_with_guardian': 'Pediatric + Guardian',
      'adolescent_with_guardian': 'Adolescent + Guardian',
      'pediatric_trauma_with_guardian': 'Pediatric Trauma + Guardian',
      'adolescent_confidential': 'Adolescent (Confidential)'
    };
    return types[patientType] || patientType;
  };

  const getProgramAreaDisplay = (programArea) => {
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
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filter Cases</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option value="internal_medicine">Internal Medicine</option>
              <option value="pediatrics">Pediatrics</option>
              <option value="psychiatry">Psychiatry</option>
              <option value="emergency_medicine">Emergency Medicine</option>
              <option value="family_medicine">Family Medicine</option>
              <option value="surgery">Surgery</option>
            </select>

            {/* Difficulty */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            >
              <option value="">All Levels</option>
              <option value="student">Medical Student</option>
              <option value="resident">Resident</option>
              <option value="fellow">Fellow</option>
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
              <option value="adolescent_with_guardian">Adolescent + Guardian</option>
              <option value="adolescent_confidential">Adolescent (Confidential)</option>
            </select>
          </div>
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
                          {case_.chiefComplaint || case_.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getProgramAreaDisplay(case_.programArea)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {getPatientTypeDisplay(case_.patientType)}
                    </div>
                    
                    {case_.patientAge && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Patient: {case_.patientName}, {case_.patientAge}
                      </div>
                    )}

                    {case_.guardianInfo && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        Guardian: {case_.guardianInfo.name} ({case_.guardianInfo.relationship})
                        {case_.guardianInfo.primaryLanguage !== 'English' && (
                          <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                            {case_.guardianInfo.primaryLanguage}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Learning Objectives */}
                  {case_.learningObjectives && case_.learningObjectives.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Learning Objectives:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {case_.learningObjectives.slice(0, 2).map((objective, index) => (
                          <li key={index} className="flex items-start">
                            <Star className="h-3 w-3 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                            {objective}
                          </li>
                        ))}
                        {case_.learningObjectives.length > 2 && (
                          <li className="text-gray-500">
                            +{case_.learningObjectives.length - 2} more objectives
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${DIFFICULTY_COLORS[case_.difficulty]}`}>
                      {case_.difficulty.charAt(0).toUpperCase() + case_.difficulty.slice(1)}
                    </span>
                    
                    <button
                      onClick={() => handleStartSimulation(case_.id, case_.difficulty)}
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