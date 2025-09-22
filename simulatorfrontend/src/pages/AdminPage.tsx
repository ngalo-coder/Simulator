import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import AdminUserManagement from '../components/AdminUserManagement';
import AdminCaseManagement from '../components/AdminCaseManagement';
import AdminSpecialtyManagement from '../components/AdminSpecialtyManagement';
import AdminAnalytics from '../components/AdminAnalytics';
import { Button, Card, Loading, Alert } from '../components/ui';


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
    <Card variant="elevated" padding="md" hover={true} className="group">
      <div className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
          <div className={`w-full h-full rounded-full ${color.replace('text-', 'bg-').replace('-600', '-200')}`}></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-medical-lg ${color.replace('text-', 'bg-').replace('-600', '-100')} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <span className="text-xl">{icon}</span>
            </div>
            {change && (
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${change.startsWith('+') ? 'bg-stable-100 text-stable-700 dark:bg-stable-900/30 dark:text-stable-400' : 'bg-medical-100 text-medical-700 dark:bg-medical-900/30 dark:text-medical-400'}`}>
                {change}
              </div>
            )}
          </div>
          <div>
            <p className="medical-label">{title}</p>
            <p className={`text-3xl font-bold ${color} mb-2`}>{value.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </Card>
  );

  const TabButton: React.FC<{ id: string; label: string; isActive: boolean; onClick: () => void; icon?: string }> = ({
    label, isActive, onClick, icon
  }) => (
    <Button
      variant={isActive ? "primary" : "ghost"}
      size="md"
      onClick={onClick}
      className={`relative transition-all duration-300 flex items-center gap-2 ${
        isActive
          ? 'transform scale-105'
          : 'hover:bg-medical-50 dark:hover:bg-medical-900/20'
      }`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
      )}
    </Button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-stable-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-medical-600/10 to-medical-400/10 rounded-medical-xl blur-3xl"></div>
            <Card variant="glass" padding="lg" className="relative">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-medical-500 to-medical-600 rounded-medical-xl flex items-center justify-center shadow-medical-lg">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-medical-lg w-64">
                        <Loading variant="pulse" size="lg" />
                      </div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-medical w-96">
                        <Loading variant="pulse" size="md" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-8 bg-gradient-to-r from-stable-300 to-stable-200 dark:from-stable-600 dark:to-stable-700 rounded-medical-lg w-32">
                    <Loading variant="pulse" size="md" />
                  </div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-medical w-24">
                    <Loading variant="pulse" size="sm" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-12">
            <Card variant="glass" padding="sm" className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-medical-lg w-24">
                  <Loading variant="pulse" size="md" />
                </div>
              ))}
            </Card>
          </div>

          <div className="mt-12 medical-grid-4">
            {[1, 2, 3, 4].map(i => (
              <Card variant="elevated" padding="md" key={i}>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-medical-lg">
                    <Loading variant="pulse" size="md" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-medical w-3/4">
                      <Loading variant="pulse" size="sm" />
                    </div>
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-medical w-1/2">
                      <Loading variant="pulse" size="lg" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-stable-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Medical Header */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-medical-600/10 to-medical-400/10 rounded-medical-xl blur-3xl"></div>
          <Card variant="glass" padding="lg" className="relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-medical-500 to-medical-600 rounded-medical-xl flex items-center justify-center shadow-medical-lg">
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
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-stable-100 dark:bg-stable-900/30 text-stable-700 dark:text-stable-400 rounded-medical-lg">
                  <div className="w-2 h-2 bg-stable-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">System Online</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Medical Navigation Tabs */}
        <div className="mb-12">
          <Card variant="glass" padding="sm" className="flex flex-wrap gap-2">
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
          </Card>
        </div>

      {/* Medical Error Alert */}
      {error && (
        <Alert variant="error" className="mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emergency-100 dark:bg-emergency-900/30 rounded-medical-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-emergency-800 dark:text-emergency-200 mb-2">API Connection Error</h3>
              <p className="text-emergency-700 dark:text-emergency-300 mb-3 font-medium">{error}</p>
              <Card variant="elevated" padding="md" className="bg-emergency-50 dark:bg-emergency-900/20 border-emergency-200 dark:border-emergency-800/30">
                <p className="text-sm text-emergency-600 dark:text-emergency-400">
                  <strong>Troubleshooting Steps:</strong>
                </p>
                <ul className="text-sm text-emergency-600 dark:text-emergency-400 mt-2 space-y-1">
                  <li>• Check your authentication credentials</li>
                  <li>• Verify backend server is running</li>
                  <li>• Ensure database connection is active</li>
                  <li>• Check network connectivity</li>
                </ul>
              </Card>
            </div>
          </div>
        </Alert>
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

          {/* Medical Quick Actions */}
          <div className="medical-grid">
            <Card variant="elevated" padding="md" hover={true} className="group">
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="w-full h-full rounded-full bg-medical-500"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-medical-500 to-medical-600 rounded-medical-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">👥</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">User Management</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    View and manage user accounts, roles, and permissions with advanced filtering and bulk operations
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setActiveTab('users')}
                    className="w-full hover-lift"
                  >
                    Manage Users
                  </Button>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="md" hover={true} className="group">
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="w-full h-full rounded-full bg-stable-500"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-stable-500 to-stable-600 rounded-medical-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Case Library</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    Add, edit, and organize patient cases with comprehensive case creation and management tools
                  </p>
                  <Button
                    variant="success"
                    size="md"
                    onClick={() => setActiveTab('cases')}
                    className="w-full hover-lift"
                  >
                    Manage Cases
                  </Button>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="md" hover={true} className="group">
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="w-full h-full rounded-full bg-medical-500"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-medical-500 to-medical-600 rounded-medical-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🏥</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Specialty Visibility</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    Control which specialties are visible to users with real-time visibility management
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setActiveTab('specialties')}
                    className="w-full hover-lift"
                  >
                    Manage Specialties
                  </Button>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="md" hover={true} className="group">
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="w-full h-full rounded-full bg-info-500"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-info-500 to-info-600 rounded-medical-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Performance Analytics</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    View detailed usage and performance analytics with comprehensive reporting tools
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setActiveTab('analytics')}
                    className="w-full hover-lift"
                  >
                    View Analytics
                  </Button>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="md" hover={true} className="group">
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="w-full h-full rounded-full bg-warning-500"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-warning-500 to-warning-600 rounded-medical-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Review Queue</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    Review and approve community-contributed cases with advanced moderation tools
                  </p>
                  <Button
                    variant="warning"
                    size="md"
                    className="w-full hover-lift"
                  >
                    Review Cases
                  </Button>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="md" hover={true} className="group">
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="w-full h-full rounded-full bg-emergency-500"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-emergency-500 to-emergency-600 rounded-medical-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">❤️</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">System Health</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    Monitor system performance and health metrics with real-time monitoring dashboard
                  </p>
                  <Button
                    variant="danger"
                    size="md"
                    className="w-full hover-lift"
                  >
                    View Health
                  </Button>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="md" hover={true} className="group">
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="w-full h-full rounded-full bg-gray-500"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-medical-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Settings</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    Configure system-wide settings and preferences with advanced configuration options
                  </p>
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full hover-lift"
                  >
                    Settings
                  </Button>
                </div>
              </div>
            </Card>
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