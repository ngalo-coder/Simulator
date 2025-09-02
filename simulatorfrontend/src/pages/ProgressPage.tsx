import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/apiService';
import { formatDate, formatScore, getPerformanceColor } from '../utils/helpers';
import { ClinicianProgressResponse } from '../types';

const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ClinicianProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchProgressData();
  }, [user?.id]);

  const fetchProgressData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError('');
      const data = await api.getUserProgress(user.id);
      setProgressData(data);
    } catch (err) {
      setError('Failed to load progress data');
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
        <p className="text-gray-600">Track your learning journey and performance metrics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {progressData?.totalCasesCompleted || 0}
          </div>
          <div className="text-sm text-gray-600">Cases Completed</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className={`text-2xl font-bold mb-1 ${getPerformanceColor(progressData?.overallAverageScore || 0)}`}>
            {formatScore(progressData?.overallAverageScore || 0)}
          </div>
          <div className="text-sm text-gray-600">Average Score</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {progressData?.recentPerformance?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Recent Cases</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {calculateTotalHours()}h
          </div>
          <div className="text-sm text-gray-600">Practice Time</div>
        </div>
      </div>

      {/* Performance Level */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Performance Level</h2>
        <div className="flex items-center space-x-4">
          <div className={`px-4 py-2 rounded-full font-medium ${progressLevel.color}`}>
            {progressLevel.level}
          </div>
          <div className="text-gray-600">{progressLevel.description}</div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress to Next Level</span>
            <span>{formatScore(progressData?.overallAverageScore || 0)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((progressData?.overallAverageScore || 0), 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Progress by Specialty */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Progress by Specialty</h2>
          
          {progressData?.specialtyProgress && progressData.specialtyProgress.length > 0 ? (
            <div className="space-y-4">
              {progressData.specialtyProgress.map((specialty: { specialty: string; casesCompleted: number; averageScore: number }, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{specialty.specialty}</h3>
                    <span className={`text-sm font-medium ${getPerformanceColor(specialty.averageScore)}`}>
                      {formatScore(specialty.averageScore)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{specialty.casesCompleted} cases completed</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        specialty.averageScore >= 90 ? 'bg-green-500' :
                        specialty.averageScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
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
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Performance</h2>
          
          {progressData?.recentPerformance && progressData.recentPerformance.length > 0 ? (
            <div className="space-y-3">
              {progressData.recentPerformance.slice(0, 8).map((metric: { caseTitle: string; completedAt: Date; score: number }, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {metric.caseTitle || 'Unknown Case'}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {formatDate(metric.completedAt)}
                    </p>
                  </div>
                  <div className={`font-bold text-sm ${getPerformanceColor(metric.score || 0)}`}>
                    {formatScore(metric.score || 0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent performance data.</p>
              <p className="text-sm mt-2">Start completing cases to track your performance.</p>
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