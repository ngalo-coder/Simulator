import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import AdminUserManagement from '../components/AdminUserManagement';
import AdminCaseManagement from '../components/AdminCaseManagement';
import AdminSpecialtyManagement from '../components/AdminSpecialtyManagement';
import AdminAnalytics from '../components/AdminAnalytics';


interface SystemStats {
  totalUsers: number;
  totalCases: number;
  totalSessions: number;
  activeUsers: number;
  recentUsers: number;
  recentSessions: number;
}

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'cases' | 'specialties' | 'analytics'>('overview');

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSystemStats();
      console.log('✅ Real admin stats loaded:', data);
      setStats(data);
    } catch (error: any) {
      console.error('❌ Error fetching system stats:', error);
      setError(`Failed to load admin statistics: ${error.message || 'Unknown error'}`);
      // Show zero values when API fails instead of hardcoded mock data
      setStats({
        totalUsers: 0,
        totalCases: 0,
        totalSessions: 0,
        activeUsers: 0,
        recentUsers: 0,
        recentSessions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{ title: string; value: number; change?: string; color: string; icon: string }> = ({
    title, value, change, color, icon
  }) => (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group">
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
        <div className={`w-full h-full rounded-full ${color.replace('text-', 'bg-').replace('-600', '-200')}`}></div>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${color.replace('text-', 'bg-').replace('-600', '-100')} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-xl">{icon}</span>
          </div>
          {change && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${change.startsWith('+') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              {change}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color} mb-2`}>{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );

  const TabButton: React.FC<{ id: string; label: string; isActive: boolean; onClick: () => void; icon?: string }> = ({
    label, isActive, onClick, icon
  }) => (
    <button
      onClick={onClick}
      className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transform scale-105'
          : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-md'
      }`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-lg w-64 animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-96 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-8 bg-gradient-to-r from-green-300 to-green-200 dark:from-green-600 dark:to-green-700 rounded-xl w-32 animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-white/20 dark:border-gray-700/20">
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-24 animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-xl animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Modern Header */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Admin Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Professional patient simulation platform management</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">System Online</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Navigation Tabs */}
        <div className="mb-12">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-white/20 dark:border-gray-700/20">
            <div className="flex flex-wrap gap-2">
              <TabButton
                id="overview"
                label="Overview"
                isActive={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                icon="🏠"
              />
              <TabButton
                id="users"
                label="Users"
                isActive={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                icon="👥"
              />
              <TabButton
                id="cases"
                label="Cases"
                isActive={activeTab === 'cases'}
                onClick={() => setActiveTab('cases')}
                icon="📋"
              />
              <TabButton
                id="specialties"
                label="Specialties"
                isActive={activeTab === 'specialties'}
                onClick={() => setActiveTab('specialties')}
                icon="🏥"
              />
              <TabButton
                id="analytics"
                label="Analytics"
                isActive={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
                icon="📊"
              />
            </div>
          </div>
        </div>

      {/* Modern Error Alert */}
      {error && (
        <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 opacity-10">
            <div className="w-full h-full rounded-full bg-red-500"></div>
          </div>
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">API Connection Error</h3>
              <p className="text-red-700 dark:text-red-300 mb-3 font-medium">{error}</p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  <strong>Troubleshooting Steps:</strong>
                </p>
                <ul className="text-sm text-red-600 dark:text-red-400 mt-2 space-y-1">
                  <li>• Check your authentication credentials</li>
                  <li>• Verify backend server is running</li>
                  <li>• Ensure database connection is active</li>
                  <li>• Check network connectivity</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              change={`+${stats?.recentUsers || 0} this month`}
              color="text-blue-600"
              icon="👥"
            />
            <StatCard
              title="Total Cases"
              value={stats?.totalCases || 0}
              color="text-green-600"
              icon="📋"
            />
            <StatCard
              title="Total Sessions"
              value={stats?.totalSessions || 0}
              change={`+${stats?.recentSessions || 0} this week`}
              color="text-purple-600"
              icon="⚡"
            />
            <StatCard
              title="Active Users"
              value={stats?.activeUsers || 0}
              color="text-orange-600"
              icon="🟢"
            />
          </div>

          {/* Modern Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <div className="w-full h-full rounded-full bg-blue-500"></div>
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">User Management</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  View and manage user accounts, roles, and permissions with advanced filtering and bulk operations
                </p>
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Manage Users
                </button>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <div className="w-full h-full rounded-full bg-green-500"></div>
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Case Library</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Add, edit, and organize patient cases with comprehensive case creation and management tools
                </p>
                <button
                  onClick={() => setActiveTab('cases')}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Manage Cases
                </button>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <div className="w-full h-full rounded-full bg-indigo-500"></div>
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🏥</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Specialty Visibility</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Control which specialties are visible to users with real-time visibility management
                </p>
                <button
                  onClick={() => setActiveTab('specialties')}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Manage Specialties
                </button>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <div className="w-full h-full rounded-full bg-purple-500"></div>
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Performance Analytics</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  View detailed usage and performance analytics with comprehensive reporting tools
                </p>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  View Analytics
                </button>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <div className="w-full h-full rounded-full bg-orange-500"></div>
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Review Queue</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Review and approve community-contributed cases with advanced moderation tools
                </p>
                <button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                  Review Cases
                </button>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <div className="w-full h-full rounded-full bg-red-500"></div>
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">❤️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">System Health</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Monitor system performance and health metrics with real-time monitoring dashboard
                </p>
                <button className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                  View Health
                </button>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <div className="w-full h-full rounded-full bg-gray-500"></div>
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Settings</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Configure system-wide settings and preferences with advanced configuration options
                </p>
                <button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                  Settings
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <AdminUserManagement />
      )}

      {/* Cases Tab */}
      {activeTab === 'cases' && (
        <AdminCaseManagement />
      )}

      {/* Specialties Tab */}
      {activeTab === 'specialties' && (
        <AdminSpecialtyManagement />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <AdminAnalytics />
      )}
      </div>
    </div>
  );
};

export default AdminPage;