import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      setPdfError('');
      await api.downloadProgressPDF();
      // Success feedback could be added here if needed
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setPdfError('Failed to download progress report. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Function to get score background based on value
  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mb-4">
          <span className="text-white text-2xl font-bold">👋</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Continue your medical training journey with our interactive patient simulations
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Start Simulation Section - Prominent CTA */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-6 md:mb-0 md:mr-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Start New Simulation</h2>
                  <p className="text-blue-100 max-w-md">
                    Begin a new patient case to continue your medical training journey
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link 
                    to="/browse-cases" 
                    className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-md"
                  >
                    Browse Cases
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {progressData?.recentActivity && progressData.recentActivity.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {progressData.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">{activity.title || 'Unknown Case'}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {activity.status === 'completed' ? 'Completed' : 'Attempted'} on {new Date(activity.endTime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(activity.score)}`}>
                        {Math.round(activity.score || 0)}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link 
                    to="/progress" 
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    View all activity
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Progress Overview */}
          {progressData?.progress && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Progress Overview</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {progressData.progress.totalCasesCompleted}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Cases Completed</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                      {progressData.progress.totalCasesAttempted}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Cases Attempted</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {Math.round(progressData.progress.overallAverageScore)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Average Score</div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round(progressData.progress.overallAverageScore)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${progressData.progress.overallAverageScore >= 90 ? 'bg-green-500' : progressData.progress.overallAverageScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(progressData.progress.overallAverageScore, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-8">
          {/* Progress Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progress & Reports</h3>
            </div>
            <div className="p-6 space-y-4">
              <Link 
                to="/progress" 
                className="flex items-center p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-800 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">View Detailed Progress</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">See your performance metrics</p>
                </div>
              </Link>

              <Link 
                to="/leaderboard" 
                className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-800 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Leaderboard</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">See how you rank</p>
                </div>
              </Link>

              {/* Progress Report */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                  Download a detailed report of your progress and achievements
                </p>
                {pdfError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 dark:bg-red-900/30 dark:border-red-700 rounded text-sm text-red-600 dark:text-red-300">
                    {pdfError}
                  </div>
                )}
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF || !progressData}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {downloadingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download PDF Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Data Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1 mr-4 text-blue-600 dark:text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Privacy & Data Control</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  Your privacy is important to us. Control how your data is used and who can see your progress.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowPrivacySettings(true)}
                    className="px-3 py-1.5 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    Privacy Settings
                  </button>
                  <button
                    onClick={() => setShowDataExport(true)}
                    className="px-3 py-1.5 bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 border border-green-200 dark:border-gray-600 rounded-lg hover:bg-green-50 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1 mr-4 text-yellow-600 dark:text-yellow-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Admin Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Manage users, cases, and system settings
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Link 
                to="/admin" 
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors inline-block text-sm"
              >
                Access Admin Panel
              </Link>
            </div>
          </div>
        </div>
      )}

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