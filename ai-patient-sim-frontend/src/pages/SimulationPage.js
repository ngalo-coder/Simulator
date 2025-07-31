// ai-patient-sim-frontend/src/pages/SimulationPage.js - Updated with Beautiful Template UI
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { simulationAPI } from '../utils/simulationApi';
import { 
  Send, 
  User, 
  Clock, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle,
  Stethoscope,
  FileText,
  ArrowLeft,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const SimulationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Core state
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [sessionMetrics, setSessionMetrics] = useState({});
  
  // Refs
  const messagesEndRef = useRef(null);

  const loadSimulation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await simulationAPI.getSimulation(id);
      
      if (response.success) {
        setSimulation(response.simulation);
        setConversationHistory(response.simulation.conversationHistory || []);
        setSessionMetrics(response.simulation.sessionMetrics || {});
      } else {
        toast.error('Simulation not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading simulation:', error);
      toast.error('Failed to load simulation');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      loadSimulation();
    }
  }, [id, loadSimulation]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!message.trim() || sending) return;

    const userMessage = message.trim();
    setMessage('');
    setSending(true);

    // Add user message immediately to UI
    const newUserMessage = {
      sender: 'student',
      message: userMessage,
      timestamp: new Date(),
      messageType: 'chat'
    };

    setConversationHistory(prev => [...prev, newUserMessage]);

    try {
      const response = await simulationAPI.sendMessage(id, userMessage);
      
      if (response.success) {
        // Add AI response to conversation
        const responses = [];
        
        if (response.responses.patient) {
          responses.push({
            sender: 'patient',
            message: response.responses.patient,
            timestamp: new Date(),
            messageType: 'chat',
            clinicalInfo: response.responses.clinicalInfo
          });
        }
        
        if (response.responses.guardian) {
          responses.push({
            sender: 'guardian',
            message: response.responses.guardian,
            timestamp: new Date(),
            messageType: 'chat'
          });
        }

        setConversationHistory(prev => [...prev.slice(0, -1), newUserMessage, ...responses]);

        // Update session metrics
        if (response.sessionMetrics) {
          setSessionMetrics(response.sessionMetrics);
        }

        // Check if simulation ended
        if (response.simulationEnded) {
          toast.success('Simulation completed!');
          setTimeout(() => {
            completeSimulation();
          }, 2000);
        }
      } else {
        toast.error(response.error || 'Failed to send message');
        // Remove the user message that failed
        setConversationHistory(prev => prev.slice(0, -1));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Remove the user message that failed
      setConversationHistory(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const completeSimulation = async () => {
    try {
      const response = await simulationAPI.completeSimulation(id);
      
      if (response.success) {
        // Navigate to results page with evaluation data
        navigate(`/simulation/${id}/report`);
      } else {
        toast.error('Failed to complete simulation');
      }
    } catch (error) {
      console.error('Error completing simulation:', error);
      toast.error('Failed to complete simulation');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSenderIcon = (sender) => {
    switch (sender) {
      case 'student':
        return <Stethoscope className="h-4 w-4" />;
      case 'patient':
        return <User className="h-4 w-4" />;
      case 'guardian':
        return <User className="h-4 w-4" />;
      case 'system':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getSenderName = (sender) => {
    switch (sender) {
      case 'student':
        return 'You';
      case 'patient':
        return simulation?.patientInfo?.name || 'Patient';
      case 'guardian':
        return simulation?.guardianInfo?.name || 'Guardian';
      case 'system':
        return 'System';
      default:
        return sender;
    }
  };

  const getSenderColor = (sender) => {
    switch (sender) {
      case 'student':
        return 'bg-blue-50 border-blue-200';
      case 'patient':
        return 'bg-green-50 border-green-200';
      case 'guardian':
        return 'bg-purple-50 border-purple-200';
      case 'system':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Simulation Not Found</h2>
          <p className="text-gray-600 mb-4">The simulation you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {simulation.caseName || 'Patient Simulation'}
                </h1>
                <p className="text-sm text-gray-600">
                  {simulation.patientInfo?.name} • {simulation.patientInfo?.age} years old
                </p>
              </div>
            </div>

            {/* Session Metrics */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{sessionMetrics.duration || 0} min</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>{sessionMetrics.messageCount || 0} messages</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${
                  simulation.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className="capitalize">{simulation.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversationHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl ${msg.sender === 'student' ? 'order-2' : 'order-1'}`}>
                {/* Message Header */}
                <div className={`flex items-center space-x-2 mb-1 ${
                  msg.sender === 'student' ? 'justify-end' : 'justify-start'
                }`}>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    {getSenderIcon(msg.sender)}
                    <span className="font-medium">{getSenderName(msg.sender)}</span>
                    <span>•</span>
                    <span>{formatTimestamp(msg.timestamp)}</span>
                  </div>
                </div>

                {/* Message Content */}
                <div className={`rounded-lg p-4 border ${getSenderColor(msg.sender)} ${
                  msg.sender === 'student' ? 'rounded-br-sm' : 'rounded-bl-sm'
                }`}>
                  <p className="text-gray-900 whitespace-pre-wrap">{msg.message}</p>
                  
                  {/* Clinical Info */}
                  {msg.clinicalInfo && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Clinical Information Revealed
                        </span>
                      </div>
                      <div className="text-sm text-blue-800">
                        {Object.entries(msg.clinicalInfo).map(([key, value]) => (
                          <div key={key} className="mb-1">
                            <span className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                            </span>{' '}
                            {typeof value === 'object' ? JSON.stringify(value) : value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {sending && (
            <div className="flex justify-start">
              <div className="max-w-3xl">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{simulation.patientInfo?.name}</span>
                    <span>is typing...</span>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg rounded-bl-sm p-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question or response..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
                disabled={sending || simulation.status !== 'active'}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={sendMessage}
                disabled={!message.trim() || sending || simulation.status !== 'active'}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{sending ? 'Sending...' : 'Send'}</span>
              </button>
              
              <button
                onClick={completeSimulation}
                disabled={sending}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Complete</span>
              </button>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationPage;