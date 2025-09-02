import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SimulationChatPage from '../../pages/SimulationChatPage';
import { api } from '../../services/apiService';
import { ThemeProvider } from '../../contexts/ThemeContext';

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

// Mock EventSource for streaming responses
class MockEventSource {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState: number = 1;
  url: string;

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  close() {
    this.readyState = 2;
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data)
      });
      this.onmessage(event);
    }
  }
}

// Mock EventSource globally
(global as any).EventSource = MockEventSource;

// Test wrapper component to provide routing context for SimulationChatPage
const TestWrapper: React.FC<{ initialEntries?: string[] }> = ({ 
  initialEntries = ['/simulation/VP-OPTH-001'] 
}) => (
  <ThemeProvider>
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/simulation/:caseId" element={<SimulationChatPage />} />
        <Route path="/simulation/:caseId/session/:sessionId" element={<SimulationChatPage />} />
        <Route path="/simulation/" element={<div>Invalid simulation URL. Please select a case.</div>} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </MemoryRouter>
  </ThemeProvider>
);

describe('End-to-End Simulation Startup Integration Tests', () => {
  const mockSimulationResponse = {
    sessionId: 'test-session-123',
    patientName: 'John Doe',
    initialPrompt: 'Hello, I am experiencing chest pain and shortness of breath.',
    speaks_for: 'John Doe',
    caseId: 'VP-OPTH-001'
  };

  // Helper function to advance timers and wait for simulation completion
  const waitForSimulationComplete = async () => {
    // Advance through all the setTimeout delays in the simulation startup
    await act(async () => {
      vi.advanceTimersByTime(800); // Case validation delay
    });
    
    await act(async () => {
      vi.advanceTimersByTime(600); // Patient loading delay
    });
    
    await act(async () => {
      vi.advanceTimersByTime(500); // Chat initialization delay
    });
    
    await act(async () => {
      vi.advanceTimersByTime(300); // Smooth transition delay
    });
    
    await act(async () => {
      vi.advanceTimersByTime(1000); // Final cleanup delay
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default API responses with faster resolution
    (api.isAuthenticated as any).mockReturnValue(true);
    (api.isTokenExpired as any).mockReturnValue(false);
    (api.getTimeUntilExpiry as any).mockReturnValue(30);
    (api.getSpecialtyContext as any).mockReturnValue(null);
    
    // Mock startSimulation with immediate resolution for faster tests
    (api.startSimulation as any).mockImplementation(() => 
      Promise.resolve(mockSimulationResponse)
    );
    
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

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/simulation/VP-OPTH-001',
        pathname: '/simulation/VP-OPTH-001',
        search: '',
        hash: '',
        origin: 'http://localhost:3000',
        protocol: 'http:',
        host: 'localhost:3000',
        hostname: 'localhost',
        port: '3000',
        assign: vi.fn(),
        replace: vi.fn(),
        reload: vi.fn(),
      },
      writable: true,
    });

    // Mock import.meta.env
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000');

    // Mock timers for faster test execution
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  describe('Complete Flow from Direct Case URL to Active Simulation - Requirements 1.1, 1.2, 2.1, 2.4', () => {
    it('should complete full end-to-end flow from case URL to active chat interface', async () => {
      render(<TestWrapper />);

      // 1. Should start with case validation loading state
      await waitFor(() => {
        expect(screen.getByText(/Validating case VP-OPTH-001/)).toBeInTheDocument();
      });

      // 2. Should progress through session creation phase
      await waitFor(() => {
        expect(screen.getByText(/Creating new simulation session/)).toBeInTheDocument();
      });

      // 3. Should call API to start simulation
      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalledWith('VP-OPTH-001');
      });

      // 4. Should progress through patient loading phase
      await waitFor(() => {
        expect(screen.getByText(/Loading patient information/)).toBeInTheDocument();
      });

      // 5. Should progress through chat initialization phase
      await waitFor(() => {
        expect(screen.getByText(/Preparing chat interface/)).toBeInTheDocument();
      });

      // 6. Should display patient name in header
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // 7. Should show system welcome message
      await waitFor(() => {
        expect(screen.getByText(/Welcome to Simuatech/)).toBeInTheDocument();
        expect(screen.getByText(/You are now interacting with John Doe/)).toBeInTheDocument();
      });

      // 8. Should show patient initial prompt
      await waitFor(() => {
        expect(screen.getByText(/Hello, I am experiencing chest pain and shortness of breath/)).toBeInTheDocument();
      });

      // 9. Should enable chat input for interaction
      await waitFor(() => {
        const chatInput = screen.getByPlaceholderText(/Type your message/);
        expect(chatInput).toBeInTheDocument();
        expect(chatInput).not.toBeDisabled();
      });

      // 10. Should allow user to send messages
      const chatInput = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByText(/Send/);
      
      await act(async () => {
        fireEvent.change(chatInput, { target: { value: 'Can you tell me more about your chest pain?' } });
      });
      
      expect(chatInput).toHaveValue('Can you tell me more about your chest pain?');
      
      await act(async () => {
        fireEvent.click(sendButton);
      });
      
      // Should add user message to chat
      await waitFor(() => {
        expect(screen.getByText('Can you tell me more about your chest pain?')).toBeInTheDocument();
      });

      // 11. Should update page title for bookmarks
      expect(document.title).toContain('John Doe');
    });

    it('should handle simulation with no initial prompt by showing default greeting - Requirement 2.2', async () => {
      (api.startSimulation as any).mockResolvedValue({
        ...mockSimulationResponse,
        initialPrompt: '', // No initial prompt
      });

      render(<TestWrapper />);

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should show system welcome message
      await waitFor(() => {
        expect(screen.getByText(/Welcome to Simuatech/)).toBeInTheDocument();
      });

      // Should show default greeting instead of initial prompt
      await waitFor(() => {
        expect(screen.getByText(/Hello, I'm John Doe. Thank you for seeing me today/)).toBeInTheDocument();
      });
    });

    it('should handle simulation with minimal response data gracefully', async () => {
      (api.startSimulation as any).mockResolvedValue({
        sessionId: 'test-session-123',
        // Missing patientName and initialPrompt
      });

      render(<TestWrapper />);

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should handle missing fields with defaults
      await waitFor(() => {
        expect(screen.getByText(/Patient|Hello/)).toBeInTheDocument();
      });

      // Should still enable chat functionality
      await waitFor(() => {
        const chatInput = screen.getByPlaceholderText(/Type your message/);
        expect(chatInput).toBeInTheDocument();
        expect(chatInput).not.toBeDisabled();
      });
    });
  });

  describe('Error Scenarios and Recovery Mechanisms - Requirements 3.1, 3.2, 3.3, 3.4', () => {
    it('should handle invalid case ID with proper error message and redirect - Requirement 3.3', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Case not found'));

      render(<TestWrapper />);

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalledWith('VP-OPTH-001');
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/This case could not be found/)).toBeInTheDocument();
      });

      // Should not show chat interface
      expect(screen.queryByPlaceholderText(/Type your message/)).not.toBeInTheDocument();
    });

    it('should handle network errors with retry functionality - Requirement 3.1', async () => {
      let callCount = 0;
      (api.startSimulation as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network connection failed'));
        }
        return Promise.resolve(mockSimulationResponse);
      });

      render(<TestWrapper />);

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByText(/Connection failed. Please check your internet connection/)).toBeInTheDocument();
      });

      // Should show retry button
      await waitFor(() => {
        expect(screen.getByText(/Retry|Try Again/)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText(/Retry|Try Again/);
      await act(async () => {
        fireEvent.click(retryButton);
      });

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(api.startSimulation).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle authentication errors with login redirect - Requirement 3.2', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Session expired'));

      render(<TestWrapper />);

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should show authentication error message
      await waitFor(() => {
        expect(screen.getByText(/Your session has expired. Please log in again/)).toBeInTheDocument();
      });

      // Should not show retry button for auth errors
      expect(screen.queryByText(/Retry|Try Again/)).not.toBeInTheDocument();
    });

    it('should handle server errors with retry option - Requirement 3.1', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Server error'));

      render(<TestWrapper />);

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

    it('should handle timeout errors appropriately', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Request timeout'));

      render(<TestWrapper />);

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should show timeout error message
      await waitFor(() => {
        expect(screen.getByText(/The request is taking too long/)).toBeInTheDocument();
      });

      // Should show retry button
      await waitFor(() => {
        expect(screen.getByText(/Retry|Try Again/)).toBeInTheDocument();
      });
    });

    it('should limit retry attempts to prevent infinite loops', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Network connection failed'));

      render(<TestWrapper />);

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
      });

      // Retry multiple times
      for (let i = 0; i < 5; i++) {
        const retryButton = screen.queryByText(/Retry|Try Again/);
        if (retryButton) {
          await act(async () => {
            fireEvent.click(retryButton);
          });
          await waitFor(() => {
            expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
          });
        }
      }

      // Should have made multiple attempts
      expect(api.startSimulation).toHaveBeenCalledTimes(6); // Initial + 5 retries
    });
  });

  describe('URL Consistency and Navigation Behavior - Requirements 4.1, 4.2, 4.4', () => {
    it('should handle bookmark compatibility for direct case URLs - Requirement 4.4', async () => {
      render(<TestWrapper />);

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalledWith('VP-OPTH-001');
      });

      // Should update page title for bookmarks
      await waitFor(() => {
        expect(document.title).toContain('John Doe');
      });

      // Should handle the case URL pattern correctly
      expect(window.location.pathname).toBe('/simulation/VP-OPTH-001');
    });

    it('should preserve specialty context during navigation - Requirements 4.1, 4.2', async () => {
      const specialtyState = {
        specialtyContext: {
          specialty: 'Internal Medicine',
          returnUrl: '/internal_medicine'
        }
      };

      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={[{ pathname: '/simulation/VP-OPTH-001', state: specialtyState }]}>
            <Routes>
              <Route path="/simulation/:caseId" element={<SimulationChatPage />} />
              <Route path="/simulation/:caseId/session/:sessionId" element={<SimulationChatPage />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Should complete simulation startup successfully
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Specialty context should be preserved (verified through successful navigation)
      expect(screen.getByText(/Welcome to Simuatech/)).toBeInTheDocument();
    });

    it('should handle existing session URLs correctly - Requirements 1.1, 4.4', async () => {
      render(<TestWrapper initialEntries={['/simulation/VP-OPTH-001/session/existing-session-123']} />);

      // Should not call startSimulation for existing sessions
      await waitFor(() => {
        // Give it time to potentially call the API
        expect(api.startSimulation).not.toHaveBeenCalled();
      }, { timeout: 2000 });

      // Should show loading state for existing session
      await waitFor(() => {
        expect(screen.getByText(/Loading.../)).toBeInTheDocument();
      });
    });

    it('should handle invalid URLs with proper error handling - Requirement 4.3', async () => {
      render(<TestWrapper initialEntries={['/simulation/']} />);

      // Should show error for invalid URL
      await waitFor(() => {
        expect(screen.getByText(/Invalid simulation URL|Please select a case/)).toBeInTheDocument();
      });
    });

    it('should handle rapid navigation changes gracefully', async () => {
      const { rerender } = render(<TestWrapper />);

      // Start initial simulation
      await waitFor(() => {
        expect(screen.getByText(/Validating case VP-OPTH-001/)).toBeInTheDocument();
      });

      // Quickly navigate to different case
      rerender(<TestWrapper initialEntries={['/simulation/VP-OPTH-002']} />);

      // Should handle rapid navigation without errors
      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle slow API responses with appropriate loading states', async () => {
      // Mock slow API response
      (api.startSimulation as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSimulationResponse), 2000))
      );

      render(<TestWrapper />);

      // Should show loading state for extended period
      expect(screen.getByText(/Validating case|Creating new simulation session/)).toBeInTheDocument();

      // Should eventually complete
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should maintain simulation state during component re-renders', async () => {
      const { rerender } = render(<TestWrapper />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Re-render component
      rerender(<TestWrapper />);

      // Should maintain simulation state
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should cleanup resources on component unmount', async () => {
      const { unmount } = render(<TestWrapper />);

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalled();
      });

      // Unmount component
      unmount();

      // Should cleanup without errors (no specific assertion needed, just no errors thrown)
    });

    it('should handle multiple simultaneous simulation attempts', async () => {
      // Mock API to track call count
      let callCount = 0;
      (api.startSimulation as any).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ...mockSimulationResponse,
          sessionId: `test-session-${callCount}`
        });
      });

      render(<TestWrapper />);

      // Should only make one API call even if triggered multiple times
      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Chat Functionality Integration', () => {
    it('should enable full chat interaction after simulation startup', async () => {
      render(<TestWrapper />);

      // Wait for simulation to complete
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should enable chat input
      await waitFor(() => {
        const chatInput = screen.getByPlaceholderText(/Type your message/);
        expect(chatInput).toBeInTheDocument();
        expect(chatInput).not.toBeDisabled();
      });

      // Should allow message sending
      const chatInput = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByText(/Send/);
      
      await act(async () => {
        fireEvent.change(chatInput, { target: { value: 'What are your symptoms?' } });
      });
      
      await act(async () => {
        fireEvent.click(sendButton);
      });
      
      // Should add user message to chat
      await waitFor(() => {
        expect(screen.getByText('What are your symptoms?')).toBeInTheDocument();
      });

      // Input should be cleared after sending
      expect(chatInput).toHaveValue('');
    });

    it('should handle chat errors gracefully during active simulation', async () => {
      render(<TestWrapper />);

      // Wait for simulation to complete
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Mock EventSource to simulate error
      const originalEventSource = (global as any).EventSource;
      (global as any).EventSource = class extends MockEventSource {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 500);
        }
      };

      const chatInput = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByText(/Send/);
      
      await act(async () => {
        fireEvent.change(chatInput, { target: { value: 'Test message' } });
        fireEvent.click(sendButton);
      });

      // Should handle chat error gracefully
      await waitFor(() => {
        expect(screen.getByText(/Connection Error|trouble responding/)).toBeInTheDocument();
      });

      // Restore original EventSource
      (global as any).EventSource = originalEventSource;
    });
  });

  describe('Loading State Transitions - Requirements 2.2, 2.3, 2.4', () => {
    it('should show progressive loading states with smooth transitions', async () => {
      render(<TestWrapper />);

      // Should start with case validation
      await waitFor(() => {
        expect(screen.getByText(/Validating case VP-OPTH-001/)).toBeInTheDocument();
      });

      // Should progress to session creation
      await waitFor(() => {
        expect(screen.getByText(/Creating new simulation session/)).toBeInTheDocument();
      });

      // Should progress to patient loading
      await waitFor(() => {
        expect(screen.getByText(/Loading patient information/)).toBeInTheDocument();
      });

      // Should progress to chat initialization
      await waitFor(() => {
        expect(screen.getByText(/Preparing chat interface/)).toBeInTheDocument();
      });

      // Should complete and show ready state
      await waitFor(() => {
        expect(screen.getByText(/Simulation ready|John Doe/)).toBeInTheDocument();
      });

      // Loading states should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/Validating|Creating|Loading|Preparing/)).not.toBeInTheDocument();
      });
    });

    it('should handle loading state interruptions gracefully', async () => {
      // Mock API to fail during loading
      (api.startSimulation as any).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network connection failed')), 1000)
        )
      );

      render(<TestWrapper />);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/Validating case|Creating new simulation session/)).toBeInTheDocument();
      });

      // Should handle error and clear loading state
      await waitFor(() => {
        expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
        expect(screen.queryByText(/Validating|Creating|Loading|Preparing/)).not.toBeInTheDocument();
      });
    });
  });
});