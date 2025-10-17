import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/apiService';
import PrivacySettingsModal from '../components/PrivacySettings';
import DataExportModal from '../components/DataExportModal';

interface ProgressData {
  progress: {
    totalCasesCompleted: number;
    totalCasesAttempted: number;
    overallAverageScore: number;
  };
  recentActivity: {
    title: string;
    caseId: string;
    score: number;
    endTime: Date;
    status: string;
    specialty?: string;
  }[];
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const progressData = await api.getUserProgress();
        // Transform progress data to match dashboard structure
        const dashboardData: ProgressData = {
          progress: {
            totalCasesCompleted: progressData.totalCasesCompleted,
            totalCasesAttempted: progressData.totalCasesAttempted,
            overallAverageScore: progressData.overallAverageScore
          },
          recentActivity: progressData.recentPerformance?.map((perf: { 
            caseTitle: string; 
            caseId: string; 
            score: number; 
            completedAt: Date;
            specialty?: string;
          }) => ({
            title: perf.caseTitle,
            caseId: perf.caseId,
            score: perf.score,
            endTime: perf.completedAt,
            status: 'completed',
            specialty: perf.specialty
          })) || []
        };
        setProgressData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [user?.id]);



  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Simple Welcome Section */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Ready to continue your medical training?
        </p>
      </div>

      {/* Main Actions */}
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/browse-cases"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all text-center"
          >
            <div className="text-3xl mb-2">🏥</div>
            <h2 className="text-xl font-bold mb-2">Start New Simulation</h2>
            <p className="text-blue-100 text-sm">Begin a new patient case</p>
          </Link>

          <Link
            to="/progress"
            className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 p-6 rounded-xl shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all text-center"
          >
            <div className="text-3xl mb-2">📊</div>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Progress & Reports</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">View your performance</p>
          </Link>
        </div>

        {/* Simple Progress Summary */}
        {progressData?.progress && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Progress</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{progressData.progress.totalCasesCompleted}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Cases Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{Math.round(progressData.progress.overallAverageScore)}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Average Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Section */}
        {user?.role === 'admin' && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Admin Access</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Manage system settings</p>
              </div>
              <Link
                to="/admin"
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
              >
                Admin Panel
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPrivacySettings && (
        <PrivacySettingsModal onClose={() => setShowPrivacySettings(false)} />
      )}
      {showDataExport && (
        <DataExportModal onClose={() => setShowDataExport(false)} />
      )}
    </div>
  );
};

export default DashboardPage;