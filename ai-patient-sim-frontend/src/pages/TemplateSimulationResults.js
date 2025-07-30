// ai-patient-sim-frontend/src/pages/TemplateSimulationResults.js
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  MessageCircle,
  Award,
  BookOpen,
  ArrowLeft,
  RotateCcw,
  Home,
  Target,
  Lightbulb,
  Star
} from 'lucide-react';

const TemplateSimulationResults = () => {
  // const { id } = useParams(); // Commented out unused variable
  const location = useLocation();
  const navigate = useNavigate();
  
  const { evaluation, sessionSummary } = location.state || {};

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Not Available</h2>
          <p className="text-gray-600 mb-4">Unable to load simulation results.</p>
          <button
            onClick={() => navigate('/template-cases')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Browse More Cases
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPerformanceLevel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Satisfactory';
    return 'Needs Improvement';
  };

  const getPerformanceIcon = (score) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <Star className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/template-cases')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Cases</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Simulation Results</h1>
                <p className="text-gray-600">{evaluation.caseInfo?.title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(evaluation.overallScore)} mb-4`}>
                  <span className={`text-3xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                    {evaluation.overallScore}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {getPerformanceLevel(evaluation.overallScore)}
                </h2>
                <p className="text-gray-600">
                  Overall Performance Score
                </p>
              </div>
            </div>

            {/* Detailed Evaluation */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Detailed Assessment</span>
              </h3>
              
              <div className="space-y-4">
                {Object.entries(evaluation.criteriaEvaluation).map(([criterion, data]) => (
                  <div key={criterion} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getPerformanceIcon(data.score)}
                        <h4 className="font-medium text-gray-900">
                          {criterion.replace(/_/g, ' ')}
                        </h4>
                      </div>
                      <span className={`font-bold ${getScoreColor(data.score)}`}>
                        {data.score}/100
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          data.score >= 80 ? 'bg-green-500' : 
                          data.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${data.score}%` }}
                      ></div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Criteria:</span> {data.description}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Feedback:</span> {data.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {evaluation.recommendations && evaluation.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Recommendations</span>
                </h3>
                <ul className="space-y-3">
                  {evaluation.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <p className="text-gray-700">{recommendation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Duration</span>
                  </div>
                  <span className="font-medium">{sessionSummary?.duration || 0} minutes</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Messages</span>
                  </div>
                  <span className="font-medium">{sessionSummary?.messageCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Actions</span>
                  </div>
                  <span className="font-medium">{sessionSummary?.clinicalActionsCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Case Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Specialty:</span>
                  <p className="text-gray-900">{evaluation.caseInfo?.specialty}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Difficulty:</span>
                  <p className="text-gray-900">{evaluation.caseInfo?.difficulty}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Diagnosis:</span>
                  <p className="text-gray-900 font-medium">{evaluation.caseInfo?.hiddenDiagnosis}</p>
                </div>
              </div>
            </div>

            {/* Strengths */}
            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Strengths</span>
                </h3>
                <ul className="space-y-2">
                  {evaluation.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-800">
                        {strength.area} ({strength.score}/100)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvement Areas */}
            {evaluation.improvementAreas && evaluation.improvementAreas.length > 0 && (
              <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Areas for Improvement</span>
                </h3>
                <ul className="space-y-3">
                  {evaluation.improvementAreas.map((area, index) => (
                    <li key={index} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-yellow-800">
                          {area.area} ({area.score}/100)
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 ml-6">
                        {area.suggestion}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/template-cases')}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Try Another Case</span>
                </button>
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSimulationResults;