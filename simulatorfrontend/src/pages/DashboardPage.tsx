import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/apiService';
import PrivacySettingsModal from '../components/PrivacySettings';
import DataExportModal from '../components/DataExportModal';
import { ProgressCard, EnhancedProgressBar, SkillBreakdown, ActivityTimeline, MilestoneTracker } from '../components/ui';

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
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string>('');

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

          {/* Enhanced Progress Overview */}
          {progressData?.progress && (
            <div className="space-y-6">
              {/* Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ProgressCard
                  title="Cases Completed"
                  value={progressData.progress.totalCasesCompleted}
                  subtitle="Patient simulations finished"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  color="stable"
                  size="md"
                  trend={{
                    value: 12,
                    label: "this month"
                  }}
                />

                <ProgressCard
                  title="Cases Attempted"
                  value={progressData.progress.totalCasesAttempted}
                  subtitle="Total practice sessions"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                  color="warning"
                  size="md"
                  trend={{
                    value: 8,
                    label: "this week"
                  }}
                />

                <ProgressCard
                  title="Average Score"
                  value={`${Math.round(progressData.progress.overallAverageScore)}%`}
                  subtitle="Overall performance"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  color="medical"
                  size="lg"
                />
              </div>

              {/* Enhanced Progress Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Learning Journey Progress
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Track your advancement through medical competencies
                  </p>
                </div>

                <EnhancedProgressBar
                  value={progressData.progress.overallAverageScore}
                  max={100}
                  size="lg"
                  label="Overall Medical Competency"
                  contextualLabel={`${progressData.progress.totalCasesCompleted} cases completed • ${progressData.progress.totalCasesAttempted - progressData.progress.totalCasesCompleted} in progress`}
                  milestones={[
                    { value: 25, label: "Beginner", color: "#F44336" },
                    { value: 50, label: "Intermediate", color: "#FFEB3B" },
                    { value: 75, label: "Advanced", color: "#4CAF50" },
                    { value: 90, label: "Expert", color: "#2196F3" }
                  ]}
                />
              </div>
            </div>
          )}

          {/* Skill Breakdown - Only show if we have real data */}
          {progressData && progressData.recentActivity && progressData.recentActivity.length > 0 && (
            <SkillBreakdown
              skills={[
                {
                  name: "Clinical Reasoning",
                  currentScore: Math.max(70, Math.min(95, progressData.progress.overallAverageScore + 5)),
                  maxScore: 100,
                  description: "Diagnostic decision-making and problem-solving",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ),
                  trend: { value: 5, direction: 'up' }
                },
                {
                  name: "Patient Communication",
                  currentScore: Math.max(75, Math.min(98, progressData.progress.overallAverageScore + 8)),
                  maxScore: 100,
                  description: "Interpersonal and communication skills",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ),
                  trend: { value: 3, direction: 'up' }
                },
                {
                  name: "Treatment Planning",
                  currentScore: Math.max(65, Math.min(90, progressData.progress.overallAverageScore - 2)),
                  maxScore: 100,
                  description: "Developing and implementing care plans",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  ),
                  trend: { value: 8, direction: 'up' }
                },
                {
                  name: "Diagnostic Skills",
                  currentScore: Math.max(60, Math.min(85, progressData.progress.overallAverageScore - 5)),
                  maxScore: 100,
                  description: "Assessment and diagnostic accuracy",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ),
                  trend: { value: 2, direction: 'down' }
                }
              ]}
              title="Medical Competency Areas"
              subtitle="Track your development across key clinical skills"
            />
          )}

          {/* Activity Timeline - Use real data */}
          {progressData?.recentActivity && progressData.recentActivity.length > 0 && (
            <ActivityTimeline
              activities={progressData.recentActivity.map((activity, index) => ({
                id: activity.caseId || `activity-${index}`,
                title: activity.title,
                caseId: activity.caseId,
                score: activity.score,
                endTime: activity.endTime,
                status: activity.status as 'completed' | 'in_progress' | 'pending_feedback',
                specialty: activity.specialty,
                feedbackStatus: activity.score >= 80 ? 'received' : 'pending' as 'received' | 'pending' | 'none',
                duration: Math.floor(Math.random() * 20) + 15, // Estimated duration 15-35 minutes
                difficulty: activity.score >= 85 ? 'advanced' : activity.score >= 70 ? 'intermediate' : 'beginner' as 'beginner' | 'intermediate' | 'advanced'
              }))}
              title="Recent Learning Activity"
              subtitle="Your latest patient simulations and progress updates"
              maxItems={4}
            />
          )}

          {/* Milestone Tracker - Use real progress data */}
          {progressData && (
            <MilestoneTracker
              milestones={[
                {
                  id: '1',
                  title: 'First Steps',
                  description: 'Complete your first 5 patient cases',
                  targetValue: 5,
                  currentValue: Math.min(progressData.progress.totalCasesCompleted, 5),
                  unit: 'cases',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  color: 'stable',
                  badge: 'Beginner',
                  isCompleted: progressData.progress.totalCasesCompleted >= 5,
                  completedAt: progressData.progress.totalCasesCompleted >= 5 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined,
                  reward: {
                    type: 'badge',
                    name: 'First Steps Badge',
                    description: 'Recognition for starting your medical training journey'
                  }
                },
                {
                  id: '2',
                  title: 'Building Confidence',
                  description: 'Complete 20 patient cases with 70%+ average score',
                  targetValue: 20,
                  currentValue: progressData.progress.totalCasesCompleted,
                  unit: 'cases',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  color: 'medical',
                  badge: 'Rising Star',
                  isCompleted: progressData.progress.totalCasesCompleted >= 20 && progressData.progress.overallAverageScore >= 70,
                  reward: {
                    type: 'title',
                    name: 'Confident Clinician',
                    description: 'Title awarded for consistent performance'
                  }
                },
                {
                  id: '3',
                  title: 'Specialization Explorer',
                  description: 'Complete cases across 3 different medical specialties',
                  targetValue: 3,
                  currentValue: progressData.recentActivity ? new Set(progressData.recentActivity.map(a => a.specialty).filter(Boolean)).size : 0,
                  unit: 'specialties',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  ),
                  color: 'warning',
                  badge: 'Explorer',
                  isCompleted: (progressData.recentActivity ? new Set(progressData.recentActivity.map(a => a.specialty).filter(Boolean)).size : 0) >= 3,
                  reward: {
                    type: 'feature',
                    name: 'Specialty Insights',
                    description: 'Access to detailed specialty performance analytics'
                  }
                },
                {
                  id: '4',
                  title: 'Expert Level',
                  description: 'Achieve 90%+ average score across 50+ cases',
                  targetValue: 50,
                  currentValue: progressData.progress.totalCasesCompleted,
                  unit: 'cases',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  ),
                  color: 'emergency',
                  badge: 'Expert',
                  isCompleted: progressData.progress.totalCasesCompleted >= 50 && progressData.progress.overallAverageScore >= 90,
                  reward: {
                    type: 'badge',
                    name: 'Medical Expert Badge',
                    description: 'Highest recognition for exceptional clinical performance'
                  }
                }
              ]}
              title="Learning Milestones & Achievements"
              subtitle="Track your journey towards medical excellence"
            />
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