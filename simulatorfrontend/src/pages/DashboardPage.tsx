import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatCard } from '../components/Dashboard/StatCard';
import { CaseCard } from '../components/Dashboard/CaseCard';
import { ProgressChart } from '../components/Dashboard/ProgressChart';
import { RecentActivity } from '../components/Dashboard/RecentActivity';
import LoadingSpinner from '../components/LoadingSpinner';
import { ApiError } from '../types';

const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getStudentDashboard();
        setDashboardData(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Your Dashboard</h1>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Cases Completed" value={dashboardData.stats.completedCases} />
        <StatCard title="Overall Score" value={`${dashboardData.stats.overallScore}%`} />
        <StatCard title="Current Level" value={dashboardData.stats.currentLevel} />
        <StatCard title="Achievements" value={dashboardData.stats.achievements} />
      </div>

      {/* Recommended Cases */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Recommended for You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData.recommendedCases.map((caseItem: any) => (
            <CaseCard key={caseItem._id} caseItem={caseItem} />
          ))}
        </div>
      </div>

      {/* Progress and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your Progress</h2>
          <ProgressChart data={dashboardData.progressData} />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Recent Activity</h2>
          <RecentActivity activities={dashboardData.recentActivity} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;