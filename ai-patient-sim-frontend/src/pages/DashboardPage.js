// ai-patient-sim-frontend/src/pages/DashboardPage.js - FIXED ESLint Issues
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { simulationAPI } from '../utils/simulationApi';
import { userManagementAPI } from '../utils/userManagementApi';
import { 
  LogOut, 
  BookOpen,
  History,
  BarChart3,
  Heart,
  Baby,
  Brain,
  Activity,
  Users,
  Stethoscope,
  Clock,
  Award,
  ArrowRight,
  Plus,
  Timer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentSimulations, setRecentSimulations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [progressionReqs, setProgressionReqs] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    // Validate token before making API calls
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('⚠️ No token found, skipping API calls');
      setLoading(false);
      return;
    }

    try {
      // Validate token format and expiration
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (tokenPayload.exp && tokenPayload.exp <= currentTime) {
        console.log('⚠️ Token expired, not making API calls');
        setLoading(false);
        return;
      }

      console.log('🔄 Making dashboard API calls...');

      // Make API calls individually to handle failures gracefully
      const statsPromise = simulationAPI.getStatistics().catch(error => {
        console.warn('📊 Stats API failed:', error);
        return { success: false, error: error.message };
      });
      
      const historyPromise = simulationAPI.getSimulationHistory(1, 5).catch(error => {
        console.warn('📚 History API failed:', error);
        return { success: false, simulations: [] };
      });

      // NEW: Enhanced user management data
      const profilePromise = userManagementAPI.getExtendedProfile().catch(error => {
        console.warn('👤 Profile API failed:', error);
        return { success: false, user: null };
      });

      const permissionsPromise = userManagementAPI.getUserPermissions().catch(error => {
        console.warn('🔐 Permissions API failed:', error);
        return { success: false, permissions: null };
      });

      const progressionPromise = userManagementAPI.getProgressionRequirements().catch(error => {
        console.warn('📈 Progression API failed:', error);
        return { success: false };
      });

      const [statsResponse, historyResponse, profileResponse, permissionsResponse, progressionResponse] = await Promise.all([
        statsPromise,
        historyPromise,
        profilePromise,
        permissionsPromise,
        progressionPromise
      ]);

      if (statsResponse.success) {
        console.log('✅ Stats loaded successfully');
        setStats(statsResponse);
      } else {
        console.log('📊 Stats not available, using defaults');
        setStats(null);
      }

      if (historyResponse.success) {
        console.log('✅ History loaded successfully');
        setRecentSimulations(historyResponse.simulations || []);
      } else {
        console.log('📚 History not available, showing empty state');
        setRecentSimulations([]);
      }

      // NEW: Set enhanced user data
      if (profileResponse.success) {
        console.log('✅ Enhanced profile loaded successfully');
        setUserProfile(profileResponse.user);
      }

      if (permissionsResponse.success) {
        console.log('✅ Permissions loaded successfully');
        setPermissions(permissionsResponse.permissions);
      }

      if (progressionResponse.success) {
        console.log('✅ Progression requirements loaded successfully');
        setProgressionReqs(progressionResponse);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      // Set default states so dashboard still works
      setStats(null);
      setRecentSimulations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch data if user is authenticated and token exists
    if (user && localStorage.getItem('authToken')) {
      console.log('📊 User authenticated, fetching dashboard data...');
      fetchDashboardData();
    } else {
      console.log('⚠️ User not authenticated, skipping dashboard data fetch');
      setLoading(false);
    }
  }, [user, fetchDashboardData]);

  const handleLogout = () => {
    logout();
  };

  const handleStartNewSimulation = () => {
    navigate('/cases');
  };

  const handleViewSimulation = (simulationId) => {
    navigate(`/simulation/${simulationId}`);
  };

  const QuickActionCard = ({ icon: Icon, title, description, onClick, color = 'blue' }) => {
    const colorClasses = {
      blue: 'border-blue-500 bg-blue-100 text-blue-600',
      green: 'border-green-500 bg-green-100 text-green-600',
      purple: 'border-purple-500 bg-purple-100 text-purple-600',
      indigo: 'border-indigo-500 bg-indigo-100 text-indigo-600',
      red: 'border-red-500 bg-red-100 text-red-600',
      yellow: 'border-yellow-500 bg-yellow-100 text-yellow-600'
    };

    const colors = colorClasses[color] || colorClasses.blue;
    const [borderColor, bgColor, textColor] = colors.split(' ');

    return (
      <div 
        onClick={onClick}
        className={`bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${borderColor}`}
      >
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${bgColor}`}>
            <Icon className={`h-6 w-6 ${textColor}`} />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, icon: Icon, subtitle, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  const ProgramIcon = ({ programArea }) => {
    const iconMap = {
      'internal_medicine': Heart,
      'pediatrics': Baby,
      'psychiatry': Brain,
      'emergency_medicine': Activity,
      'family_medicine': Users,
      'surgery': Stethoscope
    };
    
    const IconComponent = iconMap[programArea] || Stethoscope;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'active':
        return Timer;
      case 'paused':
        return AlertTriangle;
      default:
        return XCircle;
    }
  };

  const formatDuration = (durationString) => {
    if (!durationString) return '0m';
    if (typeof durationString === 'string' && durationString.includes('minutes')) {
      return durationString.replace(' minutes', 'm');
    }
    return durationString;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Simuatech: AI Patient Simulation Platform
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.profile?.firstName}! Ready to practice with virtual patients?
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionCard
                icon={Plus}
                title="Start New Simulation"
                description="Begin a new patient case simulation"
                onClick={handleStartNewSimulation}
                color="blue"
              />
              <QuickActionCard
                icon={BookOpen}
                title="Template Cases"
                description="Browse structured clinical scenarios"
                onClick={() => navigate('/template-cases')}
                color="indigo"
              />
              <QuickActionCard
                icon={History}
                title="View History"
                description="Review your past simulations and progress"
                onClick={() => navigate('/history')}
                color="green"
              />
              <QuickActionCard
                icon={BookOpen}
                title="Browse Cases"
                description="Explore available patient cases"
                onClick={() => navigate('/cases')}
                color="purple"
              />
            </div>
          </div>

          {/* Statistics */}
          {!loading && stats && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Simulations"
                  value={stats.overview?.totalSimulations || 0}
                  icon={BarChart3}
                  color="blue"
                />
                <StatCard
                  title="Completed"
                  value={stats.overview?.completedSimulations || 0}
                  icon={Award}
                  subtitle={`${stats.overview?.completionRate || 0}% completion rate`}
                  color="green"
                />
                <StatCard
                  title="Active Sessions"
                  value={stats.overview?.activeSimulations || 0}
                  icon={Timer}
                  subtitle="Currently in progress"
                  color="orange"
                />
                <StatCard
                  title="Practice Time"
                  value={formatDuration(stats.overview?.totalTimeMinutes) || '0m'}
                  icon={Clock}
                  subtitle="Total time spent"
                  color="purple"
                />
              </div>
            </div>
          )}

          {/* NEW: User Progression Status */}
          {!loading && userProfile && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Academic Progress</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {userProfile.profile?.firstName} {userProfile.profile?.lastName}
                      </h3>
                      <p className="text-gray-600">
                        {userProfile.extendedProfile?.enhancedRole?.roleType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Medical Student'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Level {userProfile.extendedProfile?.enhancedRole?.level || 1} • 
                        Year {userProfile.extendedProfile?.academicProfile?.currentYear || 1}
                      </p>
                    </div>
                  </div>
                  {progressionReqs && progressionReqs.nextRole && (
                    <button
                      onClick={() => navigate('/progression')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      View Progression
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  )}
                </div>

                {/* Progression Requirements */}
                {progressionReqs && progressionReqs.nextRole && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">
                      Progress to {progressionReqs.nextRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Simulations</p>
                        <p className="text-lg font-semibold">
                          {progressionReqs.currentProgress?.simulationsCompleted || 0} / {progressionReqs.requirements?.simulationsRequired || 0}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, ((progressionReqs.currentProgress?.simulationsCompleted || 0) / (progressionReqs.requirements?.simulationsRequired || 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Average Score</p>
                        <p className="text-lg font-semibold">
                          {progressionReqs.currentProgress?.currentAverageScore || 0}%
                        </p>
                        <p className="text-xs text-gray-500">
                          Target: {progressionReqs.requirements?.averageScoreRequired || 0}%
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Competencies</p>
                        <p className="text-lg font-semibold">
                          {progressionReqs.currentProgress?.competenciesAchieved?.length || 0} / {progressionReqs.requirements?.competenciesRequired?.length || 0}
                        </p>
                        <p className="text-xs text-gray-500">Skills mastered</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Permissions Summary */}
                {permissions && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3">Current Access</h4>
                    <div className="flex flex-wrap gap-2">
                      {permissions.simulationAccess?.slice(0, 4).map((access, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {access.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                      {permissions.simulationAccess?.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{permissions.simulationAccess.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Simulations */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Simulations</h2>
              <button
                onClick={() => navigate('/history')}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View All
              </button>
            </div>
            
            {loading ? (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="animate-pulse">
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : recentSimulations.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {recentSimulations.map((simulation) => {
                    const StatusIcon = getStatusIcon(simulation.status);
                    return (
                      <div 
                        key={simulation.id} 
                        className={`p-4 sm:p-6 transition-colors ${
                          simulation.status === 'active' || simulation.status === 'paused' 
                            ? 'hover:bg-blue-50 cursor-pointer' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          if (simulation.status === 'active' || simulation.status === 'paused') {
                            handleViewSimulation(simulation.id);
                          }
                        }}
                      >
                        {/* Mobile Layout */}
                        <div className="sm:hidden">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <ProgramIcon programArea={simulation.programArea} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 leading-tight">
                                {simulation.caseName || 'Untitled Case'}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(simulation.status)}`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {simulation.status.charAt(0).toUpperCase() + simulation.status.slice(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(simulation.createdAt)}
                                </span>
                              </div>
                              {simulation.duration && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Duration: {formatDuration(simulation.duration)}
                                </div>
                              )}
                              {simulation.overallScore !== null && simulation.overallScore !== undefined && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Score: {simulation.overallScore}%
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Mobile Action Button */}
                          {(simulation.status === 'active' || simulation.status === 'paused') && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewSimulation(simulation.id);
                                  }}
                                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Continue & Complete
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 text-center mt-2">
                                Tap to resume simulation and access complete button
                              </p>
                            </div>
                          )}
                          
                          {simulation.status === 'completed' && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewSimulation(simulation.id);
                                }}
                                className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Report
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <ProgramIcon programArea={simulation.programArea} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {simulation.caseName || 'Untitled Case'}
                              </h3>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(simulation.status)}`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {simulation.status.charAt(0).toUpperCase() + simulation.status.slice(1)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(simulation.createdAt)}
                                </span>
                                {simulation.duration && (
                                  <span className="text-sm text-gray-500">
                                    Duration: {formatDuration(simulation.duration)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {simulation.overallScore !== null && simulation.overallScore !== undefined && (
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {simulation.overallScore}%
                                </div>
                                <div className="text-xs text-gray-500">Score</div>
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewSimulation(simulation.id);
                              }}
                              className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                simulation.status === 'active' || simulation.status === 'paused'
                                  ? 'border-blue-300 text-white bg-blue-600 hover:bg-blue-700'
                                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                              }`}
                            >
                              {simulation.status === 'active' || simulation.status === 'paused' ? (
                                <>
                                  <ArrowRight className="h-4 w-4 mr-1" />
                                  Continue
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No simulations yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start your first patient simulation to begin practicing clinical skills.
                  </p>
                  <button
                    onClick={handleStartNewSimulation}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start First Simulation
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Program Performance */}
          {!loading && stats && stats.programBreakdown && stats.programBreakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 text-gray-500 mr-2" />
                Progress by Program
              </h2>
              <div className="space-y-4">
                {stats.programBreakdown.map((program, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ProgramIcon programArea={program.programArea} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {program.programArea.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {program.simulationsCompleted} completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${program.averageProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 min-w-[3rem] text-right">
                        {program.averageProgress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;