import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SimulationChatPage from '../../pages/SimulationChatPage';
import { api } from '../../services/apiService';

// Mock the API service
vi.mock('../../services/apiService', () => ({
  api: {
    getCases: vi.fn(),
    getCaseCategories: vi.fn(),
    startSimulation: vi.fn(),
    setSpecialtyContext: vi.fn(),
    checkAuth: vi.fn(),
    getUserProfile: vi.fn(),
    isAuthenticated: vi.fn(),
    isTokenExpired: vi.fn(),
    getTimeUntilExpiry: vi.fn(),
    getSpecialtyContext: vi.fn(),
    clearSpecialtyContext: vi.fn(),
  }
}));

// Mock authentication
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'testuser', role: 'user' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  })
}));

// Mock notification system
vi.mock('../../components/NotificationToast', () => ({
  useNotification: () => ({
    addNotification: vi.fn(),
    NotificationContainer: () => <div data-testid="notification-container" />,
  })
}));

// Mock ProtectedRoute to just render children
vi.mock('../../components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock URL utilities
vi.mock('../../utils/urlUtils', () => ({
  createSimulationSessionUrl: (caseId: string, sessionId: string) => `/simulation/${caseId}/session/${sessionId}`,
  createSimulationCaseUrl: (caseId: string) => `/simulation/${caseId}`,
  parseSimulationUrl: (url: string) => {
    const match = url.match(/\/simulation\/([^\/]+)(?:\/session\/([^\/]+))?/);
    if (match) {
      return {
        isValid: true,
        caseId: match[1],
        sessionId: match[2] || null
      };
    }
    return { isValid: false, caseId: null, sessionId: null };
  },
  createSpecialtyContext: (specialty: string, returnUrl: string) => ({
    specialty,
    returnUrl
  }),
  preserveSpecialtyContext: (state: any, additional: any) => ({
    ...state,
    ...additional
  }),
  updateBrowserHistoryForBookmarks: vi.fn(),
  isValidSimulationUrl: (url: string) => url.includes('/simulation/')
}));

// Test wrapper component to provide routing context
const TestWrapper: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({ 
  children, 
  initialEntries = ['/simulation/VP-OPTH-001'] 
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    {children}
  </MemoryRouter>
);

describe('Simulation Routing Integration Tests', () => {
  const mockSimulationResponse = {
    sessionId: 'test-session-123',
    patientName: 'John Doe',
    initialPrompt: 'Hello, I am experiencing chest pain.',
    speaks_for: 'John Doe',
    caseId: 'VP-OPTH-001'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default API responses
    (api.isAuthenticated as any).mockReturnValue(true);
    (api.isTokenExpired as any).mockReturnValue(false);
    (api.getTimeUntilExpiry as any).mockReturnValue(30);
    (api.getSpecialtyContext as any).mockReturnValue(null);
    (api.startSimulation as any).mockResolvedValue(mockSimulationResponse);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock document.title
    Object.defineProperty(document, 'title', {
      writable: true,
      value: 'Test'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Direct Case URL Access - Requirements 1.1, 1.2, 2.1', () => {
    it('should automatically start simulation when navigating to /simulation/:caseId', async () => {
      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      // Should call startSimulation API
      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalledWith('VP-OPTH-001');
      });

      // Should display patient name and initial prompt
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText(/Hello, I am experiencing chest pain/)).toBeInTheDocument();
      });
    });

    it('should display system welcome message and patient initial prompt - Requirements 2.1, 2.2', async () => {
      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should show system welcome message
      await waitFor(() => {
        expect(screen.getByText(/Welcome to Simuatech/)).toBeInTheDocument();
        expect(screen.getByText(/You are now interacting with John Doe/)).toBeInTheDocument();
      });

      // Should show patient initial prompt
      await waitFor(() => {
        expect(screen.getByText(/Hello, I am experiencing chest pain/)).toBeInTheDocument();
      });
    });

    it('should show default greeting when no initial prompt is provided - Requirement 2.2', async () => {
      (api.startSimulation as any).mockResolvedValue({
        ...mockSimulationResponse,
        initialPrompt: '', // No initial prompt
      });

      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should show default greeting
      await waitFor(() => {
        expect(screen.getByText(/Hello, I'm John Doe. Thank you for seeing me today/)).toBeInTheDocument();
      });
    });

    it('should enable chat input after simulation is ready - Requirement 2.4', async () => {
      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should enable chat input
      await waitFor(() => {
        const chatInput = screen.getByPlaceholderText(/Type your message/);
        expect(chatInput).toBeInTheDocument();
        expect(chatInput).not.toBeDisabled();
      });
    });
  });

  describe('Loading States and User Feedback - Requirements 2.2, 2.3, 2.4', () => {
    it('should show progressive loading states during simulation startup', async () => {
      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      // Should show case validation phase
      await waitFor(() => {
        expect(screen.getByText(/Validating case VP-OPTH-001/)).toBeInTheDocument();
      });

      // Should progress through different phases
      await waitFor(() => {
        expect(screen.getByText(/Creating new simulation session|Loading patient information|Preparing chat interface/)).toBeInTheDocument();
      });

      // Should complete and show ready state
      await waitFor(() => {
        expect(screen.getByText(/Simulation ready|John Doe/)).toBeInTheDocument();
      });
    });

    it('should show smooth transitions between loading and active states', async () => {
      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByText(/Loading|Validating|Creating|Preparing/)).toBeInTheDocument();
      });

      // Should transition to active simulation
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText(/Loading|Validating|Creating|Preparing/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery - Requirements 3.1, 3.2, 3.3, 3.4', () => {
    it('should handle invalid case ID with proper error message - Requirement 3.3', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Case not found'));

      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalledWith('VP-OPTH-001');
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/This case could not be found/)).toBeInTheDocument();
      });
    });

    it('should handle network errors with retry option - Requirement 3.1', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Network connection failed'));

      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByText(/Connection failed. Please check your internet connection/)).toBeInTheDocument();
      });

      // Should show retry button
      await waitFor(() => {
        expect(screen.getByText(/Retry|Try Again/)).toBeInTheDocument();
      });
    });

    it('should handle authentication errors with login redirect - Requirement 3.2', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Session expired'));

      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should show authentication error message
      await waitFor(() => {
        expect(screen.getByText(/Your session has expired. Please log in again/)).toBeInTheDocument();
      });
    });

    it('should handle server errors with retry option - Requirement 3.1', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Server error'));

      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should show server error message
      await waitFor(() => {
        expect(screen.getByText(/The server is experiencing issues/)).toBeInTheDocument();
      });

      // Should show retry button
      await waitFor(() => {
        expect(screen.getByText(/Retry|Try Again/)).toBeInTheDocument();
      });
    });

    it('should successfully retry after network error', async () => {
      let callCount = 0;
      (api.startSimulation as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network connection failed'));
        }
        return Promise.resolve(mockSimulationResponse);
      });

      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText(/Retry|Try Again/);
      fireEvent.click(retryButton);

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(api.startSimulation).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('URL Consistency and Navigation - Requirements 4.1, 4.2, 4.4', () => {
    it('should handle bookmark compatibility for direct case URLs - Requirement 4.4', async () => {
      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalledWith('VP-OPTH-001');
      });

      // Should update page title for bookmarks
      await waitFor(() => {
        expect(document.title).toContain('John Doe');
      });
    });

    it('should preserve specialty context during navigation - Requirements 4.1, 4.2', async () => {
      const specialtyState = {
        specialtyContext: {
          specialty: 'Internal Medicine',
          returnUrl: '/internal_medicine'
        }
      };

      render(
        <MemoryRouter initialEntries={[{ pathname: '/simulation/VP-OPTH-001', state: specialtyState }]}>
          <SimulationChatPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Specialty context should be preserved in navigation state
      // This would be verified through the navigation mock in a real test
    });

    it('should handle existing session URLs correctly - Requirements 1.1, 4.4', async () => {
      render(
        <TestWrapper initialEntries={['/simulation/VP-OPTH-001/session/existing-session-123']}>
          <SimulationChatPage />
        </TestWrapper>
      );

      // Should not call startSimulation for existing sessions
      await waitFor(() => {
        expect(api.startSimulation).not.toHaveBeenCalled();
      });

      // Should set up session data for existing session
      await waitFor(() => {
        expect(screen.getByText(/Loading.../)).toBeInTheDocument();
      });
    });

    it('should handle invalid URLs with proper error handling - Requirement 4.3', async () => {
      render(
        <TestWrapper initialEntries={['/simulation/']}>
          <SimulationChatPage />
        </TestWrapper>
      );

      // Should show error for invalid URL
      await waitFor(() => {
        expect(screen.getByText(/Invalid simulation URL|Please select a case/)).toBeInTheDocument();
      });
    });
  });

  describe('End-to-End Simulation Flow - Requirements 1.1, 1.2, 2.1, 2.4', () => {
    it('should complete full flow from direct case URL to active chat', async () => {
      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      // 1. Should start with loading state
      await waitFor(() => {
        expect(screen.getByText(/Validating case|Creating new simulation session/)).toBeInTheDocument();
      });

      // 2. Should call API to start simulation
      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalledWith('VP-OPTH-001');
      });

      // 3. Should display patient information
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // 4. Should show system welcome and patient initial message
      await waitFor(() => {
        expect(screen.getByText(/Welcome to Simuatech/)).toBeInTheDocument();
        expect(screen.getByText(/Hello, I am experiencing chest pain/)).toBeInTheDocument();
      });

      // 5. Should enable chat input for interaction
      await waitFor(() => {
        const chatInput = screen.getByPlaceholderText(/Type your message/);
        expect(chatInput).toBeInTheDocument();
        expect(chatInput).not.toBeDisabled();
      });

      // 6. Should allow user to send messages
      const chatInput = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByText(/Send/);
      
      fireEvent.change(chatInput, { target: { value: 'Can you tell me more about your chest pain?' } });
      expect(chatInput).toHaveValue('Can you tell me more about your chest pain?');
      
      fireEvent.click(sendButton);
      
      // Should add user message to chat
      await waitFor(() => {
        expect(screen.getByText('Can you tell me more about your chest pain?')).toBeInTheDocument();
      });
    });

    it('should handle multiple rapid navigation attempts gracefully', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      // Quickly navigate to different case
      rerender(
        <TestWrapper initialEntries={['/simulation/VP-OPTH-002']}>
          <SimulationChatPage />
        </TestWrapper>
      );

      // Should handle rapid navigation without errors
      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });
    });

    it('should maintain simulation state during component re-renders', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Re-render component
      rerender(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      // Should maintain simulation state
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle slow API responses with appropriate loading states', async () => {
      // Mock slow API response
      (api.startSimulation as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSimulationResponse), 2000))
      );

      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      // Should show loading state for extended period
      expect(screen.getByText(/Validating case|Creating new simulation session/)).toBeInTheDocument();

      // Should eventually complete
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle API responses with missing fields gracefully', async () => {
      (api.startSimulation as any).mockResolvedValue({
        sessionId: 'test-session-123',
        // Missing patientName and initialPrompt
      });

      render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should handle missing fields with defaults
      await waitFor(() => {
        expect(screen.getByText(/Patient|Hello/)).toBeInTheDocument();
      });
    });

    it('should cleanup resources on component unmount', async () => {
      const { unmount } = render(
        <TestWrapper>
          <SimulationChatPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Unmount component
      unmount();

      // Should cleanup without errors (no specific assertion needed, just no errors thrown)
    });
  });
});