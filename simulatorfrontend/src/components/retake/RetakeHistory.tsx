import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiService';

interface RetakeSession {
  sessionId: string;
  attemptNumber: number;
  retakeReason: string;
  improvementFocusAreas: string[];
  completedAt: string;
  score?: number;
  status: 'completed' | 'in_progress' | 'abandoned';
}

interface RetakeHistoryProps {
  caseId: string;
  className?: string;
}

const RetakeHistory: React.FC<RetakeHistoryProps> = ({
  caseId,
  className = ''
}) => {
  const [sessions, setSessions] = useState<RetakeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);

  useEffect(() => {
    fetchRetakeSessions();
  }, [caseId]);

  const fetchRetakeSessions = async () => {
    try {
      setLoading(true);
      const response = await api.getCaseRetakeSessions(caseId);
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Error fetching retake sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowComparison = async () => {
    if (sessions.length < 2) return;

    try {
      const firstSession = sessions[0];
      const lastSession = sessions[sessions.length - 1];
      
      const comparison = await api.calculateImprovementMetrics(
        firstSession.sessionId,
        lastSession.sessionId
      );
      setComparisonData(comparison);
      setShowComparison(true);
    } catch (error) {
      console.error('Error calculating improvement:', error);
      alert('Failed to calculate improvement metrics');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300', text: 'Completed', icon: '✓' },
      in_progress: { color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300', text: 'In Progress', icon: '🔄' },
      abandoned: { color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300', text: 'Abandoned', icon: '⏸️' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.abandoned;
    
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-bold rounded-full border ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-700 bg-green-100 border-green-300';
    if (score >= 80) return 'text-blue-700 bg-blue-100 border-blue-300';
    if (score >= 70) return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    return 'text-red-700 bg-red-100 border-red-300';
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 text-center text-gray-500 ${className}`}>
        <p className="text-sm">No retake history for this case</p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 via-white to-blue-50 border-2 border-blue-200 rounded-xl shadow-lg ${className}`}>
      <div className="p-4 sm:p-6 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h4 className="font-bold text-blue-900 flex items-center space-x-2">
              <span>📈</span>
              <span>Retake History</span>
            </h4>
            <p className="text-sm text-blue-700 font-medium">{sessions.length} attempt(s)</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {sessions.length >= 2 && (
              <button
                onClick={handleShowComparison}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center space-x-2"
              >
                <span>📊</span>
                <span>View Progress</span>
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-4 py-2 bg-white text-blue-700 border-2 border-blue-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              {expanded ? 'Show Less' : 'Show All'}
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-blue-100">
        {(expanded ? sessions : sessions.slice(0, 3)).map((session) => (
          <div key={session.sessionId} className="p-4 sm:p-6 hover:bg-blue-50/50 transition-all duration-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="font-bold text-blue-900 text-lg">
                    Attempt #{session.attemptNumber}
                  </span>
                  {getStatusBadge(session.status)}
                  {session.score !== undefined && (
                    <span className={`font-bold text-sm px-3 py-1 rounded-full border ${getScoreColor(session.score)}`}>
                      {session.score}% Score
                    </span>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <h5 className="font-semibold text-blue-800 text-sm mb-1">Reason for Retake:</h5>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    {session.retakeReason}
                  </p>
                </div>
                
                {session.improvementFocusAreas.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-semibold text-gray-800 text-sm mb-2">Focus Areas:</h5>
                    <div className="flex flex-wrap gap-2">
                      {session.improvementFocusAreas.map((area) => (
                        <span
                          key={area}
                          className="px-3 py-1 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 text-xs font-semibold rounded-full border border-orange-300"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-600 font-medium flex items-center space-x-1">
                  <span>🗓️</span>
                  <span>{formatDate(session.completedAt)}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!expanded && sessions.length > 3 && (
        <div className="p-3 text-center border-t border-gray-100">
          <button
            onClick={() => setExpanded(true)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Show {sessions.length - 3} more attempt(s)
          </button>
        </div>
      )}

      {/* Progress Comparison Modal */}
      {showComparison && comparisonData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Progress Analysis
              </h3>
              <button
                onClick={() => setShowComparison(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Score Progression</h4>
                <div className="grid grid-cols-2 gap-4">
                  {comparisonData.scoreProgression?.map((score: any) => (
                    <div key={score.attempt} className="text-center">
                      <div className="text-lg font-bold text-blue-700">{score.score}%</div>
                      <div className="text-sm text-blue-600">Attempt #{score.attempt}</div>
                    </div>
                  ))}
                </div>
              </div>

              {comparisonData.areaImprovements?.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Improved Areas</h4>
                  <div className="space-y-2">
                    {comparisonData.areaImprovements.map((improvement: any) => (
                      <div key={improvement.area} className="flex justify-between text-sm">
                        <span className="text-green-700">{improvement.area}</span>
                        <span className="text-green-600 font-medium">
                          {improvement.firstAttempt} → {improvement.lastAttempt}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  comparisonData.overallTrend === 'improving' 
                    ? 'bg-green-100 text-green-800' 
                    : comparisonData.overallTrend === 'declining'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  Overall Trend: {comparisonData.overallTrend}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowComparison(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetakeHistory;