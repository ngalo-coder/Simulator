// ai-patient-sim-frontend/src/components/SimulationReport.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { simulationAPI } from '../utils/simulationApi';
import {
  FileText,
  Clock,
  Target,
  TrendingUp,
  MessageCircle,
  Award,
  BookOpen,
  ArrowLeft,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const SimulationReport = () => {
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (simulationId) {
      fetchReport();
    }
  }, [simulationId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await simulationAPI.generateReport(simulationId);
      
      // Debug logging
      console.log('Report response:', response);
      
      if (response && response.success) {
        setReport(response);
      } else {
        console.error('Report generation failed:', response);
        toast.error(response?.error || 'Failed to generate simulation report');
        setReport(null);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      
      // Check if it's a 400 error (simulation not completed)
      if (error.response?.status === 400) {
        toast.error('Report can only be generated for completed simulations');
      } else if (error.response?.status === 404) {
        toast.error('Simulation not found');
      } else {
        toast.error('Failed to load simulation report');
      }
      
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const reportData = JSON.stringify(report, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-report-${simulationId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Available</h2>
          <p className="text-gray-600 mb-4">Unable to load the simulation report.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'clinical', label: 'Clinical Analysis', icon: Target },
    { id: 'communication', label: 'Communication', icon: MessageCircle },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'feedback', label: 'Feedback', icon: Award },
    { id: 'next-steps', label: 'Next Steps', icon: BookOpen }
  ];

  const renderOverview = () => {
    // Add null checks to prevent errors
    const reportData = report?.report;
    const overview = reportData?.simulationOverview;
    const scenarioDetails = overview?.scenarioDetails;
    const sessionInfo = overview?.sessionInfo;

    if (!reportData || !overview) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Report Data Unavailable</h3>
            <p className="text-gray-600">The simulation report data is not available or still being generated.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Simulation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Case</p>
              <p className="font-medium">{scenarioDetails?.caseName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Patient</p>
              <p className="font-medium">{scenarioDetails?.patientDescription || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Program Area</p>
              <p className="font-medium">{scenarioDetails?.programArea || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Difficulty Level</p>
              <p className="font-medium">{overview?.difficultyLevel || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-medium">{sessionInfo?.duration || 'N/A'} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Overall Score</p>
              <p className="font-medium text-2xl text-blue-600">{reportData?.overallScore || 0}%</p>
            </div>
          </div>
      </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Learning Objectives</h3>
          <ul className="space-y-2">
            {(overview?.learningObjectives || []).map((objective, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{objective}</span>
              </li>
            ))}
            {(!overview?.learningObjectives || overview.learningObjectives.length === 0) && (
              <li className="text-gray-500 italic">No learning objectives available</li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  const renderPerformance = () => {
    const reportData = report?.report;
    const performanceMetrics = reportData?.performanceMetrics;
    const scoringRubric = performanceMetrics?.scoringRubric || {};

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Scores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(scoringRubric).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-2xl font-bold text-blue-600">{value || 0}%</p>
              </div>
            ))}
            {Object.keys(scoringRubric).length === 0 && (
              <div className="col-span-full text-center text-gray-500 italic">
                Performance scores not available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Actions Completed</h3>
          <div className="space-y-3">
            {(performanceMetrics?.checklistEvaluation?.completedActions || []).map((action, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {action.appropriate ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-3" />
                  )}
                  <div>
                    <p className="font-medium capitalize">{action.action?.replace(/_/g, ' ') || 'Unknown Action'}</p>
                    <p className="text-sm text-gray-600">{action.details || 'No details available'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  action.timing === 'appropriate' ? 'bg-green-100 text-green-800' :
                  action.timing === 'early' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {action.timing || 'N/A'}
                </span>
              </div>
            ))}
            {(!performanceMetrics?.checklistEvaluation?.completedActions || performanceMetrics.checklistEvaluation.completedActions.length === 0) && (
              <div className="text-center text-gray-500 italic py-4">
                No actions recorded
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderClinicalAnalysis = () => {
    const clinicalDecisionMaking = report?.report?.clinicalDecisionMaking;
    
    if (!clinicalDecisionMaking) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Clinical Analysis Unavailable</h3>
            <p className="text-gray-600">Clinical decision-making analysis is not available for this simulation.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-600">Strengths</h3>
            <ul className="space-y-2">
              {(clinicalDecisionMaking.strengths || []).map((strength, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
              {(!clinicalDecisionMaking.strengths || clinicalDecisionMaking.strengths.length === 0) && (
                <li className="text-gray-500 italic text-sm">No strengths identified</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-yellow-600">Areas for Improvement</h3>
            <ul className="space-y-2">
              {(clinicalDecisionMaking.areasForImprovement || []).map((area, index) => (
                <li key={index} className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{area}</span>
                </li>
              ))}
              {(!clinicalDecisionMaking.areasForImprovement || clinicalDecisionMaking.areasForImprovement.length === 0) && (
                <li className="text-gray-500 italic text-sm">No areas for improvement identified</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">Alternative Approaches</h3>
            <ul className="space-y-2">
              {(clinicalDecisionMaking.alternativeApproaches || []).map((approach, index) => (
                <li key={index} className="flex items-start">
                  <Target className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{approach}</span>
                </li>
              ))}
              {(!clinicalDecisionMaking.alternativeApproaches || clinicalDecisionMaking.alternativeApproaches.length === 0) && (
                <li className="text-gray-500 italic text-sm">No alternative approaches suggested</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderCommunication = () => {
    const communicationAssessment = report?.report?.communicationAssessment;
    
    if (!communicationAssessment) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Communication Assessment Unavailable</h3>
            <p className="text-gray-600">Communication assessment data is not available for this simulation.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Communication Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Patient Interaction</h4>
              <div className="space-y-2">
                {Object.entries(communicationAssessment.patientInteraction || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">{typeof value === 'number' ? `${value}%` : value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Professional Behavior</h4>
              <div className="space-y-2">
                {Object.entries(communicationAssessment.professionalBehavior || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">{typeof value === 'number' ? `${value}%` : value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">{communicationAssessment.feedback || 'No feedback available'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    const timelineAnalysis = report?.report?.timelineAnalysis;
    const timeline = timelineAnalysis?.timeline || [];
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Session Timeline</h3>
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-16 text-sm text-gray-500">
                  {event.minutesFromStart || 0}m
                </div>
                <div className={`w-3 h-3 rounded-full mr-4 mt-1 ${
                  event.type === 'clinical_action' ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm">{event.description || 'No description'}</p>
                  <p className="text-xs text-gray-500 capitalize">{event.type?.replace('_', ' ') || 'Unknown'}</p>
                </div>
              </div>
            ))}
            {timeline.length === 0 && (
              <div className="text-center text-gray-500 italic py-4">
                No timeline data available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFeedback = () => {
    const debriefingQuestions = report?.report?.debriefingQuestions;
    const reflectionQuestions = debriefingQuestions?.reflectionQuestions || [];
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Debriefing Questions</h3>
          <div className="space-y-4">
            {reflectionQuestions.map((question, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-blue-600">{question}</p>
              </div>
            ))}
            {reflectionQuestions.length === 0 && (
              <div className="text-center text-gray-500 italic py-4">
                No debriefing questions available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Expert Feedback</h3>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">{debriefingQuestions?.expertFeedback || 'No expert feedback available'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderNextSteps = () => {
    const actionableNextSteps = report?.report?.actionableNextSteps;
    const learningPlan = actionableNextSteps?.personalizedLearningPlan || [];
    const resources = actionableNextSteps?.recommendedResources || [];
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Personalized Learning Plan</h3>
          <ul className="space-y-3">
            {learningPlan.map((step, index) => (
              <li key={index} className="flex items-start">
                <BookOpen className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>{step}</span>
              </li>
            ))}
            {learningPlan.length === 0 && (
              <li className="text-gray-500 italic">No personalized learning plan available</li>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recommended Resources</h3>
          <ul className="space-y-2">
            {resources.map((resource, index) => (
              <li key={index} className="flex items-start">
                <Target className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{resource}</span>
              </li>
            ))}
            {resources.length === 0 && (
              <li className="text-gray-500 italic text-sm">No recommended resources available</li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'performance': return renderPerformance();
      case 'clinical': return renderClinicalAnalysis();
      case 'communication': return renderCommunication();
      case 'timeline': return renderTimeline();
      case 'feedback': return renderFeedback();
      case 'next-steps': return renderNextSteps();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Simulation Report</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={downloadReport}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
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
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SimulationReport;