import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/apiService';
import { specialtyToSlug } from '../utils/urlUtils';
import PrivacySettingsModal from '../components/PrivacySettings';
import DataExportModal from '../components/DataExportModal';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyCounts, setSpecialtyCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const progressData = await api.getUserProgress();
        // Transform progress data to match dashboard structure
        const dashboardData = {
          progress: {
            totalCasesCompleted: progressData.totalCasesCompleted,
            totalCasesAttempted: progressData.totalCasesAttempted,
            overallAverageScore: progressData.overallAverageScore
          },
          recentActivity: progressData.recentPerformance?.map((perf: { caseTitle: string; caseId: string; score: number; completedAt: Date }) => ({
            title: perf.caseTitle,
            caseId: perf.caseId,
            score: perf.score,
            endTime: perf.completedAt,
            status: 'completed'
          })) || []
        };
        setProgressData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSpecialties = async () => {
      try {
        const categoriesData = await api.getCaseCategories();
        setSpecialties(categoriesData.specialties || []);
        setSpecialtyCounts(categoriesData.specialty_counts || {});
      } catch (error) {
        console.error('Error fetching specialties:', error);
      }
    };

    fetchDashboardData();
    fetchSpecialties();
  }, [user?.id]);

  const handleSpecialtyNavigation = (specialty: string) => {
    // Clear any existing specialty context
    api.clearSpecialtyContext();
    
    // Navigate to specialty-specific route
    const slug = specialtyToSlug(specialty);
    navigate(`/${slug}`);
  };

  const handleViewAllCases = () => {
    // Check if there's a current specialty context
    const context = api.getSpecialtyContext();
    if (context) {
      // Navigate to the specialty-specific route
      const slug = specialtyToSlug(context.specialty);
      navigate(`/${slug}`);
    } else {
      // Navigate to generic simulation page
      navigate('/simulation');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600">
          Continue your medical training with patient simulations
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Start New Case</h3>
          <p className="text-gray-600 mb-4">
            Browse available patient cases by program area and specialty
          </p>
          <div className="space-y-2">
            <Link 
              to="/browse-cases" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors inline-block w-full text-center"
            >
              Browse Cases
            </Link>
            <button
              onClick={handleViewAllCases}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors w-full text-sm"
            >
              {(() => {
                const context = api.getSpecialtyContext();
                return context ? `View ${context.specialty} Cases` : 'View All Cases';
              })()}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">My Progress</h3>
          <p className="text-gray-600 mb-4">
            View your performance metrics and learning progress
          </p>
          <Link 
            to="/progress" 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors inline-block"
          >
            View Progress
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Leaderboard</h3>
          <p className="text-gray-600 mb-4">
            See how you rank among other learners
          </p>
          <Link 
            to="/leaderboard" 
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors inline-block"
          >
            View Rankings
          </Link>
        </div>
      </div>

      {/* Quick Access to Specialties */}
      {specialties.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Quick Access by Specialty</h3>
          <p className="text-gray-600 mb-4">
            Jump directly to cases in your preferred medical specialties
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {specialties.slice(0, 8).map((specialty) => {
              const caseCount = specialtyCounts[specialty] || 0;
              
              return (
                <button
                  key={specialty}
                  onClick={() => handleSpecialtyNavigation(specialty)}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  disabled={caseCount === 0}
                >
                  <div className="font-medium text-sm text-gray-900 mb-1">
                    {specialty}
                  </div>
                  <div className="text-xs text-gray-500">
                    {caseCount} case{caseCount !== 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </div>
          {specialties.length > 8 && (
            <div className="mt-4 text-center">
              <Link 
                to="/browse-cases"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all {specialties.length} specialties →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading your progress...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progressData?.progress?.totalCasesCompleted || 0}
              </div>
              <div className="text-sm text-gray-600">Cases Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progressData?.progress?.overallAverageScore ? `${Math.round(progressData.progress.overallAverageScore)}%` : '0%'}
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progressData?.recentActivity?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Recent Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {progressData?.progress?.totalCasesAttempted || 0}
              </div>
              <div className="text-sm text-gray-600">Total Cases Attempted</div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      {progressData?.recentActivity && progressData.recentActivity.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {progressData.recentActivity.slice(0, 5).map((activity: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <h4 className="font-medium">{activity.title || 'Unknown Case'}</h4>
                  {activity.caseId && (
                    <button
                      onClick={() => handleSpecialtyNavigation(activity.specialty || 'medicine')}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {activity.specialty || 'General Medicine'}
                    </button>
                  )}
                  <p className="text-sm text-gray-600">
                    {activity.status === 'completed' ? 'Completed' : 'Attempted'} on {new Date(activity.endTime || activity.startTime).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${activity.score >= 90 ? 'text-green-600' : activity.score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {Math.round(activity.score || 0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Progress Summary */}
      {progressData?.progress && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900">Total Cases Completed</h4>
              <div className="mt-2 text-2xl font-bold text-blue-600">
                {progressData.progress.totalCasesCompleted}
              </div>
              <p className="text-sm text-gray-600 mt-1">Cases across all specialties</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900">Total Cases Attempted</h4>
              <div className="mt-2 text-2xl font-bold text-orange-600">
                {progressData.progress.totalCasesAttempted}
              </div>
              <p className="text-sm text-gray-600 mt-1">All case attempts</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900">Overall Average Score</h4>
              <div className="mt-2 text-2xl font-bold text-green-600">
                {Math.round(progressData.progress.overallAverageScore)}%
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${progressData.progress.overallAverageScore >= 90 ? 'bg-green-500' : progressData.progress.overallAverageScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(progressData.progress.overallAverageScore, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Data Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <span className="mr-2">🔒</span>
          Privacy & Data Control
        </h3>
        <p className="text-gray-700 mb-4">
          Your privacy is important to us. Control how your data is used and who can see your progress.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPrivacySettings(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Privacy Settings
          </button>
          <button
            onClick={() => setShowDataExport(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Export My Data
          </button>
          <Link 
            to="/leaderboard" 
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors inline-block"
          >
            Leaderboard Settings
          </Link>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Admin Actions</h3>
          <Link 
            to="/admin" 
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors inline-block"
          >
            Admin Dashboard
          </Link>
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showPrivacySettings && (
        <PrivacySettingsModal onClose={() => setShowPrivacySettings(false)} />
      )}

      {/* Data Export Modal */}
      {showDataExport && (
        <DataExportModal onClose={() => setShowDataExport(false)} />
      )}
    </div>
  );
};

export default DashboardPage;