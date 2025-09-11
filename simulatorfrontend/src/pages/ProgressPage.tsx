import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/apiService';
import { formatDate, formatScore, getPerformanceColor } from '../utils/helpers';
import { ClinicianProgressResponse } from '../types';
import { RetakeHistory } from '../components/retake';

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
    
    caseRetakeMap.forEach((attempts, caseId) => {
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Progress</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchProgressData}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const progressLevel = getProgressLevel(progressData?.overallAverageScore || 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
          <p className="text-gray-600">Track your learning journey and performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF || !progressData}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {downloadingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating PDF...</span>
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

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl shadow-md border border-blue-200 hover:shadow-lg transition-all duration-300">
          <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
            {progressData?.totalCasesCompleted || 0}
          </div>
          <div className="text-xs sm:text-sm text-blue-700 font-medium">Cases Completed</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl shadow-md border border-green-200 hover:shadow-lg transition-all duration-300">
          <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
            {progressData?.totalCasesAttempted || 0}
          </div>
          <div className="text-xs sm:text-sm text-green-700 font-medium">Cases Attempted</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl shadow-md border border-purple-200 hover:shadow-lg transition-all duration-300">
          <div className={`text-xl sm:text-2xl font-bold mb-1 ${getPerformanceColor(progressData?.overallAverageScore || 0)}`}>
            {formatScore(progressData?.overallAverageScore || 0)}
          </div>
          <div className="text-xs sm:text-sm text-purple-700 font-medium">Average Score</div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 sm:p-6 rounded-xl shadow-md border border-indigo-200 hover:shadow-lg transition-all duration-300">
          <div className="text-xl sm:text-2xl font-bold text-indigo-600 mb-1">
            {progressData?.recentPerformance?.length || 0}
          </div>
          <div className="text-xs sm:text-sm text-indigo-700 font-medium">Recent Cases</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-6 rounded-xl shadow-md border border-orange-200 hover:shadow-lg transition-all duration-300 col-span-2 sm:col-span-1">
          <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-1">
            {calculateTotalHours()}h
          </div>
          <div className="text-xs sm:text-sm text-orange-700 font-medium">Practice Time</div>
        </div>
      </div>

      {/* Performance Level */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 sm:p-6 rounded-xl shadow-lg border border-blue-200 mb-8">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-blue-900">Performance Level</h2>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className={`px-4 py-2 rounded-full font-semibold text-sm sm:text-base ${progressLevel.color} border-2 border-current`}>
            {progressLevel.level}
          </div>
          <div className="text-gray-700 text-sm sm:text-base">{progressLevel.description}</div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 sm:mt-6">
          <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
            <span className="font-medium">Progress to Next Level</span>
            <span className="font-bold text-blue-600">{formatScore(progressData?.overallAverageScore || 0)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${Math.min((progressData?.overallAverageScore || 0), 100)}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            {progressData?.overallAverageScore || 0}% of 100%
          </div>
        </div>
      </div>

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
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 sm:p-6 rounded-xl shadow-lg border border-blue-200">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-blue-900">Progress by Specialty</h2>
          
          {progressData?.specialtyProgress && progressData.specialtyProgress.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {progressData.specialtyProgress.map((specialty: { specialty: string; casesCompleted: number; averageScore: number }, index: number) => (
                <div key={index} className="border border-blue-100 rounded-lg p-3 sm:p-4 bg-white/50 hover:bg-white/80 transition-all duration-300">
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
                        specialty.averageScore >= 90 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                        specialty.averageScore >= 70 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                      style={{ width: `${Math.min(specialty.averageScore, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No specialty progress data yet.</p>
              <p className="text-sm mt-2">Complete some cases to see your progress by specialty.</p>
            </div>
          )}
        </div>

        {/* Recent Performance */}
        <div className="bg-gradient-to-br from-green-50 via-white to-green-50 p-4 sm:p-6 rounded-xl shadow-lg border border-green-200">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-green-900">Recent Performance</h2>
          
          {progressData?.recentPerformance && progressData.recentPerformance.length > 0 ? (
            <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
              {progressData.recentPerformance.slice(0, 8).map((metric: { caseTitle: string; completedAt: Date; score: number }, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-white/60 rounded-lg border border-green-100 hover:bg-white/90 hover:shadow-md transition-all duration-300">
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
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <div className="text-4xl sm:text-6xl mb-2">📊</div>
              <p className="text-sm sm:text-base font-medium">No recent performance data.</p>
              <p className="text-xs sm:text-sm mt-2">Start completing cases to track your performance.</p>
            </div>
          )}
        </div>
      </div>

      {/* Call to Action */}
      {(!progressData?.totalCasesCompleted || progressData.totalCasesCompleted === 0) && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Ready to Start Learning?</h3>
          <p className="text-blue-600 mb-4">
            Complete your first patient case to begin tracking your progress.
          </p>
          <button
            onClick={() => window.location.href = '/simulation'}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Browse Cases
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;