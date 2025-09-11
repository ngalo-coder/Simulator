import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';

interface UserWithScores {
  username: string;
  email: string;
  role: string;
  createdAt: string;
  totalCases: number;
  averageScore: number;
  excellentCount: number;
  excellentRate: number;
}

interface SystemStats {
  totalUsers: number;
  totalCases: number;
  totalSessions: number;
  recentUsers: number;
  activeUsers: number;
  recentSessions: number;
  casesBySpecialty?: Array<{ _id: string; count: number }>;
  userGrowth?: Array<{ _id: { year: number; month: number }; count: number }>;
}

const AdminAnalytics: React.FC = () => {
  const [usersWithScores, setUsersWithScores] = useState<UserWithScores[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersData, statsData] = await Promise.all([
        api.getUsersWithScores(),
        api.getSystemStats()
      ]);
      
      setUsersWithScores(Array.isArray(usersData) ? usersData : []);
      setSystemStats(statsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const topPerformers = usersWithScores
    .filter(user => user.totalCases > 0)
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 10);

  const mostActiveByCases = usersWithScores
    .sort((a, b) => b.totalCases - a.totalCases)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">System performance and user analytics</p>
        </div>
        <button
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* System Stats Cards */}
      {systemStats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{systemStats.totalUsers.toLocaleString()}</p>
                {systemStats.recentUsers > 0 && (
                  <p className="text-sm text-green-600 mt-1">+{systemStats.recentUsers} this month</p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold text-green-600">{systemStats.totalCases.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-purple-600">{systemStats.totalSessions.toLocaleString()}</p>
                {systemStats.recentSessions > 0 && (
                  <p className="text-sm text-green-600 mt-1">+{systemStats.recentSessions} this week</p>
                )}
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-purple-600 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-orange-600">{systemStats.activeUsers.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-orange-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers (by Average Score)</h3>
            <p className="text-sm text-gray-600">Users with highest average scores</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topPerformers.length > 0 ? (
                  topPerformers.map((user, index) => (
                    <tr key={user.username} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.totalCases}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getPerformanceColor(user.averageScore)}`}>
                          {user.averageScore.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No performance data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Active Users */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Most Active Users (by Cases Completed)</h3>
            <p className="text-sm text-gray-600">Users who have completed the most cases</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Excellent</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mostActiveByCases.length > 0 ? (
                  mostActiveByCases.map((user, index) => (
                    <tr key={user.username} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.totalCases}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.excellentCount}</div>
                          <div className="text-xs text-gray-500">{user.excellentRate.toFixed(1)}%</div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No activity data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cases by Specialty */}
      {systemStats?.casesBySpecialty && systemStats.casesBySpecialty.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Cases by Specialty</h3>
            <p className="text-sm text-gray-600">Distribution of cases across different specialties</p>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemStats.casesBySpecialty.map((specialty, index) => (
                <div key={specialty._id || `specialty-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{specialty._id || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">Cases</div>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{specialty.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Summary Statistics</h3>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{usersWithScores.length}</div>
              <div className="text-sm text-gray-600">Users with Performance Data</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {usersWithScores.length > 0 
                  ? (usersWithScores.reduce((sum, user) => sum + user.averageScore, 0) / usersWithScores.length).toFixed(1)
                  : '0'
                }%
              </div>
              <div className="text-sm text-gray-600">Platform Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {usersWithScores.reduce((sum, user) => sum + user.totalCases, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Case Completions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;