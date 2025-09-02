import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SimulationChatPage from '../pages/SimulationChatPage';

// Mock the API service
vi.mock('../services/apiService', () => ({
  api: {
    startSimulation: vi.fn(),
    isAuthenticated: vi.fn(() => true),
  }
}));

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    isAuthenticated: true
  })
}));

// Mock useParams to simulate different URL scenarios
const mockNavigate = vi.fn();
const mockLocation = { state: {} };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe('Simulation Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle invalid case ID error correctly', async () => {
    const { useParams } = await import('react-router-dom');
    const { api } = await import('../services/apiService');
    
    // Mock invalid case scenario
    vi.mocked(useParams).mockReturnValue({ caseId: 'invalid-case' });
    vi.mocked(api.startSimulation).mockRejectedValue(new Error('404 - Case not found'));

    render(
      <BrowserRouter>
        <SimulationChatPage />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Case Not Found')).toBeInTheDocument();
    });

    expect(screen.getByText(/This case could not be found/)).toBeInTheDocument();
    expect(screen.getByText('Back to Cases')).toBeInTheDocument();
  });

  it('should handle network error with retry option', async () => {
    const { useParams } = await import('react-router-dom');
    const { api } = await import('../services/apiService');
    
    // Mock network error scenario
    vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' });
    vi.mocked(api.startSimulation).mockRejectedValue(new Error('Failed to fetch'));

    render(
      <BrowserRouter>
        <SimulationChatPage />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    });

    expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should handle authentication error correctly', async () => {
    const { useParams } = await import('react-router-dom');
    const { api } = await import('../services/apiService');
    
    // Mock authentication error scenario
    vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' });
    vi.mocked(api.startSimulation).mockRejectedValue(new Error('401 - Unauthorized'));

    render(
      <BrowserRouter>
        <SimulationChatPage />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });

    expect(screen.getByText(/Your session has expired/)).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should handle server error with retry option', async () => {
    const { useParams } = await import('react-router-dom');
    const { api } = await import('../services/apiService');
    
    // Mock server error scenario
    vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' });
    vi.mocked(api.startSimulation).mockRejectedValue(new Error('500 - Internal Server Error'));

    render(
      <BrowserRouter>
        <SimulationChatPage />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Server Error')).toBeInTheDocument();
    });

    expect(screen.getByText(/The server is experiencing issues/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should handle timeout error correctly', async () => {
    const { useParams } = await import('react-router-dom');
    const { api } = await import('../services/apiService');
    
    // Mock timeout error scenario
    vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' });
    vi.mocked(api.startSimulation).mockRejectedValue(new Error('Request timeout'));

    render(
      <BrowserRouter>
        <SimulationChatPage />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Request Timeout')).toBeInTheDocument();
    });

    expect(screen.getByText(/The request is taking too long/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should handle unknown error with retry option', async () => {
    const { useParams } = await import('react-router-dom');
    const { api } = await import('../services/apiService');
    
    // Mock unknown error scenario
    vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' });
    vi.mocked(api.startSimulation).mockRejectedValue(new Error('Something went wrong'));

    render(
      <BrowserRouter>
        <SimulationChatPage />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
    });

    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should allow retry functionality for retryable errors', async () => {
    const { useParams } = await import('react-router-dom');
    const { api } = await import('../services/apiService');
    
    // Mock network error that can be retried
    vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' });
    vi.mocked(api.startSimulation)
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce({ sessionId: 'test-session', patientName: 'Test Patient' });

    render(
      <BrowserRouter>
        <SimulationChatPage />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // Wait for retry to complete and simulation to start
    await waitFor(() => {
      expect(screen.getByText('Retrying...')).toBeInTheDocument();
    });

    // Verify API was called again
    expect(api.startSimulation).toHaveBeenCalledTimes(2);
  });
});