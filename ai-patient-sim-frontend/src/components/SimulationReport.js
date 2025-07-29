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
      setReport(response);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load simulation report');
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

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Simulation Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Case</p>
            <p className="font-medium">{report.report.simulationOverview.scenarioDetails.caseName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Patient</p>
            <p className="font-medium">{report.report.simulationOverview.scenarioDetails.patientDescription}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Program Area</p>
            <p className="font-medium">{report.report.simulationOverview.scenarioDetails.programArea}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Difficulty Level</p>
            <p className="font-medium">{report.report.simulationOverview.difficultyLevel}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="font-medium">{report.report.simulationOverview.sessionInfo.duration} minutes</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Overall Score</p>
            <p className="font-medium text-2xl text-blue-600">{report.report.overallScore}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Learning Objectives</h3>
        <ul className="space-y-2">
          {report.report.simulationOverview.learningObjectives.map((objective, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>{objective}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(report.report.performanceMetrics.scoringRubric).map(([key, value]) => (
            <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-2xl font-bold text-blue-600">{value}%</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Actions Completed</h3>
        <div className="space-y-3">
          {report.report.performanceMetrics.checklistEvaluation.completedActions.map((action, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {action.appropriate ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-3" />
                )}
                <div>
                  <p className="font-medium capitalize">{action.action.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-600">{action.details}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                action.timing === 'appropriate' ? 'bg-green-100 text-green-800' :
                action.timing === 'early' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {action.timing}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderClinicalAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-600">Strengths</h3>
          <ul className="space-y-2">
            {report.report.clinicalDecisionMaking.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-yellow-600">Areas for Improvement</h3>
          <ul className="space-y-2">
            {report.report.clinicalDecisionMaking.areasForImprovement.map((area, index) => (
              <li key={index} className="flex items-start">
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{area}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">Alternative Approaches</h3>
          <ul className="space-y-2">
            {report.report.clinicalDecisionMaking.alternativeApproaches.map((approach, index) => (
              <li key={index} className="flex items-start">
                <Target className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{approach}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderCommunication = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Communication Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Patient Interaction</h4>
            <div className="space-y-2">
              {Object.entries(report.report.communicationAssessment.patientInteraction).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-medium">{typeof value === 'number' ? `${value}%` : value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Professional Behavior</h4>
            <div className="space-y-2">
              {Object.entries(report.report.communicationAssessment.professionalBehavior).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-medium">{typeof value === 'number' ? `${value}%` : value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">{report.report.communicationAssessment.feedback}</p>
        </div>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Session Timeline</h3>
        <div className="space-y-4">
          {report.report.timelineAnalysis.timeline.map((event, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-16 text-sm text-gray-500">
                {event.minutesFromStart}m
              </div>
              <div className={`w-3 h-3 rounded-full mr-4 mt-1 ${
                event.type === 'clinical_action' ? 'bg-blue-500' : 'bg-green-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm">{event.description}</p>
                <p className="text-xs text-gray-500 capitalize">{event.type.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Debriefing Questions</h3>
        <div className="space-y-4">
          {report.report.debriefingQuestions.reflectionQuestions.map((question, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-blue-600">{question}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Expert Feedback</h3>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">{report.report.debriefingQuestions.expertFeedback}</p>
        </div>
      </div>
    </div>
  );

  const renderNextSteps = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Personalized Learning Plan</h3>
        <ul className="space-y-3">
          {report.report.actionableNextSteps.personalizedLearningPlan.map((step, index) => (
            <li key={index} className="flex items-start">
              <BookOpen className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recommended Resources</h3>
        <ul className="space-y-2">
          {report.report.actionableNextSteps.recommendedResources.map((resource, index) => (
            <li key={index} className="flex items-start">
              <Target className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{resource}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

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