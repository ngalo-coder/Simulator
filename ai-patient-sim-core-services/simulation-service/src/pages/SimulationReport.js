// Create: simulation-service/src/pages/SimulationReport.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { simulationAPI } from '../utils/simulationApi';
import { 
  Award, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageCircle,
  Brain,
  Heart,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  DownloadIcon,
  PrinterIcon,
  ArrowLeft,
  Star,
  AlertTriangle,
  Users,
  Activity,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

const SimulationReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [report, setReport] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await simulationAPI.getSimulationReport(id);
      if (response.success) {
        setReport(response.report);
        // Also fetch basic simulation data
        const simResponse = await simulationAPI.getSimulation(id);
        if (simResponse.success) {
          setSimulation(simResponse.simulation);
        }
      } else {
        toast.error('Failed to load simulation report');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load simulation report');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeFromScore = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real implementation, this would generate a PDF
    toast.success('Download feature coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your simulation report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Report Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'clinical', label: 'Clinical Analysis', icon: Brain },
    { id: 'communication', label: 'Communication', icon: MessageCircle },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'recommendations', label: 'Next Steps', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 print:hidden"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Simulation Report</h1>
                <p className="text-gray-600">{report.overview.scenarioDetails.caseName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Score Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white print:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {getGradeFromScore(report.performanceMetrics.overallScore)}
              </div>
              <div className="text-xl opacity-90">Overall Grade</div>
              <div className="text-sm opacity-75">{report.performanceMetrics.overallScore}%</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {report.performanceMetrics.completionRate}%
              </div>
              <div className="text-lg opacity-90">Task Completion</div>
              <div className="text-sm opacity-75">
                {report.performanceMetrics.criticalActions.completed.length}/
                {report.performanceMetrics.criticalActions.expected.length} actions
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {formatDuration(report.overview.sessionInfo.totalDuration.replace(' minutes', ''))}
              </div>
              <div className="text-lg opacity-90">Duration</div>
              <div className="text-sm opacity-75">Session time</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {report.performanceMetrics.scores.communication}%
              </div>
              <div className="text-lg opacity-90">Communication</div>
              <div className="text-sm opacity-75">Patient interaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Scenario Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Scenario Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Case Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Patient:</span> {report.overview.scenarioDetails.patientName}, {report.overview.scenarioDetails.patientAge}</p>
                    <p><span className="font-medium">Chief Complaint:</span> {report.overview.scenarioDetails.chiefComplaint}</p>
                    <p><span className="font-medium">Condition:</span> {report.overview.scenarioDetails.condition}</p>
                    <p><span className="font-medium">Specialty:</span> {report.overview.scenarioDetails.specialty}</p>
                    <p><span className="font-medium">Difficulty:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        report.overview.difficultyLevel === 'student' ? 'bg-green-100 text-green-800' :
                        report.overview.difficultyLevel === 'resident' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {report.overview.difficultyLevel.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Learning Objectives</h3>
                  <ul className="space-y-1 text-sm">
                    {report.overview.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Clinical Reasoning</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {report.performanceMetrics.scores.clinicalReasoning}%
                    </p>
                  </div>
                  <Brain className={`h-8 w-8 ${getScoreColor(report.performanceMetrics.scores.clinicalReasoning).split(' ')[0]}`} />
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    {report.performanceMetrics.scores.clinicalReasoning >= 75 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className="text-sm text-gray-600">
                      Grade: {getGradeFromScore(report.performanceMetrics.scores.clinicalReasoning)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Communication</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {report.performanceMetrics.scores.communication}%
                    </p>
                  </div>
                  <MessageCircle className={`h-8 w-8 ${getScoreColor(report.performanceMetrics.scores.communication).split(' ')[0]}`} />
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    {report.performanceMetrics.scores.communication >= 75 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className="text-sm text-gray-600">
                      Grade: {getGradeFromScore(report.performanceMetrics.scores.communication)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Diagnostic Accuracy</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {report.performanceMetrics.scores.diagnosticAccuracy}%
                    </p>
                  </div>
                  <Target className={`h-8 w-8 ${getScoreColor(report.performanceMetrics.scores.diagnosticAccuracy).split(' ')[0]}`} />
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    {report.performanceMetrics.scores.diagnosticAccuracy >= 75 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className="text-sm text-gray-600">
                      Grade: {getGradeFromScore(report.performanceMetrics.scores.diagnosticAccuracy)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Critical Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Critical Actions Review</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-green-700 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Completed Actions ({report.performanceMetrics.criticalActions.completed.length})
                  </h3>
                  <ul className="space-y-2">
                    {report.performanceMetrics.criticalActions.completed.map((action, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {action.replace('_', ' ').toUpperCase()}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-red-700 mb-3 flex items-center">
                    <XCircle className="h-5 w-5 mr-2" />
                    Missed Actions ({report.performanceMetrics.criticalActions.missed.length})
                  </h3>
                  <ul className="space-y-2">
                    {report.performanceMetrics.criticalActions.missed.map((action, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        {action.replace('_', ' ').toUpperCase()}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Efficiency Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Efficiency</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {report.performanceMetrics.efficiency.messagesExchanged}
                  </div>
                  <div className="text-sm text-gray-600">Messages Exchanged</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {report.performanceMetrics.efficiency.clinicalActionsPerformed}
                  </div>
                  <div className="text-sm text-gray-600">Clinical Actions</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {report.performanceMetrics.efficiency.averageTimePerAction}m
                  </div>
                  <div className="text-sm text-gray-600">Avg Time/Action</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clinical Analysis Tab */}
        {activeTab === 'clinical' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Clinical Decision-Making Analysis</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-green-700 mb-3 flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {report.clinicalAnalysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-yellow-700 mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {report.clinicalAnalysis.areasForImprovement.map((improvement, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {report.clinicalAnalysis.alternativeApproaches.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-700 mb-3">Alternative Approaches</h3>
                  <ul className="space-y-2">
                    {report.clinicalAnalysis.alternativeApproaches.map((approach, index) => (
                      <li key={index} className="text-sm text-blue-700">
                        • {approach}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Sequence */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Clinical Action Sequence</h2>
              <div className="flex flex-wrap gap-2">
                {report.clinicalAnalysis.actionSequence.map((action, index) => (
                  <div key={index} className="flex items-center">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {index + 1}. {action.replace('_', ' ').toUpperCase()}
                    </span>
                    {index < report.clinicalAnalysis.actionSequence.length - 1 && (
                      <span className="mx-2 text-gray-400">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Communication Tab */}
        {activeTab === 'communication' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Communication Assessment</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <Heart className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-pink-600">
                    {report.communicationAssessment.patientInteraction.empathy}%
                  </div>
                  <div className="text-sm text-gray-600">Empathy</div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {report.communicationAssessment.patientInteraction.clarity}%
                  </div>
                  <div className="text-sm text-gray-600">Clarity</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {report.communicationAssessment.patientInteraction.professionalism}%
                  </div>
                  <div className="text-sm text-gray-600">Professionalism</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-green-700 mb-3">Communication Strengths</h3>
                  <ul className="space-y-2">
                    {report.communicationAssessment.communicationStrengths.map((strength, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-yellow-700 mb-3">Areas to Improve</h3>
                  <ul className="space-y-2">
                    {report.communicationAssessment.communicationImprovements.map((improvement, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Timeline</h2>
              <div className="space-y-4">
                {report.timelineAnalysis.timeline.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-16 text-sm text-gray-500 font-medium">
                      {item.relativeTime}m
                    </div>
                    <div className="flex-shrink-0 mr-4">
                      {item.type === 'clinical_action' ? (
                        <Activity className="h-5 w-5 text-blue-600" />
                      ) : (
                        <MessageCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.significance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personalized Learning Plan</h2>
              
              <div className="space-y-6">
                {report.recommendations.personalizedLearningPlan.map((plan, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{plan.area}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.priority === 'High' ? 'bg-red-100 text-red-800' :
                        plan.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {plan.priority} Priority
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">Recommended Activities:</p>
                      <ul className="space-y-1">
                        {plan.activities.map((activity, actIndex) => (
                          <li key={actIndex} className="text-sm text-gray-700">
                            • {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Timeframe:</span> {plan.timeframe}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Resources */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommended Study Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.recommendations.studyResources.map((resource, index) => (
                  <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-sm text-blue-700">{resource}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Next Steps</h2>
              <div className="space-y-3">
                {report.recommendations.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:bg-gray-800 { background-color: #374151 !important; }
          body { print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default SimulationReport;