import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/apiService';
import { formatDate, formatScore, getPerformanceColor } from '../utils/helpers';
import { ClinicianProgressResponse } from '../types';
import { Button, Card, Loading, Alert, EnhancedProgressBar } from '../components/ui';

const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ClinicianProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [retakeStats, setRetakeStats] = useState<any>(null);
  const [showRetakeDetails, setShowRetakeDetails] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    fetchProgressData();
  }, [user?.id]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch progress data and retake statistics in parallel
      const [progressResponse, performanceData] = await Promise.all([
        api.getUserProgress(),
        api.getPerformanceSummary(user?.id || '').catch(() => null)
      ]);
      
      setProgressData(progressResponse);
      
      // Calculate retake statistics from performance data
      if (performanceData?.recentMetrics) {
        const retakeMetrics = calculateRetakeStats(performanceData.recentMetrics);
        setRetakeStats(retakeMetrics);
      }
    } catch (err) {
      setError('Failed to load progress data');
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateRetakeStats = (metrics: any[]) => {
    const caseRetakeMap = new Map();
    
    // Group metrics by case ID to identify retakes
    metrics.forEach(metric => {
      const caseId = metric.caseId;
      if (!caseRetakeMap.has(caseId)) {
        caseRetakeMap.set(caseId, []);
      }
      caseRetakeMap.get(caseId).push(metric);
    });
    
    let totalRetakes = 0;
    let improvedCases = 0;
    let averageImprovement = 0;
    let totalImprovementSum = 0;
    let casesWithMultipleAttempts = 0;
    
    caseRetakeMap.forEach((attempts) => {
      if (attempts.length > 1) {
        casesWithMultipleAttempts++;
        totalRetakes += attempts.length - 1;
        
        // Sort attempts by date to get chronological order
        attempts.sort((a: any, b: any) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
        
        const firstAttempt = attempts[0];
        const lastAttempt = attempts[attempts.length - 1];
        
        if (lastAttempt.score > firstAttempt.score) {
          improvedCases++;
          const improvement = lastAttempt.score - firstAttempt.score;
          totalImprovementSum += improvement;
        }
      }
    });
    
    if (improvedCases > 0) {
      averageImprovement = totalImprovementSum / improvedCases;
    }
    
    return {
      totalRetakes,
      casesWithMultipleAttempts,
      improvedCases,
      averageImprovement: Math.round(averageImprovement * 100) / 100,
      improvementRate: casesWithMultipleAttempts > 0 ? Math.round((improvedCases / casesWithMultipleAttempts) * 100) : 0
    };
  };

  const getProgressLevel = (score: number): { level: string; color: string; description: string } => {
    if (score >= 90) return { 
      level: 'Expert', 
      color: 'text-green-600 bg-green-100', 
      description: 'Excellent performance across cases' 
    };
    if (score >= 80) return { 
      level: 'Advanced', 
      color: 'text-blue-600 bg-blue-100', 
      description: 'Strong clinical reasoning skills' 
    };
    if (score >= 70) return { 
      level: 'Intermediate', 
      color: 'text-yellow-600 bg-yellow-100', 
      description: 'Good progress, room for improvement' 
    };
    if (score >= 60) return { 
      level: 'Developing', 
      color: 'text-orange-600 bg-orange-100', 
      description: 'Building foundational skills' 
    };
    return { 
      level: 'Beginner', 
      color: 'text-red-600 bg-red-100', 
      description: 'Starting your learning journey' 
    };
  };

  const calculateTotalHours = (): number => {
    // Estimate 20 minutes per case on average
    return Math.round((progressData?.totalCasesCompleted || 0) * 20 / 60 * 10) / 10;
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      await api.downloadProgressPDF();
      // Success feedback could be added here if needed
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download progress report. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-stable-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <Loading size="lg" variant="medical" />
            <p className="text-gray-600 mt-4 text-lg">Loading your medical training progress...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-stable-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="error" className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-2">Error Loading Progress Data</h2>
            <p className="mb-4">{error}</p>
            <Button
              variant="secondary"
              onClick={fetchProgressData}
            >
              Try Again
            </Button>
          </Alert>
        </div>
      </div>
    );
  }

  const progressLevel = getProgressLevel(progressData?.overallAverageScore || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-stable-50">
      {/* Medical Progress Header */}
      <div className="bg-gradient-medical text-white shadow-medical-lg border-b border-medical-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Medical Training Progress</h1>
                <p className="text-medical-100 text-sm lg:text-base">
                  Advanced Analytics & Performance Tracking
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloadingPDF || !progressData}
                className="text-white hover:bg-white/10"
              >
                {downloadingPDF ? (
                  <>
                    <Loading size="xs" variant="spinner" />
                    <span className="ml-2">Generating Report...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Medical Performance Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-medical-50 to-medical-100 border-l-4 border-l-medical-500 hover-lift">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-medical-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-medical-700 mb-1">
                {progressData?.totalCasesCompleted || 0}
              </div>
              <div className="text-sm text-medical-600 font-medium">Cases Completed</div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-stable-50 to-stable-100 border-l-4 border-l-stable-500 hover-lift">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-stable-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-stable-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-stable-700 mb-1">
                {progressData?.totalCasesAttempted || 0}
              </div>
              <div className="text-sm text-stable-600 font-medium">Cases Attempted</div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-warning-50 to-warning-100 border-l-4 border-l-warning-500 hover-lift">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className={`text-2xl font-bold mb-1 ${getPerformanceColor(progressData?.overallAverageScore || 0)}`}>
                {formatScore(progressData?.overallAverageScore || 0)}
              </div>
              <div className="text-sm text-warning-600 font-medium">Average Score</div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-info-50 to-info-100 border-l-4 border-l-info-500 hover-lift">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-info-700 mb-1">
                {progressData?.recentPerformance?.length || 0}
              </div>
              <div className="text-sm text-info-600 font-medium">Recent Activity</div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-emergency-50 to-emergency-100 border-l-4 border-l-emergency-500 hover-lift col-span-2 md:col-span-1">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-emergency-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emergency-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-emergency-700 mb-1">
                {calculateTotalHours()}h
              </div>
              <div className="text-sm text-emergency-600 font-medium">Training Time</div>
            </div>
          </Card>
        </div>

      {/* Performance Level */}
      <Card variant="elevated" padding="md" className="bg-gradient-to-br from-medical-50 via-white to-medical-50 border-medical-200 mb-8">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-medical-900">Performance Level</h2>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className={`px-4 py-2 rounded-full font-semibold text-sm sm:text-base ${progressLevel.color} border-2 border-current`}>
            {progressLevel.level}
          </div>
          <div className="text-gray-700 text-sm sm:text-base">{progressLevel.description}</div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mt-4 sm:mt-6">
          <EnhancedProgressBar
            value={progressData?.overallAverageScore || 0}
            max={100}
            size="md"
            label="Progress to Next Level"
            contextualLabel={`${progressLevel.level} • ${progressLevel.description}`}
            milestones={[
              { value: 60, label: "Developing", color: "#FF6B35" },
              { value: 70, label: "Intermediate", color: "#FFEB3B" },
              { value: 80, label: "Advanced", color: "#2196F3" },
              { value: 90, label: "Expert", color: "#4CAF50" }
            ]}
          />
        </div>
      </Card>

      {/* Retake Performance Analysis */}
      {retakeStats && (retakeStats.totalRetakes > 0 || retakeStats.casesWithMultipleAttempts > 0) && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Improvement Through Retakes</h2>
            <button
              onClick={() => setShowRetakeDetails(!showRetakeDetails)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showRetakeDetails ? 'Hide Details' : 'View Details'}
            </button>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {retakeStats.totalRetakes}
              </div>
              <div className="text-sm text-gray-600">Total Retakes</div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {retakeStats.casesWithMultipleAttempts}
              </div>
              <div className="text-sm text-gray-600">Cases Retaken</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {retakeStats.improvementRate}%
              </div>
              <div className="text-sm text-gray-600">Improvement Rate</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                +{retakeStats.averageImprovement}%
              </div>
              <div className="text-sm text-gray-600">Avg Improvement</div>
            </div>
          </div>
          
          {retakeStats.improvementRate > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-lg">🎯</span>
                <div>
                  <h3 className="font-medium text-green-800">Great progress!</h3>
                  <p className="text-sm text-green-600">
                    You improved your performance in {retakeStats.improvedCases} out of {retakeStats.casesWithMultipleAttempts} retaken cases.
                    {retakeStats.averageImprovement > 10 && ' Your average improvement of ' + retakeStats.averageImprovement + '% shows excellent learning progress!'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {showRetakeDetails && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium mb-4">Retake History</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">💡 Retake Tips</h4>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• Review your evaluation feedback before retaking a case</li>
                    <li>• Focus on specific areas for improvement identified in your previous attempt</li>
                    <li>• Use the retake feature to practice cases where you scored below 80%</li>
                    <li>• Track your improvement over multiple attempts to see your learning progress</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Progress by Specialty */}
        <Card variant="elevated" padding="md" className="bg-gradient-to-br from-medical-50 via-white to-medical-50 border-medical-200">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-medical-900">Progress by Specialty</h2>

          {progressData?.specialtyProgress && progressData.specialtyProgress.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {progressData.specialtyProgress.map((specialty: { specialty: string; casesCompleted: number; averageScore: number }) => (
                <Card variant="default" padding="sm" className="border-medical-100 bg-white/50 hover:bg-white/80 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-1 sm:space-y-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{specialty.specialty}</h3>
                    <span className={`text-sm font-bold px-2 py-1 rounded-full bg-opacity-20 ${getPerformanceColor(specialty.averageScore)}`}>
                      {formatScore(specialty.averageScore)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-3">
                    <span className="font-medium">{specialty.casesCompleted} cases completed</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 shadow-inner">
                    <div
                      className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${
                        specialty.averageScore >= 90 ? 'bg-gradient-to-r from-stable-400 to-stable-500' :
                        specialty.averageScore >= 70 ? 'bg-gradient-to-r from-warning-400 to-warning-500' : 'bg-gradient-to-r from-emergency-400 to-emergency-500'
                      }`}
                      style={{ width: `${Math.min(specialty.averageScore, 100)}%` }}
                    ></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No specialty progress data yet.</p>
              <p className="text-sm mt-2">Complete some cases to see your progress by specialty.</p>
            </div>
          )}
        </Card>

        {/* Recent Performance */}
        <Card variant="elevated" padding="md" className="bg-gradient-to-br from-stable-50 via-white to-stable-50 border-stable-200">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-stable-900">Recent Performance</h2>

          {progressData?.recentPerformance && progressData.recentPerformance.length > 0 ? (
            <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
              {progressData.recentPerformance.slice(0, 8).map((metric: { caseTitle: string; completedAt: Date; score: number }) => (
                <Card variant="default" padding="sm" className="bg-white/60 border-stable-100 hover:bg-white/90 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                        {metric.caseTitle || 'Unknown Case'}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {formatDate(metric.completedAt)}
                      </p>
                    </div>
                    <div className={`font-bold text-sm flex-shrink-0 px-2 py-1 rounded-full ${getPerformanceColor(metric.score || 0)} bg-opacity-20`}>
                      {formatScore(metric.score || 0)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <div className="text-4xl sm:text-6xl mb-2">📊</div>
              <p className="text-sm sm:text-base font-medium">No recent performance data.</p>
              <p className="text-xs sm:text-sm mt-2">Start completing cases to track your performance.</p>
            </div>
          )}
        </Card>
      </div>

        {/* Call to Action */}
        {(!progressData?.totalCasesCompleted || progressData.totalCasesCompleted === 0) && (
          <Card variant="elevated" padding="lg" className="mt-8 border-l-4 border-l-medical-500 bg-gradient-to-r from-medical-50 to-white">
            <div className="text-center">
              <div className="w-16 h-16 bg-medical-100 rounded-medical-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Start Your Medical Training?</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Complete your first patient case to begin tracking your progress and unlock advanced analytics.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.location.href = '/simulation'}
                className="hover-lift"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Browse Patient Cases
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;