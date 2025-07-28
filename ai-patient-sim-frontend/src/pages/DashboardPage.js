// ai-patient-sim-frontend/src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { simulationAPI } from '../utils/simulationApi';
import { 
  LogOut, 
  User, 
  Building, 
  Mail, 
  UserCheck,
  Play,
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
  TrendingUp,
  ArrowRight,
  Plus,
  Target,
  Star,
  Calendar,
  Timer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentSimulations, setRecentSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, historyResponse] = await Promise.all([
        simulationAPI.getStatistics(),
        simulationAPI.getSimulationHistory(1, 5) // Get recent 5 simulations
      ]);

      if (statsResponse.success) {
        setStats(statsResponse);
      }

      if (historyResponse.success) {
        setRecentSimulations(historyResponse.simulations || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show error toast as this is not critical
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleStartNewSimulation = () => {
    navigate('/cases');
  };

  const handleViewSimulation = (simulationId) => {
    navigate(`/simulation/${simulationId}/review`);
  };

  const QuickActionCard = ({ icon: Icon, title, description, onClick, color = 'blue' }) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-${color}-500`}
    >
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );

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

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
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
                AI Patient Simulation Platform
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickActionCard
                icon={Plus}
                title="Start New Simulation"
                description="Begin a new patient case simulation"
                onClick={handleStartNewSimulation}
                color="blue"
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
                  title="Average Score"
                  value={`${stats.overview?.averageScore || 0}%`}
                  icon={Target}
                  subtitle={`Based on ${stats.overview?.gradedSimulations || 0} graded cases`}
                  color="purple"
                />
                <StatCard
                  title="Time Practiced"
                  value={formatDuration(stats.overview?.totalTimeMinutes || 0)}
                  icon={Clock}
                  subtitle="Total practice time"
                  color="orange"
                />
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
                      <div key={simulation.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <ProgramIcon programArea={simulation.case?.programArea} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {simulation.case?.title || 'Untitled Case'}
                              </h3>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(simulation.status)}`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {simulation.status.charAt(0).toUpperCase() + simulation.status.slice(1)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(simulation.updatedAt)}
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
                            {simulation.score !== null && (
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {simulation.score}%
                                </div>
                                <div className="text-xs text-gray-500">Score</div>
                              </div>
                            )}
                            <button
                              onClick={() => handleViewSimulation(simulation.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
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

          {/* Performance Insights */}
          {!loading && stats && stats.insights && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Strength Areas */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    Strength Areas
                  </h3>
                  <div className="space-y-3">
                    {stats.insights.strengths?.map((strength, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{strength.skill}</span>
                        <span className="text-sm font-medium text-green-600">{strength.score}%</span>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">Complete more simulations to see your strengths</p>
                    )}
                  </div>
                </div>

                {/* Improvement Areas */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                    Focus Areas
                  </h3>
                  <div className="space-y-3">
                    {stats.insights.improvements?.map((improvement, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{improvement.skill}</span>
                        <span className="text-sm font-medium text-orange-600">{improvement.score}%</span>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">Complete more simulations to identify focus areas</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity Summary */}
          {!loading && stats && stats.recentActivity && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                This Week's Activity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.recentActivity.simulationsThisWeek || 0}
                  </div>
                  <div className="text-sm text-gray-500">Simulations Started</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.recentActivity.completedThisWeek || 0}
                  </div>
                  <div className="text-sm text-gray-500">Simulations Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatDuration(stats.recentActivity.timeThisWeek || 0)}
                  </div>
                  <div className="text-sm text-gray-500">Practice Time</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;