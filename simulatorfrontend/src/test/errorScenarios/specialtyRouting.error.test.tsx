import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { api } from '../../services/apiService';
import { useSpecialtyContext } from '../../hooks/useSpecialtyContext';
import SpecialtyCasePage from '../../pages/SpecialtyCasePage';

// Mock the API service
vi.mock('../../services/apiService', () => ({
  api: {
    getCases: vi.fn(),
    getCaseCategories: vi.fn(),
    startSimulation: vi.fn(),
    setSpecialtyContext: vi.fn(),
    checkAuth: vi.fn(),
    getUserProfile: vi.fn(),
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

// Mock notification system with tracking
const mockAddNotification = vi.fn();
vi.mock('../../components/NotificationToast', () => ({
  useNotification: () => ({
    addNotification: mockAddNotification,
    NotificationContainer: () => <div data-testid="notification-container" />,
  })
}));

// Mock other dependencies
vi.mock('../../hooks/useSpecialtyErrorHandler', () => ({
  useSpecialtyErrorHandler: () => ({})
}));

vi.mock('../../utils/errorHandling', () => ({
  createRetryFunction: vi.fn((fn, retries = 3, delay = 1000) => {
    return async () => {
      for (let i = 0; i < retries; i++) {
        try {
          return await fn();
        } catch (error) {
          if (i === retries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };
  }),
  getSpecialtyErrorMessage: vi.fn((error, context, action) => {
    if (error.message.includes('401') || error.message.includes('Session expired')) {
      return 'Your session has expired. Please log in again.';
    }
    if (error.message.includes('Network')) {
      return `Network error while trying to ${action}. Please check your connection.`;
    }
    if (error.message.includes('timeout')) {
      return `Request timed out while trying to ${action}. Please try again.`;
    }
    return `Failed to ${action} for ${context}: ${error.message}`;
  }),
}));

// Mock components
vi.mock('../../components/SpecialtyHeader', () => ({
  default: ({ specialtyName }: { specialtyName: string }) => (
    <div data-testid="specialty-header">{specialtyName} Cases</div>
  )
}));

vi.mock('../../components/SpecialtyRouteGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('../../components/SpecialtyErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('../../components/SessionManager', () => ({
  default: () => <div data-testid="session-manager" />
}));

vi.mock('../../components/Navbar', () => ({
  default: () => <div data-testid="navbar" />
}));

vi.mock('../../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() })
}));

describe('Specialty Routing Error Scenarios', () => {
  const user = userEvent.setup();

  const mockSpecialties = ['Internal Medicine', 'Pediatrics', 'Emergency Medicine'];
  const mockSpecialtyCounts = {
    'Internal Medicine': 15,
    'Pediatrics': 8,
    'Emergency Medicine': 12,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful responses
    (api.getCaseCategories as any).mockResolvedValue({
      specialties: mockSpecialties,
      specialty_counts: mockSpecialtyCounts,
    });
    
    (api.checkAuth as any).mockResolvedValue({ valid: true });
    (api.getUserProfile as any).mockResolvedValue({ id: '1', username: 'testuser' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Network and API Errors', () => {
    it('should handle network timeout errors', async () => {
      (api.getCases as any).mockRejectedValue(new Error('Network timeout'));

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to Load Cases/)).toBeInTheDocument();
      });

      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should handle 401 authentication errors', async () => {
      (api.getCases as any).mockRejectedValue(new Error('401 Unauthorized'));

      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({ specialty: 'internal_medicine' }),
        };
      });

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.stringContaining('session has expired'),
          'error'
        );
      });
    });

    it('should handle 500 server errors', async () => {
      (api.getCases as any).mockRejectedValue(new Error('500 Internal Server Error'));

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to Load Cases/)).toBeInTheDocument();
      });

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load cases'),
        'error'
      );
    });

    it('should handle malformed API responses', async () => {
      (api.getCases as any).mockResolvedValue({
        // Missing required fields
        cases: null,
        // Invalid structure
      });

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Data Format Error/)).toBeInTheDocument();
      });

      expect(screen.getByText(/unexpected format/)).toBeInTheDocument();
    });

    it('should handle empty API responses', async () => {
      (api.getCases as any).mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Data Format Error/)).toBeInTheDocument();
      });
    });
  });

  describe('Invalid Route Scenarios', () => {
    it('should handle completely invalid specialty slugs', async () => {
      const invalidSlugs = [
        '/INVALID_SPECIALTY',
        '/specialty with spaces',
        '/specialty!@#$%',
        '/specialty/with/slashes',
        '/_invalid_start',
        '/invalid_end_',
        '/specialty__double__underscore'
      ];

      for (const slug of invalidSlugs) {
        render(
          <MemoryRouter initialEntries={[slug]}>
            <App />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByText(/Invalid specialty URL/)).toBeInTheDocument();
        });

        // Clean up for next iteration
        screen.unmount?.();
      }
    });

    it('should handle valid slug format but non-existent specialty', async () => {
      render(
        <MemoryRouter initialEntries={['/non_existent_specialty']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Specialty not found/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/non_existent_specialty.*not found/i)).toBeInTheDocument();
      expect(screen.getByText('Browse Available Specialties')).toBeInTheDocument();
    });

    it('should handle URL encoding issues', async () => {
      const encodedUrls = [
        '/internal%20medicine',
        '/specialty%26test',
        '/specialty%2Ftest'
      ];

      for (const url of encodedUrls) {
        render(
          <MemoryRouter initialEntries={[url]}>
            <App />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByText(/Invalid specialty URL|Specialty not found/)).toBeInTheDocument();
        });

        screen.unmount?.();
      }
    });
  });

  describe('Simulation Start Errors', () => {
    it('should handle simulation service unavailable', async () => {
      (api.getCases as any).mockResolvedValue({
        cases: [{
          id: 'case-1',
          title: 'Test Case',
          description: 'Test description',
          specialty: 'Internal Medicine'
        }],
        currentPage: 1,
        totalPages: 1,
        totalCases: 1
      });

      (api.startSimulation as any).mockRejectedValue(new Error('Simulation service unavailable'));

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Case')).toBeInTheDocument();
      });

      const startButton = screen.getByText('Start Simulation');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.stringContaining('Failed to start simulation'),
          'error'
        );
      });
    });

    it('should handle simulation timeout', async () => {
      (api.getCases as any).mockResolvedValue({
        cases: [{
          id: 'case-1',
          title: 'Test Case',
          description: 'Test description',
          specialty: 'Internal Medicine'
        }],
        currentPage: 1,
        totalPages: 1,
        totalCases: 1
      });

      (api.startSimulation as any).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Case')).toBeInTheDocument();
      });

      const startButton = screen.getByText('Start Simulation');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.stringContaining('timed out'),
          'error'
        );
      }, { timeout: 2000 });
    });

    it('should handle invalid case ID for simulation', async () => {
      (api.getCases as any).mockResolvedValue({
        cases: [{
          id: 'case-1',
          title: 'Test Case',
          description: 'Test description',
          specialty: 'Internal Medicine'
        }],
        currentPage: 1,
        totalPages: 1,
        totalCases: 1
      });

      (api.startSimulation as any).mockRejectedValue(new Error('Case not found'));

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Case')).toBeInTheDocument();
      });

      const startButton = screen.getByText('Start Simulation');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.stringContaining('Failed to start simulation'),
          'error'
        );
      });
    });
  });

  describe('Retry Mechanisms', () => {
    it('should implement exponential backoff for retries', async () => {
      let callCount = 0;
      (api.getCases as any).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          cases: [],
          currentPage: 1,
          totalPages: 1,
          totalCases: 0
        });
      });

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to Load Cases/)).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByText(/No.*Internal Medicine.*cases/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(callCount).toBeGreaterThan(1);
    });

    it('should limit retry attempts', async () => {
      let callCount = 0;
      (api.getCases as any).mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error('Persistent failure'));
      });

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to Load Cases/)).toBeInTheDocument();
      });

      // Click retry multiple times
      for (let i = 0; i < 5; i++) {
        const retryButton = screen.queryByText('Retry');
        if (retryButton && !retryButton.hasAttribute('disabled')) {
          await user.click(retryButton);
          await waitFor(() => {}, { timeout: 1000 });
        }
      }

      // Should eventually disable retry button
      await waitFor(() => {
        const retryButton = screen.getByText(/Max Retries Reached|Retry/);
        expect(retryButton).toBeDisabled();
      });
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle rapid navigation between specialties', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      // Rapidly switch between specialties
      rerender(
        <MemoryRouter initialEntries={['/pediatrics']}>
          <App />
        </MemoryRouter>
      );

      rerender(
        <MemoryRouter initialEntries={['/emergency_medicine']}>
          <App />
        </MemoryRouter>
      );

      rerender(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      // Should handle without errors
      await waitFor(() => {
        expect(screen.getByText('Internal Medicine Cases')).toBeInTheDocument();
      });
    });

    it('should cancel previous requests when navigating', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise(resolve => { resolveFirst = resolve; });
      const secondPromise = new Promise(resolve => { resolveSecond = resolve; });

      (api.getCases as any)
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { rerender } = render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      // Navigate to different specialty before first request completes
      rerender(
        <MemoryRouter initialEntries={['/pediatrics']}>
          <App />
        </MemoryRouter>
      );

      // Resolve second request first
      resolveSecond!({
        cases: [{ id: 'ped-1', title: 'Pediatric Case', specialty: 'Pediatrics' }],
        currentPage: 1,
        totalPages: 1,
        totalCases: 1
      });

      await waitFor(() => {
        expect(screen.getByText('Pediatric Case')).toBeInTheDocument();
      });

      // Resolve first request (should be ignored)
      resolveFirst!({
        cases: [{ id: 'int-1', title: 'Internal Medicine Case', specialty: 'Internal Medicine' }],
        currentPage: 1,
        totalPages: 1,
        totalCases: 1
      });

      // Should still show pediatric case, not internal medicine
      expect(screen.getByText('Pediatric Case')).toBeInTheDocument();
      expect(screen.queryByText('Internal Medicine Case')).not.toBeInTheDocument();
    });
  });

  describe('Memory and Performance Issues', () => {
    it('should handle large datasets without memory issues', async () => {
      const largeCaseSet = {
        cases: Array.from({ length: 1000 }, (_, i) => ({
          id: `case-${i}`,
          title: `Case ${i}`,
          description: `Description for case ${i}`,
          specialty: 'Internal Medicine'
        })),
        currentPage: 1,
        totalPages: 100,
        totalCases: 1000
      };

      (api.getCases as any).mockResolvedValue(largeCaseSet);

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      // Should handle large dataset without crashing
      await waitFor(() => {
        expect(screen.getByText('Case 0')).toBeInTheDocument();
      });

      expect(screen.getByText(/1000 cases available/)).toBeInTheDocument();
    });

    it('should handle memory cleanup on unmount', async () => {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('specialty-header')).toBeInTheDocument();
      });

      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge Case URL Patterns', () => {
    it('should handle URL fragments and query parameters', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine#section']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Internal Medicine Cases')).toBeInTheDocument();
      });
    });

    it('should handle trailing slashes', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Internal Medicine Cases')).toBeInTheDocument();
      });
    });

    it('should handle case sensitivity in URLs', async () => {
      // Should treat as invalid due to uppercase
      render(
        <MemoryRouter initialEntries={['/Internal_Medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Invalid specialty URL|Specialty not found/)).toBeInTheDocument();
      });
    });
  });
});