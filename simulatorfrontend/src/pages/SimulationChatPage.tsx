import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { RetakeButton, RetakeModal, RetakeHistory } from '../components/retake';
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
  
  // Get specialty context from navigation state
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
  
  // Retake functionality state
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [showRetakeHistory, setShowRetakeHistory] = useState(false);
  
  // Enhanced loading states for simulation startup - Requirements 2.2, 2.3, 2.4
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
  
  // Enhanced state management for different URL access patterns - Requirements 1.1, 1.2, 2.1
  const [urlAccessPattern, setUrlAccessPattern] = useState<'case-only' | 'case-with-session' | 'invalid'>('invalid');
  
  // Comprehensive error handling state - Requirements 3.1, 3.2, 3.3, 3.4
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

  // Bookmark compatibility handler - Requirement 4.4
  useEffect(() => {
    // Ensure bookmark compatibility by validating and potentially correcting URLs
    const currentUrl = window.location.pathname;
    
    if (isValidSimulationUrl(currentUrl)) {
      console.log('✅ Valid simulation URL detected for bookmark compatibility');
      
      // Update page title for better bookmark experience
      if (sessionData?.patientName) {
        document.title = `Simulation: ${sessionData.patientName} - Simuatech`;
      } else if (caseId) {
        document.title = `Case ${caseId} - Simuatech`;
      }
    }
  }, [caseId, sessionId, sessionData?.patientName]);

  // Enhanced URL validation and pattern detection - Requirements 1.1, 1.2, 4.4
  useEffect(() => {
    // Validate current URL for bookmark compatibility - Requirement 4.4
    const currentUrl = window.location.pathname;
    const urlValidation = parseSimulationUrl(currentUrl);
    
    console.log('🔍 URL Validation:', { 
      currentUrl, 
      validation: urlValidation, 
      params: { caseId, sessionId } 
    });

    // Ensure URL parameters match the parsed URL for consistency
    if (urlValidation.isValid) {
      if (urlValidation.caseId !== caseId || urlValidation.sessionId !== sessionId) {
        console.warn('⚠️ URL parameter mismatch detected', {
          parsed: urlValidation,
          params: { caseId, sessionId }
        });
      }
    }

    // Set URL access pattern based on validation and parameters
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
    
    // Clear any previous startup errors - Requirement 3.1
    setSimulationError(null);
    setRetryCount(0);
    
    // Handle different URL access patterns - Requirements 1.1, 1.2, 2.1
    switch (urlAccessPattern) {
      case 'case-only':
        // Direct case access - automatically start new simulation
        if (!sessionData) {
          console.log('🚀 Case-only URL detected - Starting new simulation for case:', caseId);
          startNewSimulation();
        }
        break;
        
      case 'case-with-session':
        // Existing session access - load session data
        if (!sessionData) {
          console.log('🔄 Case+Session URL detected - Loading existing session:', sessionId);
          // For existing sessions, set minimal session data to prevent re-triggering
          // This will be enhanced in future tasks for session resumption
          setSessionData({ 
            sessionId, 
            patientName: 'Loading...', 
            caseId,
            urlAccessPattern: 'case-with-session'
          });
        }
        break;
        
      case 'invalid':
        // Invalid URL pattern - handle error - Requirement 3.1
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

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        console.log('🧹 Cleaning up EventSource');
        eventSourceRef.current.close();
      }
    };
  }, [caseId, sessionId, urlAccessPattern]); // Include urlAccessPattern in dependencies

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Enhanced error logging function - Requirement 3.4
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
    
    // In production, this would send to error tracking service
    if (import.meta.env.PROD) {
      // Example: Send to error tracking service
      // errorTrackingService.log(errorLog);
    }
  };

  // Create error object based on error type - Requirements 3.1, 3.2, 3.3
  const createErrorFromException = (error: any): SimulationError => {
    console.error('🔍 Analyzing error:', error);
    
    // Network/Connection errors - Requirement 3.1
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
    
    // Authentication errors - Requirement 3.2
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
    
    // Invalid case errors - Requirement 3.3
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
    
    // Timeout errors
    if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
      return {
        type: 'timeout',
        message: error.message || 'Request timeout',
        userMessage: 'The request is taking too long. Please try again.',
        action: 'retry',
        canRetry: true
      };
    }
    
    // Server errors (5xx)
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
    
    // Unknown errors
    return {
      type: 'unknown',
      message: error.message || 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      action: 'retry',
      canRetry: true
    };
  };

  // Retry simulation startup - Requirement 3.1
  const retrySimulationStartup = async () => {
    if (!simulationError?.canRetry || isRetrying) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    console.log(`🔄 Retrying simulation startup (attempt ${retryCount + 1})`);
    
    try {
      // Clear previous error and reset startup state - Requirement 2.4
      setSimulationError(null);
      setSimulationStartupState({
        phase: 'idle',
        progress: 0,
        message: '',
        isLoading: false
      });
      
      // Add delay for network issues
      if (simulationError.type === 'network') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Retry the simulation startup
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

    // Prevent starting a new simulation if one is already in progress
    if (sessionData && !isSessionEnded && sessionData.sessionId) {
      console.log('⚠️ Simulation already in progress, not starting a new one');
      return;
    }

    try {
      // Initialize enhanced loading state - Requirement 2.2
      setSimulationStartupState({
        phase: 'validating_case',
        progress: 10,
        message: `Validating case ${caseId}...`,
        isLoading: true
      });
      
      setIsLoading(true);
      setSimulationError(null);
      console.log('🚀 Starting new simulation for case-only URL:', caseId);
      
      // Simulate case validation phase - Requirement 2.2
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSimulationStartupState({
        phase: 'creating_session',
        progress: 30,
        message: 'Creating new simulation session...',
        isLoading: true
      });
      
      const response = await api.startSimulation(caseId);
      console.log('🔍 API Response received:', response);

      // Validate API response - Requirement 3.1
      if (!response) {
        throw new Error('No response received from server');
      }
      
      // Update progress for session creation - Requirement 2.3
      setSimulationStartupState({
        phase: 'loading_patient',
        progress: 60,
        message: 'Loading patient information...',
        isLoading: true
      });
      
      // Simulate patient data loading - Requirement 2.3
      await new Promise(resolve => setTimeout(resolve, 600));

      // Handle different possible response structures from backend - Requirement 2.1
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

      // Enhanced session data structure for better state management - Requirements 1.2, 2.1
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
      
      // Update progress for chat initialization - Requirement 2.3
      setSimulationStartupState({
        phase: 'initializing_chat',
        progress: 85,
        message: `Preparing chat interface for ${patientName}...`,
        isLoading: true
      });
      
      // Simulate chat initialization - Requirement 2.3
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSessionData(enhancedSessionData);

      const messages: Message[] = [];

      // Add system welcome message - Requirement 2.2
      const displayName = (!speaksFor || speaksFor === 'Self') ? patientName : speaksFor;
      const systemMessage: Message = {
        id: 'system-' + Date.now(),
        role: 'assistant',
        content: `🏥 **Welcome to Simuatech**\n\nYou are now interacting with ${displayName}. This is a safe learning environment where you can practice your clinical skills.\n\n**How to interact:**\n• Ask questions about symptoms, medical history, or concerns\n• Conduct a virtual examination by asking specific questions\n• Practice your diagnostic reasoning\n• The patient will respond realistically based on their condition\n\n**Tips:**\n• Start with open-ended questions like "What brings you in today?"\n• Be thorough in your questioning\n• Take your time - there's no rush\n\nType your first question below to begin the consultation. Good luck! 👩‍⚕️👨‍⚕️`,
        timestamp: new Date(),
        speaks_for: 'System',
      };
      messages.push(systemMessage);

      // Add initial prompt from patient if available - Requirement 2.1, 2.2
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
        console.log('⚠️ No initial prompt, adding default greeting - Requirement 2.2');
        const displayName = (!speaksFor || speaksFor === 'Self') ? patientName : speaksFor;
        const defaultMessage: Message = {
          id: 'patient-default-' + Date.now(),
          role: 'assistant',
          content: `Hello, I'm ${displayName}. Thank you for seeing me today. How can I help you?`,
          timestamp: new Date(),
          speaks_for: (!speaksFor || speaksFor === 'Self') ? patientName : speaksFor,
        };
        messages.push(defaultMessage);
      }

      console.log('📝 Setting messages:', messages.map(m => ({
        id: m.id,
        role: m.role,
        speaks_for: m.speaks_for,
        content: m.content.substring(0, 50) + '...'
      })));

      // Complete startup process - Requirement 2.4
      setSimulationStartupState({
        phase: 'complete',
        progress: 100,
        message: 'Simulation ready!',
        isLoading: false
      });
      
      // Set messages immediately after setting session data
      setMessages(messages);
      
      // Smooth transition to active state - Requirement 2.4
      setTimeout(() => {
        setMessages(() => [...messages]);
        
        // Clear startup state after smooth transition
        setTimeout(() => {
          setSimulationStartupState({
            phase: 'idle',
            progress: 0,
            message: '',
            isLoading: false
          });
        }, 1000);
      }, 300);

      // Enhanced automatic URL redirection with specialty context preservation - Requirements 1.2, 4.1, 4.2, 4.4
      console.log('🔄 Redirecting to session URL for consistency and bookmark compatibility');
      
      // Create consistent session URL using utility function - Requirement 4.4
      const sessionUrl = createSimulationSessionUrl(caseId, sessionId);
      
      // Preserve specialty context during URL redirection using utility - Requirements 4.1, 4.2
      const preservedState = preserveSpecialtyContext(location.state, {
        fromCaseOnlyUrl: true,
        originalCaseUrl: createSimulationCaseUrl(caseId),
        sessionStartedAt: new Date().toISOString()
      });

      // Ensure specialty context exists even if not provided - Requirement 4.1
      if (!preservedState.specialtyContext) {
        // Try to extract specialty from referrer or current URL
        const referrerSpecialty = document.referrer.includes('/') ? 
          document.referrer.split('/').pop()?.replace(/_/g, ' ') : null;
        
        preservedState.specialtyContext = createSpecialtyContext(
          referrerSpecialty || undefined, 
          '/simulation'
        );
      }

      // Use replace: true to maintain bookmark compatibility - users bookmarking the case-only URL
      // will still work, but the URL will be updated to the session URL for consistency
      navigate(sessionUrl, { 
        replace: true,
        state: preservedState
      });

      // Update browser history for bookmark compatibility - Requirement 4.4
      // This ensures that if users bookmark the page after redirection, they get the session URL
      updateBrowserHistoryForBookmarks(
        sessionUrl,
        `Simulation: ${enhancedSessionData.patientName}`,
        preservedState
      );

    } catch (error) {
      console.error('❌ Error starting simulation:', error);
      
      // Create comprehensive error object - Requirements 3.1, 3.2, 3.3, 3.4
      const simulationError = createErrorFromException(error);
      setSimulationError(simulationError);
      
      // Log detailed error information for debugging - Requirement 3.4
      logError('Simulation startup failed', {
        error: error instanceof Error ? error.message : String(error),
        errorType: simulationError.type,
        caseId,
        retryCount,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Enhanced automatic redirects with specialty context preservation - Requirements 4.1, 4.2
      if (!simulationError.canRetry && simulationError.action === 'redirect') {
        setTimeout(() => {
          // Preserve specialty context during error redirects - Requirement 4.1
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
            // Default fallback with specialty context if available
            const fallbackUrl = location.state?.specialtyContext?.returnUrl || '/simulation';
            navigate(fallbackUrl, { state: redirectState });
          }
        }, 4000); // Increased delay to allow user to read error message
      }
      
      // Handle authentication redirects
      if (simulationError.action === 'login') {
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
      
    } finally {
      setIsLoading(false);
      // Reset startup state on error - Requirement 2.4
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

    // Test backend connectivity first
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

      // Enhanced error handling for message sending - Requirements 3.1, 3.2, 3.4
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

      // Add error message with enhanced formatting
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
      console.log('🔑 Using token:', token.substring(0, 20) + '...');
      console.log('📝 Session ID:', sessionId);
      console.log('❓ Question:', question);

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
          // If speaks_for is "Self" or empty, use patient name; otherwise use speaks_for
          return (!speaksFor || speaksFor === 'Self') ? patientName : speaksFor;
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
                // Update the assistant message with the correct speaker name from the backend
                // If speaks_for is present and not "Self", use it (e.g., "Mother" for parent speaking for child)
                // Otherwise use the patient's name
                const speakerName = (data.speaks_for && data.speaks_for !== 'Self') 
                  ? data.speaks_for 
                  : (data.name || sessionData?.patientName || 'Patient');
                assistantMessage.speaks_for = speakerName;
                setMessages((prev) => [...prev, assistantMessage]);
                hasStarted = true;
              }

              assistantMessage.content += data.content;
              // Use speaks_for if available and not "Self" (for cases where someone speaks for the patient)
              // Otherwise use the patient's name
              const speakerName = (data.speaks_for && data.speaks_for !== 'Self') 
                ? data.speaks_for 
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
          
          // Enhanced error logging for SSE parsing - Requirement 3.4
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
        console.error('🌐 EventSource URL:', eventSource.url);

        // Enhanced error logging for streaming - Requirement 3.4
        const errorDetails = {
          readyState: eventSource.readyState,
          connectionEstablished,
          sessionId,
          question: question.substring(0, 100) + '...',
          timestamp: new Date().toISOString(),
          url: eventSource.url
        };

        if (!connectionEstablished) {
          // Connection failed to establish - Requirement 3.1
          logError('EventSource - Failed to establish connection', errorDetails);
          reject(new Error('Failed to establish connection to server'));
        } else {
          // Connection was established but then failed - Requirement 3.1
          logError('EventSource - Connection lost', errorDetails);
          reject(new Error('Connection to server was lost'));
        }

        eventSource.close();
      };

      // Enhanced cleanup timeout with logging - Requirement 3.4
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
      }, 60000); // Increased timeout to 60 seconds
    });
  };

  const endSession = async () => {
    if (!sessionData?.sessionId) return;

    try {
      setIsLoading(true);
      const response = await api.endSimulation(sessionData.sessionId);

      setIsSessionEnded(true);
      setEvaluation(response.evaluation || 'Session completed successfully.');

      // Log completion for debugging progress tracking
      console.log('✅ Session completed successfully. Progress should be updated.');
      
      logError('Session ended successfully', {
        sessionId: sessionData.sessionId,
        caseId,
        messageCount: messages.length,
        duration: sessionData.startedAt ? Date.now() - new Date(sessionData.startedAt).getTime() : 'unknown'
      });
      
    } catch (error) {
      console.error('Error ending session:', error);
      
      // Enhanced error handling for session ending - Requirements 3.1, 3.4
      logError('Failed to end session', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: sessionData.sessionId,
        caseId,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Show user-friendly error message
      const errorMessage: Message = {
        id: 'session-end-error-' + Date.now(),
        role: 'assistant',
        content: '⚠️ **Session End Error**\n\nThere was an issue ending your session properly. Your progress may still be saved. You can safely navigate away from this page.',
        timestamp: new Date(),
        speaks_for: 'System',
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      // Still mark session as ended to allow user to continue
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

  // Enhanced error display with comprehensive error handling - Requirements 3.1, 3.2, 3.3, 3.4
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
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

          {/* Error details for debugging (dev mode only) */}
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
            {/* Retry button for retryable errors */}
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

            {/* Action buttons based on error type */}
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
                  // Enhanced navigation with specialty context preservation - Requirements 4.1, 4.2
                  const navigationState = {
                    specialtyContext: location.state?.specialtyContext,
                    fromSimulationError: true,
                    errorType: simulationError.type
                  };

                  if (simulationError.redirectUrl) {
                    navigate(simulationError.redirectUrl, { state: navigationState });
                  } else if (specialtyContext?.returnUrl) {
                    navigate(specialtyContext.returnUrl, { state: navigationState });
                  } else {
                    // Enhanced fallback with specialty context preservation
                    const fallbackUrl = location.state?.specialtyContext?.returnUrl || '/simulation';
                    navigate(fallbackUrl, { state: navigationState });
                  }
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>←</span>
                <span>Back to Cases</span>
              </button>
            )}

            {/* Always show a back button */}
            {simulationError.action === 'none' && (
              <button
                onClick={() => {
                  // Enhanced navigation with specialty context preservation - Requirements 4.1, 4.2
                  const navigationState = {
                    specialtyContext: location.state?.specialtyContext,
                    fromSimulationError: true,
                    errorType: simulationError.type
                  };

                  if (specialtyContext?.returnUrl) {
                    navigate(specialtyContext.returnUrl, { state: navigationState });
                  } else {
                    // Enhanced fallback with specialty context preservation
                    const fallbackUrl = location.state?.specialtyContext?.returnUrl || '/simulation';
                    navigate(fallbackUrl, { state: navigationState });
                  }
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>←</span>
                <span>Back to Cases</span>
              </button>
            )}
          </div>

          {/* Auto-redirect message */}
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

  // Enhanced loading screen with detailed progress - Requirements 2.2, 2.3, 2.4
  if ((isLoading && messages.length === 0) || simulationStartupState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          {/* Animated Logo/Icon */}
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

          {/* Progress Bar - Requirement 2.2 */}
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

          {/* Phase-specific content - Requirement 2.3 */}
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

            {/* Animated steps indicator - Requirement 2.3 */}
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

          {/* Loading animation */}
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>

          {/* Debug info in development */}
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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-indigo-50 -mx-4 sm:-mx-6 lg:-mx-8 -my-8">
      {/* Enhanced Header with Patient Info */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">ST</span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">Simuatech</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Medical Simulation Platform</p>
                </div>
              </div>

              {/* Enhanced session status with startup feedback - Requirements 2.2, 2.4 */}
              {(sessionData || simulationStartupState.isLoading) && (
                <div className="flex items-center space-x-2 sm:space-x-3 sm:ml-8 sm:pl-8 sm:border-l border-gray-200">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    simulationStartupState.isLoading 
                      ? 'bg-gradient-to-br from-blue-400 to-blue-500 animate-pulse' 
                      : 'bg-gradient-to-br from-green-400 to-emerald-500'
                  }`}>
                    <span className="text-white text-sm sm:text-lg">
                      {simulationStartupState.isLoading ? '⏳' : '👤'}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      {simulationStartupState.isLoading 
                        ? (simulationStartupState.phase === 'loading_patient' ? 'Loading Patient...' : 'Setting Up...')
                        : (() => {
                            const speaksFor = sessionData?.speaks_for;
                            const patientName = sessionData?.patientName || sessionData?.patient_name || sessionData?.name || 'Patient';
                            // If speaks_for is "Self" or empty, use patient name; otherwise use speaks_for
                            return (!speaksFor || speaksFor === 'Self') ? patientName : speaksFor;
                          })()
                      }
                      {/* Enhanced Debug info */}
                      {import.meta.env.DEV && (
                        <span className="text-xs text-red-500 ml-2">
                          (Debug: pattern={urlAccessPattern}, patientName={sessionData?.patientName}, initialPrompt={!!sessionData?.initialPrompt}, startup={simulationStartupState.phase})
                        </span>
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        simulationStartupState.isLoading 
                          ? 'bg-blue-400 animate-bounce' 
                          : 'bg-green-400 animate-pulse'
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
                <p className="text-xs text-gray-500">Session Time</p>
                <p className="text-sm font-mono text-gray-700">{new Date().toLocaleTimeString()}</p>
              </div>

              {!isSessionEnded && (
                <button
                  onClick={endSession}
                  disabled={isLoading}
                  className="px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
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
                  // Enhanced navigation with specialty context preservation - Requirements 4.1, 4.2
                  const navigationState = {
                    specialtyContext: location.state?.specialtyContext,
                    fromSimulation: true,
                    sessionId: sessionData?.sessionId,
                    caseId: caseId
                  };

                  // Navigate back to specialty context if available, otherwise general simulation page
                  if (specialtyContext?.returnUrl) {
                    navigate(specialtyContext.returnUrl, { state: navigationState });
                  } else {
                    // Enhanced fallback with specialty context preservation
                    const fallbackUrl = location.state?.specialtyContext?.returnUrl || '/simulation';
                    navigate(fallbackUrl, { state: navigationState });
                  }
                }}
                className="px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
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

        {/* Enhanced Progress Indicator with startup feedback - Requirements 2.2, 2.4 */}
        {!isSessionEnded && (
          <div className="px-3 sm:px-6 pb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>
                {simulationStartupState.isLoading ? 'Startup Progress' : 'Session Progress'}
              </span>
              <span>
                {simulationStartupState.isLoading 
                  ? `${simulationStartupState.progress}%`
                  : `${messages.filter((m) => m.role === 'user').length} questions`
                }
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  simulationStartupState.isLoading 
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
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
            
            {/* Startup completion notification - Requirement 2.4 */}
            {simulationStartupState.phase === 'complete' && (
              <div className="mt-2 text-xs text-green-600 flex items-center animate-fade-in">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Simulation ready! You can now start chatting with the patient.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Messages with Better Visual Design */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            } animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`flex items-start space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-none ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    : message.speaks_for === 'System'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gradient-to-br from-purple-500 to-pink-600'
                }`}
              >
                <span className="text-white text-xs sm:text-sm font-medium">
                  {message.role === 'user' ? '👨‍⚕️' : message.speaks_for === 'System' ? 'ℹ️' : '🤒'}
                </span>
              </div>

              {/* Message Bubble */}
              <div
                className={`flex-1 sm:max-w-md lg:max-w-lg ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                {/* Speaker Label */}
                {message.role === 'assistant' && message.speaks_for && (
                  <div
                    className={`text-xs mb-1 sm:mb-2 font-semibold ${
                      message.speaks_for === 'System' ? 'text-green-700' : 'text-purple-700'
                    }`}
                  >
                    {message.speaks_for === 'System' ? 'System Guide' : message.speaks_for}
                  </div>
                )}

                {/* Message Content */}
                <div
                  className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-md ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                      : message.speaks_for === 'System'
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-gray-800 border-l-4 border-green-400'
                      : 'bg-white text-gray-900 border border-gray-200 shadow-lg'
                  }`}
                >
                  <div
                    className={`whitespace-pre-wrap text-sm sm:text-base ${
                      message.speaks_for === 'System' ? 'leading-relaxed' : ''
                    }`}
                  >
                    {message.content}
                  </div>
                </div>

                {/* Timestamp */}
                <div
                  className={`text-xs mt-1 sm:mt-2 ${
                    message.role === 'user' ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
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
                    // If speaks_for is "Self" or empty, use patient name; otherwise use speaks_for
                    return (!speaksFor || speaksFor === 'Self') ? patientName : speaksFor;
                  })()}
                </div>
                <div className="bg-white text-gray-900 border border-gray-200 shadow-lg px-3 py-2 sm:px-4 sm:py-3 rounded-2xl pulse-glow">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Enhanced typing animation - Requirement 2.4 */}
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 font-medium">
                        {(() => {
                          const speaksFor = sessionData?.speaks_for;
                          const patientName = sessionData?.patientName || sessionData?.patient_name || sessionData?.name || 'Patient';
                          // If speaks_for is "Self" or empty, use patient name; otherwise use speaks_for
                          return (!speaksFor || speaksFor === 'Self') ? patientName : speaksFor;
                        })()}{' '}
                        {!isSessionEnded ? 'is thinking...' : 'Generating report...'}
                      </span>
                      {/* Progress indicator for response generation - Requirement 2.4 */}
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

      {/* Enhanced Evaluation Report */}
      {isSessionEnded && evaluation && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-t border-blue-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Session Evaluation Report</h3>
                    <p className="text-sm text-gray-600">
                      Patient: {sessionData?.patientName || 'Patient'} • Completed:{' '}
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Session ID</div>
                  <div className="text-xs font-mono text-gray-700">
                    {sessionData?.sessionId?.slice(-8) || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">🎯</span>
                      Performance Summary
                    </h4>
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {evaluation}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                        <span className="mr-2">✅</span>
                        Strengths
                      </h5>
                      <p className="text-sm text-green-700">
                        Review your evaluation above for specific strengths identified during this
                        session.
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h5 className="font-semibold text-amber-800 mb-2 flex items-center">
                        <span className="mr-2">💡</span>
                        Areas for Improvement
                      </h5>
                      <p className="text-sm text-amber-700">
                        Check your evaluation for recommendations on areas to focus on for future
                        cases.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <span className="mr-2">🚀</span>
                      Next Steps
                    </h5>
                    <div className="text-sm text-blue-700 space-y-2">
                      <p>• Review your performance metrics in the Progress section</p>
                      <p>• Try similar cases to reinforce your learning</p>
                      <p>• Challenge yourself with more complex cases</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-4 mt-6 pt-4 border-t border-gray-200">
                {/* Retake section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex-1 mb-3 sm:mb-0">
                    <h4 className="font-medium text-orange-800 mb-1">Want to improve your performance?</h4>
                    <p className="text-sm text-orange-600">
                      Retake this case with personalized learning recommendations and track your improvement.
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowRetakeHistory(!showRetakeHistory)}
                      className="px-3 py-2 bg-white text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors text-sm"
                    >
                      View History
                    </button>
                    <button
                      onClick={() => setShowRetakeModal(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center space-x-2"
                    >
                      <span>🔄</span>
                      <span>Retake Case</span>
                    </button>
                  </div>
                </div>
                
                {/* Retake History (collapsible) */}
                {showRetakeHistory && (
                  <div className="animate-fade-in">
                    <RetakeHistory 
                      caseId={caseId || ''} 
                      caseTitle={sessionData?.caseTitle || sessionData?.case_title || 'Unknown Case'}
                      className=""
                    />
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    This evaluation was generated by Simuatech AI to help improve your clinical
                    skills.
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => navigate('/progress')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View Progress
                    </button>
                    <button
                      onClick={() => {
                        // Navigate back to specialty context if available, otherwise general simulation page
                        if (specialtyContext?.returnUrl) {
                          navigate(specialtyContext.returnUrl);
                        } else {
                          navigate('/simulation');
                        }
                      }}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Try Another Case
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Smart Suggestions - Mobile Optimized */}
      {messages.length <= 2 && !isSessionEnded && (
        <div className="bg-blue-50 border-t border-blue-200 px-3 sm:px-6 py-2 sm:py-3">
          <div className="max-w-4xl mx-auto">
            {/* Hide label on mobile, show only on larger screens */}
            <div className="hidden sm:flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm">💡</span>
                <span className="text-sm font-medium text-blue-800">Quick Starters:</span>
              </div>
            </div>

            {/* Mobile: Show only 2 most important suggestions */}
            <div className="flex sm:hidden flex-wrap gap-1">
              {[
                'What brings you in today?',
                'Describe your symptoms',
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(suggestion)}
                  className="text-xs px-2 py-1 bg-white text-blue-700 rounded-full border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Desktop: Show all suggestions */}
            <div className="hidden sm:flex flex-wrap gap-2">
              {[
                'What brings you in today?',
                'Can you describe your symptoms?',
                'When did this start?',
                'Any medical history I should know?',
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(suggestion)}
                  className="text-xs px-3 py-1 bg-white text-blue-700 rounded-full border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Input Section */}
      {!isSessionEnded && (
        <div className="bg-white border-t border-gray-200 shadow-lg">
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
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                    rows={2}
                    disabled={isLoading}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {inputMessage.length}/500
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 space-y-1 sm:space-y-0">
                  <div className="text-xs text-gray-500 flex items-center">
                    <span className="hidden sm:inline">💡 Press Enter to send, Shift+Enter for new line</span>
                    <span className="sm:hidden">💡 Enter to send</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                      AI Ready
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Sending...</span>
                    {/* Enhanced loading feedback - Requirement 2.4 */}
                    <div className="hidden sm:flex items-center ml-2">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse mx-0.5"></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse mx-0.5" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse mx-0.5" style={{ animationDelay: '0.4s' }}></div>
                    </div>
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
      
      {/* Retake Modal */}
      <RetakeModal
        isOpen={showRetakeModal}
        onClose={() => setShowRetakeModal(false)}
        caseId={caseId || ''}
        caseTitle={sessionData?.caseTitle || sessionData?.case_title || 'Unknown Case'}
        previousSessionId={sessionData?.sessionId}
        onRetakeSuccess={(newSessionId) => {
          // Navigate to the new retake session
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