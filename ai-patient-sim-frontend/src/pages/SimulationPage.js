// ai-patient-sim-frontend/src/pages/SimulationPage.js - FIXED ESLint Issues
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { simulationAPI } from '../utils/simulationApi';
import { 
  MessageCircle, 
  User, 
  Users, 
  Clock, 
  Heart, 
  Activity,
  Stethoscope,
  FileText,
  Send,
  Pause,
  Play,
  Square,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Brain,
  Eye,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const SimulationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Core state
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Chat state
  const [newMessage, setNewMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  
  // Clinical actions state
  const [activeAction, setActiveAction] = useState(null);
  const [actionDetails, setActionDetails] = useState('');
  
  // UI state
  const [expandedSections, setExpandedSections] = useState({
    objectives: true,
    vitals: true,
    actions: false
  });
  
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const fetchSimulation = useCallback(async () => {
    try {
      const response = await simulationAPI.getSimulation(id);
      if (response.success) {
        setSimulation(response.simulation);
        setConversationHistory(response.simulation.conversationHistory || []);
      } else {
        toast.error('Simulation not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching simulation:', error);
      toast.error('Failed to load simulation');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Initialize simulation
  useEffect(() => {
    if (id) {
      fetchSimulation();
    }
  }, [id, fetchSimulation]);

  // Auto-scroll chat
  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || messageLoading) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setMessageLoading(true);

    try {
      const response = await simulationAPI.sendMessage(id, messageText);
      if (response.success) {
        setConversationHistory(prev => [
          ...prev,
          {
            sender: 'student',
            message: messageText,
            timestamp: new Date(),
            messageType: 'chat'
          },
          ...(response.responses.patient ? [{
            sender: 'patient',
            message: response.responses.patient,
            timestamp: new Date(),
            messageType: 'chat',
            clinicalInfo: response.responses.clinicalInfo
          }] : []),
          ...(response.responses.guardian ? [{
            sender: 'guardian',
            message: response.responses.guardian,
            timestamp: new Date(),
            messageType: 'chat'
          }] : [])
        ]);

        // Update simulation metrics
        if (simulation) {
          setSimulation(prev => ({
            ...prev,
            sessionMetrics: response.sessionMetrics || prev.sessionMetrics
          }));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setMessageLoading(false);
      messageInputRef.current?.focus();
    }
  };

  const handleClinicalAction = async (action) => {
    if (!actionDetails.trim()) {
      toast.error('Please provide details for this action');
      return;
    }

    setActionLoading(true);
    try {
      const response = await simulationAPI.performAction(id, action, actionDetails);
      if (response.success) {
        setConversationHistory(prev => [
          ...prev,
          {
            sender: 'system',
            message: response.systemMessage,
            timestamp: new Date(),
            messageType: 'action'
          }
        ]);
        
        setActiveAction(null);
        setActionDetails('');
        toast.success(`${action.replace('_', ' ')} completed`);
        
        // Update learning progress
        if (response.learningProgress) {
          setSimulation(prev => ({
            ...prev,
            learningProgress: response.learningProgress
          }));
        }
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseSimulation = async () => {
    try {
      await simulationAPI.pauseSimulation(id);
      setSimulation(prev => ({ ...prev, status: 'paused' }));
      toast.success('Simulation paused');
    } catch (error) {
      toast.error('Failed to pause simulation');
    }
  };

  const handleResumeSimulation = async () => {
    try {
      await simulationAPI.resumeSimulation(id);
      setSimulation(prev => ({ ...prev, status: 'active' }));
      toast.success('Simulation resumed');
    } catch (error) {
      toast.error('Failed to resume simulation');
    }
  };

  const handleCompleteSimulation = async () => {
    if (!window.confirm('Are you sure you want to complete this simulation?')) {
      return;
    }

    try {
      const response = await simulationAPI.completeSimulation(id);
      if (response.success) {
        setSimulation(prev => ({ ...prev, status: 'completed' }));
        toast.success('Simulation completed! You can now view your evaluation report.');
        
        // Don't auto-navigate, let user choose to view report or go back
      }
    } catch (error) {
      toast.error('Failed to complete simulation');
    }
  };

  const handleViewReport = () => {
    navigate(`/simulation/${id}/report`);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getMessageSenderIcon = (sender) => {
    switch (sender) {
      case 'patient':
        return <User className="h-5 w-5 text-blue-600" />;
      case 'guardian':
        return <Users className="h-5 w-5 text-green-600" />;
      case 'student':
        return <Brain className="h-5 w-5 text-purple-600" />;
      case 'system':
        return <Activity className="h-5 w-5 text-gray-600" />;
      default:
        return <MessageCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getMessageSenderLabel = (sender) => {
    switch (sender) {
      case 'patient':
        return simulation?.patientInfo?.name || 'Patient';
      case 'guardian':
        return simulation?.guardianInfo?.name || 'Guardian';
      case 'student':
        return user?.profile?.firstName || 'You';
      case 'system':
        return 'System';
      default:
        return sender;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Simulation Not Found</h2>
          <p className="text-gray-600 mt-2">The simulation you're looking for doesn't exist or you don't have access to it.</p>
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

  const clinicalActionOptions = [
    { id: 'history_taking', label: 'Take History', icon: FileText },
    { id: 'physical_exam', label: 'Physical Exam', icon: Stethoscope },
    { id: 'order_labs', label: 'Order Labs', icon: Activity },
    { id: 'order_imaging', label: 'Order Imaging', icon: Eye },
    { id: 'diagnosis', label: 'Diagnosis', icon: Brain },
    { id: 'treatment_plan', label: 'Treatment Plan', icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {simulation.caseName || 'Patient Simulation'}
                </h1>
                <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {simulation.sessionMetrics?.currentDuration || '0 minutes'}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {simulation.sessionMetrics?.messageCount || 0} messages
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    simulation.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : simulation.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : simulation.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {simulation.status === 'completed' ? 'Completed - View Report Available' : simulation.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {simulation.status === 'active' && (
                <button
                  onClick={handlePauseSimulation}
                  className="flex items-center px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </button>
              )}
              
              {simulation.status === 'paused' && (
                <button
                  onClick={handleResumeSimulation}
                  className="flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </button>
              )}
              
              {(simulation.status === 'active' || simulation.status === 'paused') && (
                <button
                  onClick={handleCompleteSimulation}
                  className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Complete
                </button>
              )}

              {simulation.status === 'completed' && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleViewReport}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View Evaluation Report
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Success Message */}
      {simulation.status === 'completed' && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  <strong>Simulation Completed!</strong> Your performance has been evaluated. 
                  Click "View Evaluation Report" above to see your detailed analysis and feedback.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Patient Info & Tools */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Patient</label>
                  <p className="text-sm text-gray-900">
                    {simulation.patientInfo?.name || 'Patient'}, {simulation.patientInfo?.age}
                  </p>
                  <p className="text-xs text-gray-500">{simulation.patientInfo?.gender}</p>
                </div>
                
                {simulation.guardianInfo && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Guardian</label>
                    <p className="text-sm text-gray-900">
                      {simulation.guardianInfo.name} ({simulation.guardianInfo.relationship})
                    </p>
                    {simulation.guardianInfo.primaryLanguage !== 'English' && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Speaks {simulation.guardianInfo.primaryLanguage}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-white rounded-lg shadow">
              <button
                onClick={() => toggleSection('objectives')}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-medium text-gray-900">Learning Objectives</h3>
                {expandedSections.objectives ? 
                  <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                }
              </button>
              
              {expandedSections.objectives && (
                <div className="px-4 pb-4">
                  <ul className="space-y-2">
                    {simulation.learningObjectives?.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{objective}</span>
                      </li>
                    )) || (
                      <li className="text-sm text-gray-500">No objectives specified</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Vital Signs */}
            {simulation.vitalSigns && (
              <div className="bg-white rounded-lg shadow">
                <button
                  onClick={() => toggleSection('vitals')}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-medium text-gray-900">Vital Signs</h3>
                  {expandedSections.vitals ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </button>
                
                {expandedSections.vitals && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(simulation.vitalSigns).map(([key, value]) => (
                        <div key={key} className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            {key.replace('_', ' ')}
                          </div>
                          <div className="text-sm font-medium text-gray-900">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Clinical Actions */}
            <div className="bg-white rounded-lg shadow">
              <button
                onClick={() => toggleSection('actions')}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-medium text-gray-900">Clinical Actions</h3>
                {expandedSections.actions ? 
                  <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                }
              </button>
              
              {expandedSections.actions && (
                <div className="px-4 pb-4 space-y-2">
                  {clinicalActionOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setActiveAction(option.id)}
                        className="w-full flex items-center px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-md"
                        disabled={simulation.status !== 'active'}
                      >
                        <IconComponent className="h-4 w-4 mr-2" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Conversation</h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationHistory.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Start the conversation by sending a message to the patient.</p>
                  </div>
                ) : (
                  conversationHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'student'
                          ? 'bg-blue-600 text-white'
                          : message.sender === 'system'
                          ? 'bg-gray-100 text-gray-700 border'
                          : 'bg-gray-50 text-gray-900'
                      }`}>
                        <div className="flex items-center mb-1">
                          {getMessageSenderIcon(message.sender)}
                          <span className="ml-2 text-xs font-medium">
                            {getMessageSenderLabel(message.sender)}
                          </span>
                          <span className="ml-auto text-xs opacity-75">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        
                        {message.clinicalInfo && Object.keys(message.clinicalInfo).length > 0 && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <strong>Clinical information revealed:</strong>
                            <ul className="mt-1 list-disc list-inside">
                              {Object.entries(message.clinicalInfo).map(([category, items]) => (
                                <li key={category}>
                                  {category}: {Array.isArray(items) ? items.join(', ') : items}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={
                      simulation.status === 'active' 
                        ? "Type your message..." 
                        : "Simulation is paused"
                    }
                    disabled={simulation.status !== 'active' || messageLoading}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || simulation.status !== 'active' || messageLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {messageLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Action Modal */}
      {activeAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {clinicalActionOptions.find(opt => opt.id === activeAction)?.label}
            </h3>
            
            <textarea
              value={actionDetails}
              onChange={(e) => setActionDetails(e.target.value)}
              placeholder="Enter details for this action..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setActiveAction(null);
                  setActionDetails('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClinicalAction(activeAction)}
                disabled={!actionDetails.trim() || actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Perform Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPage;