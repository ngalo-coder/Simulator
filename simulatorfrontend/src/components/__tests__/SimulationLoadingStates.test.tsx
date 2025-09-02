import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SimulationChatPage from '../../pages/SimulationChatPage';

// Mock DOM methods that aren't available in JSDOM
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

// Mock the API service
vi.mock('../../services/apiService', () => ({
  api: {
    startSimulation: vi.fn(),
    endSimulation: vi.fn(),
  },
}));

// Mock the auth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    isAuthenticated: true,
  }),
}));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ caseId: 'VP-OPTH-001' }),
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null }),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SimulationChatPage Loading States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows enhanced loading screen with progress phases', async () => {
    const { api } = await import('../../services/apiService');
    
    // Mock a delayed API response to test loading states
    (api.startSimulation as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          sessionId: 'test-session-123',
          patientName: 'Test Patient',
          initialPrompt: 'Hello, I need help with my symptoms.',
        }), 2000)
      )
    );

    renderWithRouter(<SimulationChatPage />);

    // Should show the enhanced loading screen with validating case phase
    expect(screen.getByText(/Validating Case/i)).toBeInTheDocument();
    
    // Should show progress elements
    expect(document.querySelector('.bg-gradient-to-r')).toBeInTheDocument();
    
    // Should show phase-specific content
    await waitFor(() => {
      expect(screen.getByText(/Validating case VP-OPTH-001/i) || 
             screen.getByText(/Checking case availability/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('shows startup progress in header when loading', async () => {
    const { api } = await import('../../services/apiService');
    
    (api.startSimulation as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          sessionId: 'test-session-123',
          patientName: 'Test Patient',
        }), 1000)
      )
    );

    renderWithRouter(<SimulationChatPage />);

    // Should show loading state - the component shows full-screen loading initially
    await waitFor(() => {
      expect(screen.getByText(/Validating Case/i) || 
             screen.getByText(/Creating Session/i) ||
             screen.getByText(/Loading Patient/i)).toBeInTheDocument();
    }, { timeout: 500 });
  });

  test('transitions smoothly from loading to active state', async () => {
    const { api } = await import('../../services/apiService');
    
    (api.startSimulation as any).mockResolvedValue({
      sessionId: 'test-session-123',
      patientName: 'Test Patient',
      initialPrompt: 'Hello, I need help.',
    });

    renderWithRouter(<SimulationChatPage />);

    // Should show loading phases first
    expect(screen.getByText(/Validating Case/i)).toBeInTheDocument();

    // Should eventually show the active simulation interface
    await waitFor(() => {
      expect(screen.getByText(/Test Patient/i)).toBeInTheDocument();
    }, { timeout: 6000 });

    // Should show completion message or active session
    await waitFor(() => {
      expect(screen.getByText(/Simulation ready/i) || 
             screen.getByText(/Active Session/i) ||
             screen.getByText(/Simuatech/i)).toBeInTheDocument();
    }, { timeout: 7000 });
  }, 10000);

  test('shows enhanced typing indicator during message loading', async () => {
    const { api } = await import('../../services/apiService');
    
    (api.startSimulation as any).mockResolvedValue({
      sessionId: 'test-session-123',
      patientName: 'Test Patient',
      initialPrompt: 'Hello, I need help.',
    });

    renderWithRouter(<SimulationChatPage />);

    // Wait for simulation to be ready
    await waitFor(() => {
      expect(screen.getByText(/Test Patient/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // The typing indicator should have enhanced animations
    // This is tested by checking for the presence of bounce animations
    const animatedElements = document.querySelectorAll('.animate-bounce');
    expect(animatedElements.length).toBeGreaterThan(0);
  });
});