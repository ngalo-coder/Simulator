import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { RetakeModal } from '../components/retake';
import { 
  createSimulationSessionUrl, 
  createSimulationCaseUrl, 
  parseSimulationUrl, 
  createSpecialtyContext, 
  preserveSpecialtyContext,
  updateBrowserHistoryForBookmarks,
  isValidSimulationUrl
} from '../utils/urlUtils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  speaks_for?: string;
}

const SimulationChatPage: React.FC = () => {
  const { caseId, sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const specialtyContext = location.state?.specialtyContext;

  // Add custom styles for animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out forwards;
      }
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
        50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
      }
      .pulse-glow {
        animation: pulse-glow 2s infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const {} = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [evaluation, setEvaluation] = useState<string>('');
  
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  
  const [simulationStartupState, setSimulationStartupState] = useState<{
    phase: 'idle' | 'validating_case' | 'creating_session' | 'loading_patient' | 'initializing_chat' | 'complete';
    progress: number;
    message: string;
    isLoading: boolean;
  }>({
    phase: 'idle',
    progress: 0,
    message: '',
    isLoading: false
  });
  
  const [urlAccessPattern, setUrlAccessPattern] = useState<'case-only' | 'case-with-session' | 'invalid'>('invalid');
  
  interface SimulationError {
    type: 'invalid_case' | 'network' | 'auth' | 'server' | 'timeout' | 'unknown';
    message: string;
    userMessage: string;
    action: 'retry' | 'redirect' | 'login' | 'none';
    redirectUrl?: string;
    canRetry: boolean;
  }
  
  const [simulationError, setSimulationError] = useState<SimulationError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const normalizeSpeaksFor = (speaksFor: string | undefined): string | undefined => {
    if (!speaksFor) return speaksFor;
    return speaksFor.toLowerCase() === 'self' ? 'Self' : speaksFor;
  };

  const formatMessageContent = (content: string): string => {
    return content
      // Convert *text* to <em>text</em> for italics
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Convert **text** to <strong>text</strong> for bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Convert line breaks to <br> tags
      .replace(/\n/g, '<br>');
  };

  // Test the fix
  React.useEffect(() => {
    const testCases = ['self', 'Self', 'mother', 'father', undefined, ''];
    testCases.forEach(testCase => {
      const normalized = normalizeSpeaksFor(testCase);
      const isSelf = !normalized || normalized === 'Self';
      console.log(`🔧 Patient name fix test: "${testCase}" -> "${normalized}" -> isSelf: ${isSelf}`);
    });
  }, []);

  // Bookmark compatibility handler
  useEffect(() => {
    const currentUrl = window.location.pathname;
    
    if (isValidSimulationUrl(currentUrl)) {
      console.log('✅ Valid simulation URL detected for bookmark compatibility');
      
      if (sessionData?.patientName) {
        document.title = `Simulation: ${sessionData.patientName} - Basic program`;
      } else if (caseId) {
        document.title = `Case ${caseId} - Basic program`;
      }
    }
  }, [caseId, sessionId, sessionData?.patientName]);

  // Enhanced URL validation and pattern detection
  useEffect(() => {
    const currentUrl = window.location.pathname;
    const urlValidation = parseSimulationUrl(currentUrl);
    
    console.log('🔍 URL Validation:', { 
      currentUrl, 
      validation: urlValidation, 
      params: { caseId, sessionId } 
    });

    if (urlValidation.isValid) {
      if (urlValidation.caseId !== caseId || urlValidation.sessionId !== sessionId) {
        console.warn('⚠️ URL parameter mismatch detected', {
          parsed: urlValidation,
          params: { caseId, sessionId }
        });
      }
    }

    if (caseId && sessionId && urlValidation.sessionId) {
      setUrlAccessPattern('case-with-session');
      console.log('🔗 URL Pattern: case-with-session', { caseId, sessionId });
    } else if (caseId && !sessionId && !urlValidation.sessionId) {
      setUrlAccessPattern('case-only');
      console.log('🔗 URL Pattern: case-only', { caseId });
    } else {
      setUrlAccessPattern('invalid');
      console.log('🔗 URL Pattern: invalid', { caseId, sessionId, validation: urlValidation });
    }
  }, [caseId, sessionId]);

  useEffect(() => {
    console.log('📍 Simulation startup useEffect triggered:', { 
      caseId, 
      sessionId, 
      hasSessionData: !!sessionData,
      sessionDataKeys: sessionData ? Object.keys(sessionData) : [],
      urlAccessPattern,
      simulationError: simulationError?.type || null
    });
    
    setSimulationError(null);
    setRetryCount(0);
    
    switch (urlAccessPattern) {
      case 'case-only':
        if (!sessionData) {
          console.log('🚀 Case-only URL detected - Starting new simulation for case:', caseId);
          startNewSimulation();
        }
        break;
        
      case 'case-with-session':
        if (!sessionData) {
          console.log('🔄 Case+Session URL detected - Loading existing session:', sessionId);
          setSessionData({ 
            sessionId, 
            patientName: 'Loading...', 
            caseId,
            urlAccessPattern: 'case-with-session'
          });
        }
        break;
        
      case 'invalid':
        if (!caseId) {
          console.warn('⚠️ Invalid URL - No caseId provided, redirecting to simulation page');
          const error: SimulationError = {
            type: 'invalid_case',
            message: 'No case ID provided in URL',
            userMessage: 'Invalid simulation URL. Please select a case from the case browser.',
            action: 'redirect',
            redirectUrl: '/simulation',
            canRetry: false
          };
          setSimulationError(error);
          logError('Invalid URL - No caseId', { url: window.location.href });
          
          setTimeout(() => {
            navigate('/simulation');
          }, 3000);
        }
        break;
        
      default:
        console.log('⏳ URL pattern not yet determined, waiting...');
    }

    return () => {
      if (eventSourceRef.current) {
        console.log('🧹 Cleaning up EventSource');
        eventSourceRef.current.close();
      }
    };
  }, [caseId, sessionId, urlAccessPattern]); 

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const logError = (errorType: string, details: any) => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: errorType,
      caseId,
      sessionId,
      urlAccessPattern,
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount,
      details
    };
    
    console.error('🚨 Simulation Error:', errorLog);
    
    if (import.meta.env.PROD) {
      // errorTrackingService.log(errorLog);
    }
  };

  const createErrorFromException = (error: any): SimulationError => {
    console.error('🔍 Analyzing error:', error);
    
    if (error.message?.includes('fetch') || 
        error.message?.includes('network') || 
        error.message?.includes('Failed to fetch') ||
        error.name === 'NetworkError') {
      return {
        type: 'network',
        message: error.message || 'Network connection failed',
        userMessage: 'Connection failed. Please check your internet connection and try again.',
        action: 'retry',
        canRetry: true
      };
    }
    
    if (error.message?.includes('401') || 
        error.message?.includes('authentication') || 
        error.message?.includes('unauthorized') ||
        error.message?.includes('Session expired')) {
      return {
        type: 'auth',
        message: error.message || 'Authentication failed',
        userMessage: 'Your session has expired. Please log in again.',
        action: 'login',
        redirectUrl: '/login',
        canRetry: false
      };
    }
    
    if (error.message?.includes('404') || 
        error.message?.includes('not found') ||
        error.message?.includes('Case not found') ||
        error.message?.includes('Invalid case')) {
      return {
        type: 'invalid_case',
        message: error.message || 'Case not found',
        userMessage: 'This case could not be found. It may have been removed or you may not have access to it.',
        action: 'redirect',
        redirectUrl: specialtyContext?.returnUrl || '/simulation',
        canRetry: false
      };
    }
    
    if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
      return {
        type: 'timeout',
        message: error.message || 'Request timeout',
        userMessage: 'The request is taking too long. Please try again.',
        action: 'retry',
        canRetry: true
      };
    }
    
    if (error.message?.includes('500') || 
        error.message?.includes('502') || 
        error.message?.includes('503') ||
        error.message?.includes('server')) {
      return {
        type: 'server',
        message: error.message || 'Server error',
        userMessage: 'The server is experiencing issues. Please try again in a few moments.',
        action: 'retry',
        canRetry: true
      };
    }
    
    return {
      type: 'unknown',
      message: error.message || 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      action: 'retry',
      canRetry: true
    };
  };

  const retrySimulationStartup = async () => {
    if (!simulationError?.canRetry || isRetrying) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    console.log(`🔄 Retrying simulation startup (attempt ${retryCount + 1})`);
    
    try {
      setSimulationError(null);
      setSimulationStartupState({
        phase: 'idle',
        progress: 0,
        message: '',
        isLoading: false
      });
      
      if (simulationError.type === 'network') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      await startNewSimulation();
    } catch (error) {
      console.error('❌ Retry failed:', error);
      const newError = createErrorFromException(error);
      setSimulationError(newError);
      logError('Retry failed', { originalError: simulationError, newError, retryAttempt: retryCount + 1 });
    } finally {
      setIsRetrying(false);
    }
  };

  const startNewSimulation = async () => {
    if (!caseId) {
      const error: SimulationError = {
        type: 'invalid_case',
        message: 'No case ID provided',
        userMessage: 'No case ID was provided. Please select a case to start a simulation.',
        action: 'redirect',
        redirectUrl: '/simulation',
        canRetry: false
      };
      setSimulationError(error);
      logError('No case ID provided', { caseId });
      return;
    }

    if (sessionData && !isSessionEnded && sessionData.sessionId) {
      console.log('⚠️ Simulation already in progress, not starting a new one');
      return;
    }

    try {
      setSimulationStartupState({
        phase: 'validating_case',
        progress: 10,
        message: `Validating case ${caseId}...`,
        isLoading: true
      });
      
      setIsLoading(true);
      setSimulationError(null);
      console.log('🚀 Starting new simulation for case-only URL:', caseId);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSimulationStartupState({
        phase: 'creating_session',
        progress: 30,
        message: 'Creating new simulation session...',
        isLoading: true
      });
      
      const response = await api.startSimulation(caseId);
      console.log('🔍 API Response received:', response);

      if (!response) {
        throw new Error('No response received from server');
      }
      
      setSimulationStartupState({
        phase: 'loading_patient',
        progress: 60,
        message: 'Loading patient information...',
        isLoading: true
      });
      
      await new Promise(resolve => setTimeout(resolve, 600));

      const sessionId = response.sessionId || response.session_id;
      const patientName = response.patientName || 
                         response.patient_name || 
                         response.name || 
                         response.speaks_for || 
                         'Patient';
      const initialPrompt = response.initialPrompt || 
                           response.initial_prompt || 
                           response.prompt || 
                           response.message || 
                           '';
      const speaksFor = response.speaks_for || patientName;

      if (!sessionId) {
        throw new Error('No session ID received from server');
      }

      const enhancedSessionData = {
        sessionId,
        caseId,
        patientName,
        initialPrompt,
        speaks_for: speaksFor,
        urlAccessPattern: 'case-only',
        startedAt: new Date().toISOString(),
        isNewSession: true
      };

      console.log('✅ Setting enhanced session data:', enhancedSessionData);
      
      setSimulationStartupState({
        phase: 'initializing_chat',
        progress: 85,
        message: `Preparing chat interface for ${patientName}...`,
        isLoading: true
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSessionData(enhancedSessionData);

      const messages: Message[] = [];

      const normalizedSpeaksFor = normalizeSpeaksFor(speaksFor);
      const displayName = (!normalizedSpeaksFor || normalizedSpeaksFor === 'Self') ? patientName : normalizedSpeaksFor;
      const systemMessage: Message = {
        id: 'system-' + Date.now(),
        role: 'assistant',
        content: `🏥 **Welcome to Basic program**\n\nYou are now interacting with ${displayName}. This is a safe learning environment where you can practice your clinical skills.\n\n**How to interact:**\n• Ask questions about symptoms, medical history, or concerns\n• Conduct a virtual examination by asking specific questions\n• Practice your diagnostic reasoning\n• The patient will respond realistically based on their condition\n\n**Tips:**\n• Start with open-ended questions like "What brings you in today?"\n• Be thorough in your questioning\n• Take your time - there's no rush\n\nType your first question below to begin the consultation. Good luck! 👩‍⚕️👨‍⚕️`,
        timestamp: new Date(),
        speaks_for: 'System',
      };
      messages.push(systemMessage);

      console.log('🔍 Checking for initial prompt:', {
        raw: initialPrompt,
        trimmed: initialPrompt?.trim(),
        length: initialPrompt?.length,
        hasContent: !!(initialPrompt && initialPrompt.trim())
      });

      if (initialPrompt && initialPrompt.trim()) {
        console.log('✅ Adding patient initial message');
        const patientMessage: Message = {
          id: 'patient-initial-' + Date.now(),
          role: 'assistant',
          content: initialPrompt.trim(),
          timestamp: new Date(),
          speaks_for: speaksFor,
        };
        messages.push(patientMessage);
      } else {
        console.log('⚠️ No initial prompt, adding default greeting');
        const normalizedSpeaksFor = normalizeSpeaksFor(speaksFor);
        const displayName = (!normalizedSpeaksFor || normalizedSpeaksFor === 'Self') ? patientName : normalizedSpeaksFor;
        const defaultMessage: Message = {
          id: 'patient-default-' + Date.now(),
          role: 'assistant',
          content: `Hello, I'm ${displayName}. Thank you for seeing me today. How can I help you?`,
          timestamp: new Date(),
          speaks_for: (!normalizedSpeaksFor || normalizedSpeaksFor === 'Self') ? patientName : normalizedSpeaksFor,
        };
        messages.push(defaultMessage);
      }

      console.log('📝 Setting messages:', messages.map(m => ({
        id: m.id,
        role: m.role,
        speaks_for: m.speaks_for,
        content: m.content.substring(0, 50) + '...'
      })));

      setSimulationStartupState({
        phase: 'complete',
        progress: 100,
        message: 'Simulation ready!',
        isLoading: false
      });
      
      setMessages(messages);
      
      setTimeout(() => {
        setMessages(() => [...messages]);
        
        setTimeout(() => {
          setSimulationStartupState({
            phase: 'idle',
            progress: 0,
            message: '',
            isLoading: false
          });
        }, 1000);
      }, 300);

      console.log('🔄 Redirecting to session URL for consistency and bookmark compatibility');
      
      const sessionUrl = createSimulationSessionUrl(caseId, sessionId);
      
      const preservedState = preserveSpecialtyContext(location.state, {
        fromCaseOnlyUrl: true,
        originalCaseUrl: createSimulationCaseUrl(caseId),
        sessionStartedAt: new Date().toISOString()
      });

      if (!preservedState.specialtyContext) {
        const referrerSpecialty = document.referrer.includes('/') ? 
          document.referrer.split('/').pop()?.replace(/_/g, ' ') : null;
        
        preservedState.specialtyContext = createSpecialtyContext(
          referrerSpecialty || undefined, 
          '/simulation'
        );
      }

      navigate(sessionUrl, { 
        replace: true,
        state: preservedState
      });

      updateBrowserHistoryForBookmarks(
        sessionUrl,
        `Simulation: ${enhancedSessionData.patientName}`,
        preservedState
      );

    } catch (error) {
      console.error('❌ Error starting simulation:', error);
      
      const simulationError = createErrorFromException(error);
      setSimulationError(simulationError);
      
      logError('Simulation startup failed', {
        error: error instanceof Error ? error.message : String(error),
        errorType: simulationError.type,
        caseId,
        retryCount,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (!simulationError.canRetry && simulationError.action === 'redirect') {
        setTimeout(() => {
          const redirectState = {
            specialtyContext: location.state?.specialtyContext,
            fromSimulationError: true,
            errorType: simulationError.type
          };

          if (simulationError.redirectUrl) {
            navigate(simulationError.redirectUrl, { state: redirectState });
          } else if (specialtyContext?.returnUrl) {
            navigate(specialtyContext.returnUrl, { state: redirectState });
          } else {
            const fallbackUrl = location.state?.specialtyContext?.returnUrl || '/simulation';
            navigate(fallbackUrl, { state: redirectState });
          }
        }, 4000);
      }
      
      if (simulationError.action === 'login') {
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
      
    } finally {
      setIsLoading(false);
      setSimulationStartupState({
        phase: 'idle',
        progress: 0,
        message: '',
        isLoading: false
      });
    }
  };

  const sendMessage = async () => {
    console.log('🚀 sendMessage called');
    console.log('💬 Input message:', inputMessage.trim());
    console.log('📋 Session data:', sessionData);
    console.log('🔄 Is loading:', isLoading);
    console.log('🚪 Session ended:', isSessionEnded);
    
    if (!inputMessage.trim() || !sessionData?.sessionId || isLoading || isSessionEnded) {
      console.log('⚠️ Message sending blocked:', {
        hasMessage: !!inputMessage.trim(),
        hasSessionId: !!sessionData?.sessionId,
        isLoading,
        isSessionEnded
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    console.log('🗨️ User message added, starting streaming...');

    console.log('🔍 Testing backend connectivity...');
    try {
      const testResponse = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
        method: 'GET'
      });
      console.log('🌐 Backend connectivity test:', testResponse.status);
    } catch (connectError) {
      console.error('❌ Backend connectivity test failed:', connectError);
    }

    try {
      await streamPatientResponse(sessionData.sessionId, userMessage.content);
    } catch (error) {
      console.error('Error sending message:', error);

      let errorText = "I apologize, but I'm having trouble responding right now. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes('authentication') || error.message.includes('token') || error.message.includes('401')) {
          errorText = 'Your session has expired. Please refresh the page and log in again.';
          logError('Message send - Authentication error', { 
            error: error.message, 
            sessionId: sessionData?.sessionId,
            messageLength: inputMessage.length 
          });
        } else if (error.message.includes('timeout')) {
          errorText = 'The response is taking longer than expected. Please try again.';
          logError('Message send - Timeout error', { 
            error: error.message, 
            sessionId: sessionData?.sessionId 
          });
        } else if (error.message.includes('connection') || error.message.includes('network') || error.message.includes('fetch')) {
          errorText = 'Connection to server failed. Please check your internet connection and try again.';
          logError('Message send - Network error', { 
            error: error.message, 
            sessionId: sessionData?.sessionId 
          });
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          errorText = 'The server is experiencing issues. Please try again in a moment.';
          logError('Message send - Server error', { 
            error: error.message, 
            sessionId: sessionData?.sessionId 
          });
        } else {
          logError('Message send - Unknown error', { 
            error: error.message, 
            sessionId: sessionData?.sessionId,
            stack: error.stack 
          });
        }
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Connection Error**\n\n${errorText}\n\n*If this problem persists, please refresh the page or contact support.*`,
        timestamp: new Date(),
        speaks_for: 'System',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const streamPatientResponse = (sessionId: string, question: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('authToken');

      if (!token) {
        console.error('❌ No authentication token found in localStorage');
        reject(new Error('No authentication token found'));
        return;
      }

      const queryParams = new URLSearchParams({
        sessionId,
        question,
        token,
      });

      const eventSourceUrl = `${import.meta.env.VITE_API_URL}/api/simulation/ask?${queryParams.toString()}`;
      console.log('🔗 Creating EventSource connection to:', eventSourceUrl);

      const eventSource = new EventSource(eventSourceUrl);
      eventSourceRef.current = eventSource;

      let assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        speaks_for: (() => {
          const speaksFor = sessionData?.speaks_for;
          const patientName = sessionData?.patientName || 'Patient';
          const normalizedSpeaksFor = normalizeSpeaksFor(speaksFor);
          return (!normalizedSpeaksFor || normalizedSpeaksFor === 'Self') ? patientName : normalizedSpeaksFor;
        })(),
      };

      let hasStarted = false;
      let connectionEstablished = false;

      eventSource.onopen = () => {
        console.log('✅ EventSource connection opened successfully');
        connectionEstablished = true;
      };

      eventSource.onmessage = (event) => {
        try {
          console.log('📨 Received SSE data:', event.data);
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'chunk':
              if (!hasStarted) {
                const normalizedSpeaksFor = normalizeSpeaksFor(data.speaks_for);
                const speakerName = (normalizedSpeaksFor && normalizedSpeaksFor !== 'Self')
                  ? normalizedSpeaksFor
                  : (data.name || sessionData?.patientName || 'Patient');
                assistantMessage.speaks_for = speakerName;
                setMessages((prev) => [...prev, assistantMessage]);
                hasStarted = true;
              }

              assistantMessage.content += data.content;
              const normalizedSpeaksFor = normalizeSpeaksFor(data.speaks_for);
              const speakerName = (normalizedSpeaksFor && normalizedSpeaksFor !== 'Self')
                ? normalizedSpeaksFor
                : (data.name || assistantMessage.speaks_for);
              assistantMessage.speaks_for = speakerName;

              setMessages((prev) =>
                prev.map((msg) => (msg.id === assistantMessage.id ? { ...assistantMessage } : msg))
              );
              break;

            case 'done':
              console.log('Stream completed');
              eventSource.close();
              resolve();
              break;

            case 'session_end':
              console.log('Session ended by system');
              setIsSessionEnded(true);
              if (data.summary) {
                setEvaluation(data.summary);
              }
              eventSource.close();
              resolve();
              break;

            default:
              console.log('Unknown event type:', data.type);
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err, 'Raw data:', event.data);
          
          logError('EventSource - Data parsing error', {
            error: err instanceof Error ? err.message : String(err),
            rawData: event.data,
            sessionId,
            timestamp: new Date().toISOString()
          });
          
          eventSource.close();
          reject(err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('❌ EventSource error:', err);
        console.error('🔍 EventSource readyState:', eventSource.readyState);

        const errorDetails = {
          readyState: eventSource.readyState,
          connectionEstablished,
          sessionId,
          question: question.substring(0, 100) + '...',
          timestamp: new Date().toISOString(),
          url: eventSourceUrl
        };

        if (!connectionEstablished) {
          logError('EventSource - Failed to establish connection', errorDetails);
          reject(new Error('Failed to establish connection to server'));
        } else {
          logError('EventSource - Connection lost', errorDetails);
          reject(new Error('Connection to server was lost'));
        }

        eventSource.close();
      };

      // Enhanced cleanup timeout with logging
      setTimeout(() => {
        if (eventSource.readyState !== EventSource.CLOSED) {
          console.log('Request timeout, closing EventSource');

          logError('EventSource - Request timeout', {
            sessionId,
            question: question.substring(0, 100) + '...',
            readyState: eventSource.readyState,
            connectionEstablished,
            timeoutDuration: 60000
          });

          eventSource.close();
          reject(new Error('Request timeout - no response from server'));
        }
      }, 60000);
    });
  };

  const endSession = async () => {
    if (!sessionData?.sessionId) return;

    try {
      setIsLoading(true);
      const response = await api.endSimulation(sessionData.sessionId);

      setIsSessionEnded(true);
      setEvaluation(response.evaluation || 'Session completed successfully.');

      console.log('✅ Session completed successfully.');

      console.log('📊 Session ended successfully', {
        sessionId: sessionData.sessionId,
        caseId,
        messageCount: messages.length,
        duration: sessionData.startedAt ? Date.now() - new Date(sessionData.startedAt).getTime() : 'unknown'
      });
      
    } catch (error) {
      console.error('Error ending session:', error);
      
      logError('Failed to end session', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: sessionData.sessionId,
        caseId,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorMessage: Message = {
        id: 'session-end-error-' + Date.now(),
        role: 'assistant',
        content: '⚠️ **Session End Error**\n\nThere was an issue ending your session properly. Your progress may still be saved. You can safely navigate away from this page.',
        timestamp: new Date(),
        speaks_for: 'System',
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      setIsSessionEnded(true);
      setEvaluation('Session ended with errors. Your progress may still be saved.');
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Enhanced error display
  if (simulationError) {
    const getErrorIcon = (type: string) => {
      switch (type) {
        case 'network': return '🌐';
        case 'auth': return '🔒';
        case 'invalid_case': return '📋';
        case 'server': return '🖥️';
        case 'timeout': return '⏱️';
        default: return '⚠️';
      }
    };

    const getErrorColor = (type: string) => {
      switch (type) {
        case 'network': return 'blue';
        case 'auth': return 'red';
        case 'invalid_case': return 'yellow';
        case 'server': return 'purple';
        case 'timeout': return 'orange';
        default: return 'red';
      }
    };

    const errorColor = getErrorColor(simulationError.type);

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className={`w-20 h-20 bg-${errorColor}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
            <span className="text-3xl">{getErrorIcon(simulationError.type)}</span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {simulationError.type === 'network' && 'Connection Problem'}
            {simulationError.type === 'auth' && 'Authentication Required'}
            {simulationError.type === 'invalid_case' && 'Case Not Found'}
            {simulationError.type === 'server' && 'Server Error'}
            {simulationError.type === 'timeout' && 'Request Timeout'}
            {simulationError.type === 'unknown' && 'Unexpected Error'}
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {simulationError.userMessage}
          </p>

          {import.meta.env.DEV && (
            <div className="mb-6 p-3 bg-gray-100 rounded text-left text-sm">
              <strong>Debug Info:</strong><br />
              Type: {simulationError.type}<br />
              Message: {simulationError.message}<br />
              Case ID: {caseId}<br />
              Retry Count: {retryCount}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {simulationError.canRetry && (
              <button
                onClick={retrySimulationStartup}
                disabled={isRetrying}
                className={`px-6 py-3 bg-${errorColor}-600 text-white rounded-lg hover:bg-${errorColor}-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2`}
              >
                {isRetrying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Retrying...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Try Again</span>
                  </>
                )}
              </button>
            )}

            {simulationError.action === 'login' && (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>🔑</span>
                <span>Sign In</span>
              </button>
            )}

            {simulationError.action === 'redirect' && (
              <button
                onClick={() => {
                  const navigationState = {
                    specialtyContext: location.state?.specialtyContext,
                    fromSimulationError: true,
                    errorType: simulationError.type
                  };

                  if (simulationError.redirectUrl) {
                    navigate(simulationError.redirectUrl, { state: navigationState });
                  } else {
                    // Navigate directly to browse-cases for consistent case browsing experience
                    navigate('/browse-cases', { state: navigationState });
                  }
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>←</span>
                <span>Back to Cases</span>
              </button>
            )}

            {simulationError.action === 'none' && (
              <button
                onClick={() => {
                  const navigationState = {
                    specialtyContext: location.state?.specialtyContext,
                    fromSimulationError: true,
                    errorType: simulationError.type
                  };

                  // Navigate directly to browse-cases for consistent case browsing experience
                  navigate('/browse-cases', { state: navigationState });
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>←</span>
                <span>Back to Cases</span>
              </button>
            )}
          </div>

          {!simulationError.canRetry && simulationError.action === 'redirect' && (
            <div className="mt-4 text-sm text-gray-500">
              Automatically redirecting in a few seconds...
            </div>
          )}

          {simulationError.action === 'login' && (
            <div className="mt-4 text-sm text-gray-500">
              Redirecting to login page...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enhanced loading screen
  if ((isLoading && messages.length === 0) || simulationStartupState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-white font-bold text-2xl">ST</span>
            </div>
            {simulationStartupState.phase !== 'idle' && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-sm">
                    {simulationStartupState.phase === 'validating_case' && '🔍'}
                    {simulationStartupState.phase === 'creating_session' && '⚙️'}
                    {simulationStartupState.phase === 'loading_patient' && '👤'}
                    {simulationStartupState.phase === 'initializing_chat' && '💬'}
                    {simulationStartupState.phase === 'complete' && '✅'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                {simulationStartupState.phase !== 'idle' ? simulationStartupState.message : 
                 (urlAccessPattern === 'case-only' ? 'Starting your simulation...' : 'Loading simulation session...')}
              </span>
              <span className="text-sm text-gray-500">
                {simulationStartupState.progress > 0 ? `${simulationStartupState.progress}%` : ''}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: simulationStartupState.progress > 0 ? `${simulationStartupState.progress}%` : '20%'
                }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {simulationStartupState.phase === 'validating_case' && 'Validating Case'}
              {simulationStartupState.phase === 'creating_session' && 'Creating Session'}
              {simulationStartupState.phase === 'loading_patient' && 'Loading Patient'}
              {simulationStartupState.phase === 'initializing_chat' && 'Initializing Chat'}
              {simulationStartupState.phase === 'complete' && 'Ready to Start!'}
              {simulationStartupState.phase === 'idle' && (
                urlAccessPattern === 'case-only' ? 'Starting Simulation' : 'Loading Session'
              )}
            </h3>
            
            <p className="text-sm text-gray-600">
              {simulationStartupState.phase === 'validating_case' && 
                'Checking case availability and permissions...'}
              {simulationStartupState.phase === 'creating_session' && 
                'Setting up your personalized simulation environment...'}
              {simulationStartupState.phase === 'loading_patient' && 
                'Preparing patient data and medical history...'}
              {simulationStartupState.phase === 'initializing_chat' && 
                'Configuring the chat interface and AI responses...'}
              {simulationStartupState.phase === 'complete' && 
                'Everything is ready! Redirecting to your simulation...'}
              {simulationStartupState.phase === 'idle' && (
                urlAccessPattern === 'case-only' 
                  ? `Preparing case: ${caseId}`
                  : `Loading session: ${sessionId}`
              )}
            </p>

            <div className="flex justify-center space-x-2 mt-4">
              {['validating_case', 'creating_session', 'loading_patient', 'initializing_chat', 'complete'].map((phase, index) => (
                <div
                  key={phase}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    simulationStartupState.phase === phase
                      ? 'bg-blue-500 animate-pulse scale-125'
                      : simulationStartupState.progress > (index * 20)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left">
              <strong>Debug:</strong><br />
              Phase: {simulationStartupState.phase}<br />
              Progress: {simulationStartupState.progress}%<br />
              URL Pattern: {urlAccessPattern}<br />
              Case ID: {caseId}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-stable-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-medical-600 via-medical-500 to-stable-500 text-white shadow-medical-lg border-b border-medical-700">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <span className="text-medical-700 font-bold text-xs sm:text-sm">🏥</span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">Basic program</h1>
                  <p className="text-xs text-medical-100 hidden sm:block">(Explore and learn)</p>
                </div>
              </div>

              {(sessionData || simulationStartupState.isLoading) && (
                <div className="flex items-center space-x-2 sm:space-x-3 sm:ml-8 sm:pl-8 sm:border-l border-white/20">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    simulationStartupState.isLoading
                      ? 'bg-white/20 animate-pulse border-2 border-white/40'
                      : 'bg-white/20 border-2 border-white/40'
                  }`}>
                    <span className="text-white text-sm sm:text-lg">
                      {simulationStartupState.isLoading ? '⏳' : '👤'}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-semibold text-white text-sm sm:text-base">
                      {simulationStartupState.isLoading
                        ? (simulationStartupState.phase === 'loading_patient' ? 'Loading Patient...' : 'Setting Up...')
                        : (() => {
                            const speaksFor = sessionData?.speaks_for;
                            const patientName = sessionData?.patientName || sessionData?.patient_name || sessionData?.name || 'Patient';
                            const normalizedSpeaksFor = normalizeSpeaksFor(speaksFor);
                            return (!normalizedSpeaksFor || normalizedSpeaksFor === 'Self') ? patientName : normalizedSpeaksFor;
                          })()
                      }
                    </p>
                    <p className="text-xs sm:text-sm text-medical-100 flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        simulationStartupState.isLoading
                          ? 'bg-medical-200 animate-bounce'
                          : 'bg-stable-200 animate-pulse'
                      }`}></span>
                      {simulationStartupState.isLoading
                        ? simulationStartupState.message || 'Initializing...'
                        : 'Active Session'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
              <div className="text-left sm:text-right sm:mr-4 hidden sm:block">
                <p className="text-xs text-medical-100">Session Time</p>
                <time className="text-sm font-mono text-white">
                  {new Date().toLocaleTimeString()}
                </time>
              </div>

              {!isSessionEnded && (
                <button
                  onClick={endSession}
                  disabled={isLoading}
                  className="px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg text-sm border border-red-400"
                >
                  <span className="flex items-center space-x-1 sm:space-x-2">
                    <span>🏁</span>
                    <span className="hidden sm:inline">End Session</span>
                    <span className="sm:hidden">End</span>
                  </span>
                </button>
              )}
              <button
                onClick={() => {
                  const navigationState = {
                    specialtyContext: location.state?.specialtyContext,
                    fromSimulation: true,
                    sessionId: sessionData?.sessionId,
                    caseId: caseId
                  };

                  // Navigate directly to browse-cases for consistent case browsing experience
                  navigate('/browse-cases', { state: navigationState });
                }}
                className="px-2 py-1 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 shadow-md hover:shadow-lg text-sm border border-white/20"
              >
                <span className="flex items-center space-x-1 sm:space-x-2">
                  <span>←</span>
                  <span className="hidden sm:inline">Back to Cases</span>
                  <span className="sm:hidden">Back</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {!isSessionEnded && (
          <div className="px-3 sm:px-6 pb-3">
            <div className="flex items-center justify-between text-xs text-medical-100 mb-2">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-medical-200 rounded-full mr-2"></span>
                {simulationStartupState.isLoading ? 'System Startup' : 'Clinical Progress'}
              </span>
              <span>
                {simulationStartupState.isLoading
                  ? `${simulationStartupState.progress}%`
                  : `${messages.filter((m) => m.role === 'user').length} questions`
                }
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  simulationStartupState.isLoading
                    ? 'bg-gradient-to-r from-medical-200 to-medical-400'
                    : 'bg-gradient-to-r from-medical-300 to-stable-400'
                }`}
                style={{
                  width: simulationStartupState.isLoading
                    ? `${simulationStartupState.progress}%`
                    : `${Math.min(
                        (messages.filter((m) => m.role === 'user').length / 10) * 100,
                        100
                      )}%`,
                }}
              ></div>
            </div>

            {simulationStartupState.phase === 'complete' && (
              <div className="mt-2 text-xs text-stable-200 flex items-center animate-fade-in">
                <span className="w-2 h-2 bg-stable-300 rounded-full mr-2 animate-pulse"></span>
                Patient ready for consultation. Begin clinical assessment.
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`flex items-start space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-none ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-medical-500 to-medical-600'
                      : message.speaks_for === 'System'
                      ? 'bg-gradient-to-br from-stable-500 to-stable-600'
                      : 'bg-gradient-to-br from-warning-500 to-warning-600'
                  }`}>
                    <span className="text-white text-xs sm:text-sm font-medium">
                      {message.role === 'user' ? '👨‍⚕️' : message.speaks_for === 'System' ? 'ℹ️' : '🤒'}
                    </span>
                  </div>

                  <div className={`flex-1 sm:max-w-md lg:max-w-lg ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {message.role === 'assistant' && message.speaks_for && (
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div className={`text-xs font-semibold ${
                          message.speaks_for === 'System' ? 'text-stable-700' : 'text-warning-700'
                        }`}>
                          {message.speaks_for === 'System' ? 'System Guide' : message.speaks_for}
                        </div>
                      </div>
                    )}

                    <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-md ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-medical-500 to-medical-600 text-white'
                        : message.speaks_for === 'System'
                        ? 'bg-gradient-to-br from-stable-50 to-stable-100 text-gray-800 border-l-4 border-stable-400'
                        : 'bg-white text-gray-900 border border-gray-200 shadow-lg'
                    }`}>
                      <div
                        className={`text-sm sm:text-base ${
                          message.speaks_for === 'System' ? 'leading-relaxed' : ''
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: formatMessageContent(message.content)
                        }}
                      />
                    </div>

                    <div className={`flex items-center justify-between mt-1 sm:mt-2`}>
                      <div className={`text-xs ${
                        message.role === 'user' ? 'text-medical-300' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && messages.length > 0 && (
              <div className="flex justify-start animate-fade-in max-w-[85%] sm:max-w-none">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <span className="text-white text-xs sm:text-sm font-medium">🤒</span>
                  </div>
                  <div className="flex-1 sm:max-w-md lg:max-w-lg">
                    <div className="text-xs mb-1 sm:mb-2 font-semibold text-purple-700">
                      {(() => {
                        const speaksFor = sessionData?.speaks_for;
                        const patientName = sessionData?.patientName || sessionData?.patient_name || sessionData?.name || 'Patient';
                        const normalizedSpeaksFor = normalizeSpeaksFor(speaksFor);
                        return (!normalizedSpeaksFor || normalizedSpeaksFor === 'Self') ? patientName : normalizedSpeaksFor;
                      })()}
                    </div>
                    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-lg px-3 py-2 sm:px-4 sm:py-3 rounded-2xl pulse-glow">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600 font-medium">
                            {(() => {
                              const speaksFor = sessionData?.speaks_for;
                              const patientName = sessionData?.patientName || sessionData?.patient_name || sessionData?.name || 'Patient';
                              const normalizedSpeaksFor = normalizeSpeaksFor(speaksFor);
                              return (!normalizedSpeaksFor || normalizedSpeaksFor === 'Self') ? patientName : normalizedSpeaksFor;
                            })()}{' '}
                            {!isSessionEnded ? 'is thinking...' : 'Generating report...'}
                          </span>
                          <div className="mt-1">
                            <div className="w-24 bg-gray-200 rounded-full h-1">
                              <div className="bg-purple-400 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Session Report */}
          {isSessionEnded && evaluation && (
            <div className="bg-gradient-to-br from-medical-50 via-white to-stable-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-t border-medical-200 dark:border-medical-800 shadow-medical-lg">
              <div className="p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-medical-500 to-medical-600 rounded-medical-xl flex items-center justify-center mx-auto mb-6 shadow-medical-lg">
                      <span className="text-white text-3xl">📊</span>
                    </div>
                    <h2 className="text-3xl font-bold text-medical-900 dark:text-medical-100 mb-3">
                      Session Complete
                    </h2>
                    <p className="text-medical-700 dark:text-medical-300 text-lg">
                      Your simulation session has ended successfully
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-medical-xl shadow-medical-lg border border-medical-200 dark:border-medical-700 p-6 mb-8">
                    <h3 className="text-xl font-semibold text-medical-900 dark:text-medical-100 mb-6 flex items-center">
                      <span className="w-10 h-10 bg-gradient-to-br from-medical-500 to-medical-600 rounded-medical-lg flex items-center justify-center mr-4 shadow-medical">
                        📋
                      </span>
                      Performance Report
                    </h3>

                    <div className="prose prose-medical dark:prose-invert max-w-none">
                      <div
                        className="text-medical-800 dark:text-medical-200 leading-relaxed text-base"
                        dangerouslySetInnerHTML={{
                          __html: formatMessageContent(evaluation)
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-medical-xl shadow-medical-lg border border-medical-200 dark:border-medical-700 p-6 mb-8">
                    <h3 className="text-xl font-semibold text-medical-900 dark:text-medical-100 mb-6 flex items-center">
                      <span className="w-10 h-10 bg-gradient-to-br from-stable-500 to-stable-600 rounded-medical-lg flex items-center justify-center mr-4 shadow-stable">
                        📈
                      </span>
                      Session Summary
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gradient-to-br from-medical-50 to-medical-100 dark:from-medical-900/30 dark:to-medical-800/30 rounded-medical-lg border border-medical-200 dark:border-medical-700">
                        <div className="text-3xl font-bold text-medical-600 dark:text-medical-400 mb-2">
                          {messages.filter(m => m.role === 'user').length}
                        </div>
                        <div className="text-sm font-medium text-medical-700 dark:text-medical-300">
                          Questions Asked
                        </div>
                      </div>

                      <div className="text-center p-6 bg-gradient-to-br from-stable-50 to-stable-100 dark:from-stable-900/30 dark:to-stable-800/30 rounded-medical-lg border border-stable-200 dark:border-stable-700">
                        <div className="text-3xl font-bold text-stable-600 dark:text-stable-400 mb-2">
                          {messages.filter(m => m.role === 'assistant').length}
                        </div>
                        <div className="text-sm font-medium text-stable-700 dark:text-stable-300">
                          Patient Responses
                        </div>
                      </div>

                      <div className="text-center p-6 bg-gradient-to-br from-info-50 to-info-100 dark:from-info-900/30 dark:to-info-800/30 rounded-medical-lg border border-info-200 dark:border-info-700">
                        <div className="text-3xl font-bold text-info-600 dark:text-info-400 mb-2">
                          {sessionData?.startedAt ?
                            Math.round((Date.now() - new Date(sessionData.startedAt).getTime()) / 60000)
                            : 'N/A'
                          }
                        </div>
                        <div className="text-sm font-medium text-info-700 dark:text-info-300">
                          Minutes Duration
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => {
                        const navigationState = {
                          specialtyContext: location.state?.specialtyContext,
                          fromSimulation: true,
                          sessionId: sessionData?.sessionId,
                          caseId: caseId,
                          completedSession: true
                        };

                        // Navigate directly to browse-cases for consistent case browsing experience
                        navigate('/browse-cases', { state: navigationState });
                      }}
                      className="px-8 py-4 bg-gradient-to-r from-medical-500 to-medical-600 text-white rounded-medical-lg hover:from-medical-600 hover:to-medical-700 transition-all duration-200 shadow-medical-lg hover:shadow-medical-lg transform hover:scale-[1.02] flex items-center justify-center space-x-3 font-semibold"
                    >
                      <span className="text-lg">←</span>
                      <span>Back to Cases</span>
                    </button>

                    <button
                      onClick={() => setShowRetakeModal(true)}
                      className="px-8 py-4 bg-gradient-to-r from-stable-500 to-stable-600 text-white rounded-medical-lg hover:from-stable-600 hover:to-stable-700 transition-all duration-200 shadow-stable hover:shadow-stable-lg transform hover:scale-[1.02] flex items-center justify-center space-x-3 font-semibold"
                    >
                      <span className="text-lg">🔄</span>
                      <span>Retake This Case</span>
                    </button>

                    <button
                      onClick={() => {
                        // Copy report to clipboard
                        navigator.clipboard.writeText(evaluation).then(() => {
                          // Show brief success message
                          const successMsg: Message = {
                            id: 'copy-success-' + Date.now(),
                            role: 'assistant',
                            content: '✅ **Report Copied!**\n\nYour session report has been copied to the clipboard.',
                            timestamp: new Date(),
                            speaks_for: 'System',
                          };
                          setMessages(prev => [...prev, successMsg]);
                        }).catch(() => {
                          const errorMsg: Message = {
                            id: 'copy-error-' + Date.now(),
                            role: 'assistant',
                            content: '❌ **Copy Failed**\n\nUnable to copy report to clipboard. Please select and copy manually.',
                            timestamp: new Date(),
                            speaks_for: 'System',
                          };
                          setMessages(prev => [...prev, errorMsg]);
                        });
                      }}
                      className="px-8 py-4 bg-gradient-to-r from-info-500 to-info-600 text-white rounded-medical-lg hover:from-info-600 hover:to-info-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-3 font-semibold"
                    >
                      <span className="text-lg">📋</span>
                      <span>Copy Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Section */}
          {!isSessionEnded && (
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-end space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1 w-full">
                    <div className="relative">
                      <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                          messages.length <= 1
                            ? "Start with: 'What brings you in today?'"
                            : 'Ask your next question...'
                        }
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-medical-500 focus:ring-4 focus:ring-medical-100 resize-none transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                        rows={2}
                        disabled={isLoading}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {inputMessage.length}/500
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-medical-500 to-medical-600 text-white rounded-2xl hover:from-medical-600 hover:to-medical-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send</span>
                        <span>📤</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Retake Modal */}
      <RetakeModal
        isOpen={showRetakeModal}
        onClose={() => setShowRetakeModal(false)}
        caseId={caseId || ''}
        caseTitle={sessionData?.caseTitle || sessionData?.case_title || 'Unknown Case'}
        previousSessionId={sessionData?.sessionId}
        onRetakeSuccess={(newSessionId) => {
          const newUrl = `/simulation/${caseId}/session/${newSessionId}`;
          navigate(newUrl, {
            state: {
              specialtyContext: specialtyContext,
              isRetake: true,
              previousSessionId: sessionData?.sessionId
            }
          });
        }}
      />
    </div>
  );
};

export default SimulationChatPage;