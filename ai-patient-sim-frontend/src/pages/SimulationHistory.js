// ai-patient-sim-frontend/src/pages/SimulationHistory.js - FIXED ESLint Issues
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulationAPI } from '../utils/simulationApi';
import { 
  Clock, 
  CheckCircle,
  Pause,
  Play,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Award,
  Target,
  ArrowLeft,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const SimulationHistory = () => {
  const navigate = useNavigate();
  
  // Data state
  const [simulations, setSimulations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Filter and pagination state
  const [filters, setFilters] = useState({
    status: '',
    programArea: '',
    difficulty: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  
  const itemsPerPage = 10;

  const fetchSimulationHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await simulationAPI.getSimulationHistory(
        currentPage, 
        itemsPerPage, 
        filters
      );
      
      if (response.success) {
        setSimulations(response.simulations || []);
        setPagination(response.pagination || {});
      } else {
        // Handle service unavailable gracefully
        setSimulations([]);
        setPagination({ page: 1, limit: itemsPerPage, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Error fetching simulation history:', error);
      toast.error('Failed to load simulation history');
      setSimulations([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  const fetchStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await simulationAPI.getStatistics();
      if (response.success) {
        setStatistics(response);
      } else {
        setStatistics(null);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatistics(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSimulationHistory();
  }, [fetchSimulationHistory]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      programArea: '',
      difficulty: ''
    });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      case 'active':
        return <Play className="h-5 w-5 text-blue-500" />;
      case 'abandoned':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'abandoned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'student':
        return 'bg-green-100 text-green-800';
      case 'resident':
        return 'bg-blue-100 text-blue-800';
      case 'fellow':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (durationString) => {
    if (!durationString) return 'N/A';
    if (typeof durationString === 'string' && durationString.includes('minutes')) {
      return durationString.replace(' minutes', 'm');
    }
    return durationString;
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-1">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">{trend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Simulation History</h1>
                <p className="mt-1 text-gray-600">Track your learning progress and performance</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/cases')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Start New Simulation
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        {!statsLoading && statistics && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Simulations"
                value={statistics.overview?.totalSimulations || 0}
                icon={BarChart3}
                color="blue"
              />
              <StatCard
                title="Completed"
                value={statistics.overview?.completedSimulations || 0}
                icon={CheckCircle}
                color="green"
              />
              <StatCard
                title="Completion Rate"
                value={`${statistics.overview?.completionRate || 0}%`}
                icon={Target}
                color="purple"
              />
              <StatCard
                title="Active Sessions"
                value={statistics.overview?.activeSimulations || 0}
                icon={Play}
                color="orange"
              />
            </div>
          </div>
        )}

        {/* Program Breakdown */}
        {!statsLoading && statistics?.programBreakdown && statistics.programBreakdown.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Program Area Progress</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Simulations by Program</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {statistics.programBreakdown.map((program, index) => (
                  <div key={index} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {program.programArea.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {program.simulationsCompleted} simulations completed
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${program.averageProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {program.averageProgress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Area</label>
              <select
                value={filters.programArea}
                onChange={(e) => handleFilterChange('programArea', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Programs</option>
                <option value="internal_medicine">Internal Medicine</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="psychiatry">Psychiatry</option>
                <option value="emergency_medicine">Emergency Medicine</option>
                <option value="family_medicine">Family Medicine</option>
                <option value="surgery">Surgery</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="student">Student</option>
                <option value="resident">Resident</option>
                <option value="fellow">Fellow</option>
              </select>
            </div>
          </div>
        </div>

        {/* Simulation History Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Simulation History</h3>
          </div>
          
          {loading ? (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading simulations...</p>
            </div>
          ) : simulations.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="flex flex-col items-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No simulations found</h3>
                <p className="text-gray-500 mb-4">
                  {Object.values(filters).some(f => f) 
                    ? "Try adjusting your filters to see more simulations."
                    : "You haven't started any simulations yet."
                  }
                </p>
                <button
                  onClick={() => navigate('/cases')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Start Your First Simulation
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Case
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {simulations.map((simulation) => (
                      <tr key={simulation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {simulation.caseName || 'Untitled Case'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {simulation.programArea?.replace('_', ' ') || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(simulation.status)}
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(simulation.status)}`}>
                              {simulation.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(simulation.difficulty)}`}>
                            {simulation.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(simulation.duration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {simulation.overallScore ? `${simulation.overallScore}%` : 'N/A'}
                            </div>
                            {simulation.overallScore >= 80 && (
                              <Award className="h-4 w-4 text-yellow-500 ml-1" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(simulation.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            {simulation.status === 'active' || simulation.status === 'paused' ? (
                              <button
                                onClick={() => navigate(`/simulation/${simulation.id}`)}
                                className="text-blue-600 hover:text-blue-500 flex items-center"
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Continue
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/simulation/${simulation.id}`)}
                                className="text-gray-600 hover:text-gray-500 flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                        <span className="font-medium">{pagination.pages}</span> ({pagination.total} total)
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!pagination.hasPrev}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNum === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.hasNext}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationHistory;