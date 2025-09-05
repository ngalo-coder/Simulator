import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';;
import AdminUserManagement from '../components/AdminUserManagement';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'cases' | 'analytics'>('overview');

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSystemStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      // Mock data for demo
      setStats({
        totalUsers: 1247,
        totalCases: 156,
        totalSessions: 3429,
        activeUsers: 89,
        recentUsers: 23,
        recentSessions: 145
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{ title: string; value: number; change?: string; color: string }> = ({ 
    title, value, change, color 
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">{change}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')} flex items-center justify-center`}>
          <div className={`w-6 h-6 rounded-full ${color.replace('text-', 'bg-')}`}></div>
        </div>
      </div>
    </div>
  );

  const TabButton: React.FC<{ id: string; label: string; isActive: boolean; onClick: () => void }> = ({
    label, isActive, onClick
  }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive 
          ? 'bg-blue-600 text-white' 
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your patient simulation platform</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
          <TabButton 
            id="overview" 
            label="Overview" 
            isActive={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <TabButton 
            id="users" 
            label="Users" 
            isActive={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <TabButton 
            id="cases" 
            label="Cases" 
            isActive={activeTab === 'cases'} 
            onClick={() => setActiveTab('cases')} 
          />
          <TabButton 
            id="analytics" 
            label="Analytics" 
            isActive={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
          />
        </div>
      </div>

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
            />
            <StatCard 
              title="Total Cases" 
              value={stats?.totalCases || 0} 
              color="text-green-600" 
            />
            <StatCard 
              title="Total Sessions" 
              value={stats?.totalSessions || 0} 
              change={`+${stats?.recentSessions || 0} this week`}
              color="text-purple-600" 
            />
            <StatCard 
              title="Active Users" 
              value={stats?.activeUsers || 0} 
              color="text-orange-600" 
            />
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">User Management</h3>
              <p className="text-gray-600 mb-4">
                View and manage user accounts, roles, and permissions
              </p>
              <button 
                onClick={() => setActiveTab('users')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Manage Users
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Case Library</h3>
              <p className="text-gray-600 mb-4">
                Add, edit, and organize patient cases
              </p>
              <button 
                onClick={() => setActiveTab('cases')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Manage Cases
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Performance Analytics</h3>
              <p className="text-gray-600 mb-4">
                View detailed usage and performance analytics
              </p>
              <button 
                onClick={() => setActiveTab('analytics')}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
              >
                View Analytics
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Review Queue</h3>
              <p className="text-gray-600 mb-4">
                Review and approve community-contributed cases
              </p>
              <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors">
                Review Cases
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">System Health</h3>
              <p className="text-gray-600 mb-4">
                Monitor system performance and health metrics
              </p>
              <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
                View Health
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Settings</h3>
              <p className="text-gray-600 mb-4">
                Configure system-wide settings and preferences
              </p>
              <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                Settings
              </button>
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Case Management</h2>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">Case Management Interface</p>
            <p>This section will contain case management tools including:</p>
            <ul className="text-left mt-4 space-y-2 max-w-md mx-auto">
              <li>• Browse all available cases</li>
              <li>• Add new patient cases</li>
              <li>• Edit existing case content</li>
              <li>• Organize cases by specialty</li>
            </ul>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">Analytics Interface</p>
            <p>This section will contain detailed analytics including:</p>
            <ul className="text-left mt-4 space-y-2 max-w-md mx-auto">
              <li>• User engagement metrics</li>
              <li>• Case completion rates</li>
              <li>• Performance trends</li>
              <li>• Usage statistics</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;