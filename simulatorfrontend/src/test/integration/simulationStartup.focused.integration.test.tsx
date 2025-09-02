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
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  close() {
    this.readyState = 2;
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data)
      });
      this.onmessage(event);
    }
  }
}

(global as any).EventSource = MockEventSource;

// Test wrapper component
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

describe('Focused End-to-End Simulation Startup Integration Tests', () => {
  const mockSimulationResponse = {
    sessionId: 'test-session-123',
    patientName: 'John Doe',
    initialPrompt: 'Hello, I am experiencing chest pain and shortness of breath.',
    speaks_for: 'John Doe',
    caseId: 'VP-OPTH-001'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Setup API responses
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

    Object.defineProperty(document, 'title', {
      writable: true,
      value: 'Test'
    });

    vi.stubEnv('VITE_API_URL', 'http://localhost:5000');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  describe('Complete Flow from Direct Case URL to Active Simulation - Requirements 1.1, 1.2, 2.1, 2.4', () => {
    it('should complete full end-to-end flow from case URL to active chat interface', async () => {
      render(<TestWrapper />);

      // Should start with case validation loading state
      expect(screen.getByText(/Validating case VP-OPTH-001/)).toBeInTheDocument();

      // Fast-forward through all simulation startup delays
      await act(async () => {
        vi.advanceTimersByTime(3000); // Advance through all delays
      });

      // Should call API to start simulation
      expect(api.startSimulation).toHaveBeenCalledWith('VP-OPTH-001');

      // Should display patient information and messages
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Simuatech/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Hello, I am experiencing chest pain/)).toBeInTheDocument();
      });

      // Should enable chat input
      await waitFor(() => {
        const chatInput = screen.getByPlaceholderText(/Type your message/);
        expect(chatInput).toBeInTheDocument();
        expect(chatInput).not.toBeDisabled();
      });

      // Should update page title for bookmarks
      expect(document.title).toContain('John Doe');
    });

    it('should handle simulation with no initial prompt by showing default greeting - Requirement 2.2', async () => {
      (api.startSimulation as any).mockResolvedValue({
        ...mockSimulationResponse,
        initialPrompt: '',
      });

      render(<TestWrapper />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Hello, I'm John Doe. Thank you for seeing me today/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Scenarios and Recovery Mechanisms - Requirements 3.1, 3.2, 3.3, 3.4', () => {
    it('should handle invalid case ID with proper error message - Requirement 3.3', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Case not found'));

      render(<TestWrapper />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/This case could not be found/)).toBeInTheDocument();
      });
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

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Connection failed. Please check your internet connection/)).toBeInTheDocument();
      });

      // Should show retry button
      const retryButton = await screen.findByText(/Retry|Try Again/);
      expect(retryButton).toBeInTheDocument();

      // Click retry
      await act(async () => {
        fireEvent.click(retryButton);
        vi.advanceTimersByTime(3000);
      });

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(api.startSimulation).toHaveBeenCalledTimes(2);
    });

    it('should handle authentication errors with login redirect - Requirement 3.2', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Session expired'));

      render(<TestWrapper />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Your session has expired. Please log in again/)).toBeInTheDocument();
      });
    });

    it('should handle server errors with retry option - Requirement 3.1', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Server error'));

      render(<TestWrapper />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/The server is experiencing issues/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Retry|Try Again/)).toBeInTheDocument();
      });
    });
  });

  describe('URL Consistency and Navigation Behavior - Requirements 4.1, 4.2, 4.4', () => {
    it('should handle bookmark compatibility for direct case URLs - Requirement 4.4', async () => {
      render(<TestWrapper />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalledWith('VP-OPTH-001');
      });

      await waitFor(() => {
        expect(document.title).toContain('John Doe');
      });
    });

    it('should handle existing session URLs correctly - Requirements 1.1, 4.4', async () => {
      render(<TestWrapper initialEntries={['/simulation/VP-OPTH-001/session/existing-session-123']} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should not call startSimulation for existing sessions
      expect(api.startSimulation).not.toHaveBeenCalled();

      // Should show loading state for existing session
      await waitFor(() => {
        expect(screen.getByText(/Loading.../)).toBeInTheDocument();
      });
    });

    it('should handle invalid URLs with proper error handling - Requirement 4.3', async () => {
      render(<TestWrapper initialEntries={['/simulation/']} />);

      await waitFor(() => {
        expect(screen.getByText(/Invalid simulation URL. Please select a case/)).toBeInTheDocument();
      });
    });
  });

  describe('Chat Functionality Integration', () => {
    it('should enable full chat interaction after simulation startup', async () => {
      render(<TestWrapper />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Wait for simulation to complete
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should enable chat input
      const chatInput = await screen.findByPlaceholderText(/Type your message/);
      expect(chatInput).not.toBeDisabled();

      const sendButton = screen.getByText(/Send/);
      
      await act(async () => {
        fireEvent.change(chatInput, { target: { value: 'What are your symptoms?' } });
        fireEvent.click(sendButton);
      });
      
      // Should add user message to chat
      await waitFor(() => {
        expect(screen.getByText('What are your symptoms?')).toBeInTheDocument();
      });

      // Input should be cleared after sending
      expect(chatInput).toHaveValue('');
    });
  });

  describe('Loading State Transitions - Requirements 2.2, 2.3, 2.4', () => {
    it('should show progressive loading states with smooth transitions', async () => {
      render(<TestWrapper />);

      // Should start with case validation
      expect(screen.getByText(/Validating case VP-OPTH-001/)).toBeInTheDocument();

      // Advance to session creation phase
      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(screen.getByText(/Creating new simulation session/)).toBeInTheDocument();
      });

      // Advance to patient loading phase
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByText(/Loading patient information/)).toBeInTheDocument();
      });

      // Advance to chat initialization phase
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByText(/Preparing chat interface/)).toBeInTheDocument();
      });

      // Complete the simulation
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should show completed simulation
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Loading states should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/Validating|Creating|Loading|Preparing/)).not.toBeInTheDocument();
      });
    });

    it('should handle loading state interruptions gracefully', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Network connection failed'));

      render(<TestWrapper />);

      // Should show loading state initially
      expect(screen.getByText(/Validating case/)).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should handle error and clear loading state
      await waitFor(() => {
        expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Validating|Creating|Loading|Preparing/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle API responses with missing fields gracefully', async () => {
      (api.startSimulation as any).mockResolvedValue({
        sessionId: 'test-session-123',
        // Missing patientName and initialPrompt
      });

      render(<TestWrapper />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Should handle missing fields with defaults
      await waitFor(() => {
        expect(screen.getByText(/Patient|Hello/)).toBeInTheDocument();
      });

      // Should still enable chat functionality
      await waitFor(() => {
        const chatInput = screen.getByPlaceholderText(/Type your message/);
        expect(chatInput).not.toBeDisabled();
      });
    });

    it('should handle multiple simultaneous simulation attempts', async () => {
      let callCount = 0;
      (api.startSimulation as any).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ...mockSimulationResponse,
          sessionId: `test-session-${callCount}`
        });
      });

      render(<TestWrapper />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Should only make one API call even if triggered multiple times
      expect(api.startSimulation).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });
});