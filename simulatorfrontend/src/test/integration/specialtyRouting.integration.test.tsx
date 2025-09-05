import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import App from '../../App';
import { apiService } from '../../services/apiService';

// Mock the API service
vi.mock('../../services/apiService', () => ({
  apiService: {
    getCases: vi.fn(),
    getCaseCategories: vi.fn(),
    startSimulation: vi.fn(),
    setSpecialtyContext: vi.fn(),
    checkAuth: vi.fn(),
    getUserProfile: vi.fn(),
    getSpecialtyContext: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    streamSimulationAsk: vi.fn(),
    getPerformanceSummary: vi.fn(),
    healthCheck: vi.fn(),
    clearSpecialtyContext: vi.fn(),
    getCase: vi.fn(),
    submitInteraction: vi.fn(),
    endSimulation: vi.fn(),
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

// Mock error handlers
vi.mock('../../hooks/useSpecialtyErrorHandler', () => ({
  useSpecialtyErrorHandler: () => ({})
}));

vi.mock('../../utils/errorHandling', () => ({
  createRetryFunction: vi.fn((fn) => fn),
  getSpecialtyErrorMessage: vi.fn(() => 'Error message'),
}));

// Mock components that might cause issues in tests
vi.mock('../../components/SpecialtyHeader', () => ({
  default: ({ specialtyName }: { specialtyName: string }) => (
    <div data-testid="specialty-header">{specialtyName}</div>
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

describe('Specialty Routing Integration Tests', () => {
  const mockSpecialties = ['Internal Medicine', 'Pediatrics', 'Emergency Medicine', 'Cardiology'];
  const mockSpecialtyCounts = {
    'Internal Medicine': 15,
    'Pediatrics': 8,
    'Emergency Medicine': 12,
    'Cardiology': 10,
  };

  const mockCasesResponse = {
    cases: [
      {
        id: '1',
        title: 'Chest Pain Case',
        description: 'A 45-year-old male presents with chest pain',
        specialty: 'Internal Medicine',
        patient_age: 45,
        patient_gender: 'Male',
        chief_complaint: 'Chest pain'
      },
      {
        id: '2',
        title: 'Shortness of Breath',
        description: 'A 32-year-old female with shortness of breath',
        specialty: 'Internal Medicine',
        patient_age: 32,
        patient_gender: 'Female',
        chief_complaint: 'Shortness of breath'
      }
    ],
    currentPage: 1,
    totalPages: 1,
    totalCases: 2,
    hasNextPage: false,
    hasPrevPage: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default API responses
    (apiService.getCaseCategories as any).mockResolvedValue({
      specialties: mockSpecialties,
      specialty_counts: mockSpecialtyCounts,
    });
    
    (apiService.getCases as any).mockResolvedValue(mockCasesResponse);
    (apiService.checkAuth as any).mockResolvedValue({ valid: true });
    (apiService.getUserProfile as any).mockResolvedValue({ id: '1', username: 'testuser' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation Flow Integration', () => {
    it('should navigate from dashboard to specialty page', async () => {
      // Mock dashboard data
      const mockDashboardData = {
        specialties: mockSpecialties.map(specialty => ({
          name: specialty,
          caseCount: mockSpecialtyCounts[specialty],
          slug: specialty.toLowerCase().replace(/\s+/g, '_')
        }))
      };

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
      });
    });

    it('should handle direct navigation to specialty URL', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('specialty-header')).toBeInTheDocument();
      });

      // Should display specialty name
      expect(screen.getByText('Internal Medicine')).toBeInTheDocument();
      
      // Should call API with specialty filter
      await waitFor(() => {
        expect(apiService.getCases).toHaveBeenCalledWith(
          expect.objectContaining({
            specialty: 'Internal Medicine'
          })
        );
      });
    });

    it('should handle invalid specialty URLs with proper error handling', async () => {
      render(
        <MemoryRouter initialEntries={['/invalid_specialty']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Should show error state for invalid specialty
        expect(screen.getByText(/Invalid specialty URL|Specialty not found/)).toBeInTheDocument();
      });
    });

    it('should maintain specialty context during navigation', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('specialty-header')).toBeInTheDocument();
      });

      // Navigate to different specialty
      rerender(
        <MemoryRouter initialEntries={['/pediatrics']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Pediatrics')).toBeInTheDocument();
      });

      // Should call API with new specialty filter
      expect(apiService.getCases).toHaveBeenCalledWith(
        expect.objectContaining({
          specialty: 'Pediatrics'
        })
      );
    });
  });

  describe('API Integration', () => {
    it('should fetch and display specialty-filtered cases', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiService.getCases).toHaveBeenCalledWith(
          expect.objectContaining({
            specialty: 'Internal Medicine',
            page: 1,
            limit: 12
          })
        );
      });

      // Should display cases
      await waitFor(() => {
        expect(screen.getByText('Chest Pain Case')).toBeInTheDocument();
        expect(screen.getByText('Shortness of Breath')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      (apiService.getCases as any).mockRejectedValue(new Error('Network error'));

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load cases|Error/)).toBeInTheDocument();
      });
    });

    it('should handle empty specialty results', async () => {
      (apiService.getCases as any).mockResolvedValue({
        cases: [],
        currentPage: 1,
        totalPages: 1,
        totalCases: 0,
        hasNextPage: false,
        hasPrevPage: false
      });

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No.*Internal Medicine.*cases/i)).toBeInTheDocument();
      });
    });

    it('should integrate filtering with specialty context', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search within Internal Medicine/)).toBeInTheDocument();
      });

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/Search within Internal Medicine/);
      fireEvent.change(searchInput, { target: { value: 'chest pain' } });

      await waitFor(() => {
        expect(apiService.getCases).toHaveBeenCalledWith(
          expect.objectContaining({
            specialty: 'Internal Medicine',
            search: 'chest pain',
            page: 1,
            limit: 12
          })
        );
      });
    });
  });

  describe('Simulation Integration', () => {
    it('should start simulation with specialty context preserved', async () => {
      (apiService.startSimulation as any).mockResolvedValue({ sessionId: 'test-session-123' });

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Chest Pain Case')).toBeInTheDocument();
      });

      // Click start simulation
      const startButton = screen.getAllByText('Start Simulation')[0];
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(apiService.startSimulation).toHaveBeenCalledWith('1');
        expect(apiService.setSpecialtyContext).toHaveBeenCalledWith('', 'Internal Medicine');
      });
    });

    it('should handle simulation start errors', async () => {
      (apiService.startSimulation as any).mockRejectedValue(new Error('Simulation start failed'));

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Chest Pain Case')).toBeInTheDocument();
      });

      const startButton = screen.getAllByText('Start Simulation')[0];
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(apiService.startSimulation).toHaveBeenCalled();
        // Error should be handled gracefully
      });
    });
  });

  describe('Browser History Integration', () => {
    it('should handle browser back/forward navigation', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/internal_medicine', '/pediatrics']} initialIndex={1}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Pediatrics')).toBeInTheDocument();
      });

      // Simulate going back
      rerender(
        <MemoryRouter initialEntries={['/internal_medicine', '/pediatrics']} initialIndex={0}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Internal Medicine')).toBeInTheDocument();
      });
    });

    it('should handle page refresh on specialty routes', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('specialty-header')).toBeInTheDocument();
        expect(screen.getByText('Internal Medicine')).toBeInTheDocument();
      });

      // Should maintain specialty context after "refresh"
      expect(apiService.getCases).toHaveBeenCalledWith(
        expect.objectContaining({
          specialty: 'Internal Medicine'
        })
      );
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle component errors gracefully', async () => {
      // Mock a component error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      (apiService.getCases as any).mockImplementation(() => {
        throw new Error('Component error');
      });

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      // Error boundary should catch the error
      await waitFor(() => {
        // Component should still render, error should be handled
        expect(screen.getByTestId('specialty-header')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Caching', () => {
    it('should cache specialty data across route changes', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiService.getCaseCategories).toHaveBeenCalledTimes(1);
      });

      // Navigate to different specialty
      rerender(
        <MemoryRouter initialEntries={['/pediatrics']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Pediatrics')).toBeInTheDocument();
      });

      // Should not call getCaseCategories again due to caching
      expect(apiService.getCaseCategories).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent navigation requests', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      // Quickly navigate between specialties
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

      await waitFor(() => {
        expect(screen.getByText('Emergency Medicine')).toBeInTheDocument();
      });

      // Should handle rapid navigation without errors
      expect(apiService.getCases).toHaveBeenCalled();
    });
  });
});