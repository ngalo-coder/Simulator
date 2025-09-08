import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { api } from '../../services/apiService';

// Mock the API service with comprehensive responses
vi.mock('../../services/apiService', () => ({
  api: {
    getCases: vi.fn(),
    getCaseCategories: vi.fn(),
    startSimulation: vi.fn(),
    setSpecialtyContext: vi.fn(),
    checkAuth: vi.fn(),
    getUserProfile: vi.fn(),
    getDashboardData: vi.fn(),
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
  createRetryFunction: vi.fn((fn) => fn),
  getSpecialtyErrorMessage: vi.fn((error, context, action) => 
    `Failed to ${action} for ${context}: ${error.message}`
  ),
}));

// Mock components with more realistic implementations
vi.mock('../../components/SpecialtyHeader', () => ({
  default: ({ specialtyName, showBreadcrumbs }: { specialtyName: string; showBreadcrumbs?: boolean }) => (
    <div data-testid="specialty-header">
      {showBreadcrumbs && (
        <nav data-testid="breadcrumbs">
          <a href="/dashboard">Dashboard</a> → <span>{specialtyName}</span>
        </nav>
      )}
      <h1>{specialtyName} Cases</h1>
    </div>
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
  default: () => (
    <nav data-testid="navbar">
      <a href="/dashboard">Dashboard</a>
      <a href="/browse-cases">Browse Cases</a>
    </nav>
  )
}));

vi.mock('../../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() })
}));

describe('Specialty Routing End-to-End Tests', () => {
  const user = userEvent.setup();

  const mockSpecialties = [
    'Internal Medicine',
    'Pediatrics', 
    'Emergency Medicine',
    'Cardiology',
    'Neurology'
  ];

  const mockSpecialtyCounts = {
    'Internal Medicine': 25,
    'Pediatrics': 18,
    'Emergency Medicine': 15,
    'Cardiology': 12,
    'Neurology': 8,
  };

  const mockInternalMedicineCases = {
    cases: [
      {
        id: 'case-1',
        title: 'Acute Chest Pain',
        description: 'A 55-year-old male presents with acute onset chest pain',
        specialty: 'Internal Medicine',
        patient_age: 55,
        patient_gender: 'Male',
        chief_complaint: 'Chest pain'
      },
      {
        id: 'case-2',
        title: 'Diabetes Management',
        description: 'A 42-year-old female with poorly controlled diabetes',
        specialty: 'Internal Medicine',
        patient_age: 42,
        patient_gender: 'Female',
        chief_complaint: 'High blood sugar'
      },
      {
        id: 'case-3',
        title: 'Hypertension Crisis',
        description: 'A 60-year-old male with severe hypertension',
        specialty: 'Internal Medicine',
        patient_age: 60,
        patient_gender: 'Male',
        chief_complaint: 'Severe headache'
      }
    ],
    currentPage: 1,
    totalPages: 2,
    totalCases: 25,
    hasNextPage: true,
    hasPrevPage: false
  };

  const mockPediatricsCases = {
    cases: [
      {
        id: 'ped-1',
        title: 'Febrile Seizure',
        description: 'A 2-year-old child with febrile seizure',
        specialty: 'Pediatrics',
        patient_age: 2,
        patient_gender: 'Male',
        chief_complaint: 'Seizure with fever'
      },
      {
        id: 'ped-2',
        title: 'Asthma Exacerbation',
        description: 'A 8-year-old with acute asthma attack',
        specialty: 'Pediatrics',
        patient_age: 8,
        patient_gender: 'Female',
        chief_complaint: 'Difficulty breathing'
      }
    ],
    currentPage: 1,
    totalPages: 1,
    totalCases: 18,
    hasNextPage: false,
    hasPrevPage: false
  };

  const mockDashboardData = {
    specialties: mockSpecialties.map(specialty => ({
      name: specialty,
      caseCount: mockSpecialtyCounts[specialty],
      description: `Cases in ${specialty}`,
    })),
    recentActivity: [],
    userStats: {
      casesCompleted: 5,
      averageScore: 85,
      totalTime: 120
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default API responses
    (api.getCaseCategories as any).mockResolvedValue({
      specialties: mockSpecialties,
      specialty_counts: mockSpecialtyCounts,
    });
    
    (api.checkAuth as any).mockResolvedValue({ valid: true });
    (api.getUserProfile as any).mockResolvedValue({ id: '1', username: 'testuser' });
    (api.getDashboardData as any).mockResolvedValue(mockDashboardData);
    
    // Setup specialty-specific case responses
    (api.getCases as any).mockImplementation((filters) => {
      if (filters?.specialty === 'Internal Medicine') {
        return Promise.resolve(mockInternalMedicineCases);
      } else if (filters?.specialty === 'Pediatrics') {
        return Promise.resolve(mockPediatricsCases);
      }
      return Promise.resolve({ cases: [], currentPage: 1, totalPages: 1, totalCases: 0 });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete User Journey: Dashboard to Specialty Cases', () => {
    it('should complete full navigation flow from dashboard to specialty cases', async () => {
      // Start at dashboard
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
      });

      // Navigate to browse cases (simulated)
      // In a real app, this would be clicking a link, but we'll simulate the navigation
      const { rerender } = render(
        <MemoryRouter initialEntries={['/browse-cases']}>
          <App />
        </MemoryRouter>
      );

      // Then navigate to specific specialty
      rerender(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      // Verify we're on the specialty page
      await waitFor(() => {
        expect(screen.getByTestId('specialty-header')).toBeInTheDocument();
        expect(screen.getByText('Internal Medicine Cases')).toBeInTheDocument();
      });

      // Verify breadcrumbs are shown
      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Verify cases are loaded
      await waitFor(() => {
        expect(screen.getByText('Acute Chest Pain')).toBeInTheDocument();
        expect(screen.getByText('Diabetes Management')).toBeInTheDocument();
        expect(screen.getByText('Hypertension Crisis')).toBeInTheDocument();
      });

      // Verify case count display
      expect(screen.getByText(/25 cases available in Internal Medicine/)).toBeInTheDocument();
    });

    it('should handle complete search and filter workflow', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search within Internal Medicine/)).toBeInTheDocument();
      });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/Search within Internal Medicine/);
      await user.type(searchInput, 'chest pain');

      await waitFor(() => {
        expect(api.getCases).toHaveBeenCalledWith(
          expect.objectContaining({
            specialty: 'Internal Medicine',
            search: 'chest pain'
          })
        );
      });

      // Open advanced filters
      const moreFiltersButton = screen.getByText('More Filters');
      await user.click(moreFiltersButton);

      // Verify advanced filters are shown
      expect(screen.getByText('Patient Gender')).toBeInTheDocument();
      expect(screen.getByText('Min Age')).toBeInTheDocument();
      expect(screen.getByText('Max Age')).toBeInTheDocument();

      // Apply gender filter
      const genderSelect = screen.getByDisplayValue('All Genders');
      await user.selectOptions(genderSelect, 'Male');

      await waitFor(() => {
        expect(api.getCases).toHaveBeenCalledWith(
          expect.objectContaining({
            specialty: 'Internal Medicine',
            search: 'chest pain',
            patient_gender: 'Male'
          })
        );
      });

      // Apply age filters
      const minAgeInput = screen.getByPlaceholderText('Min age');
      const maxAgeInput = screen.getByPlaceholderText('Max age');
      
      await user.type(minAgeInput, '40');
      await user.type(maxAgeInput, '65');

      await waitFor(() => {
        expect(api.getCases).toHaveBeenCalledWith(
          expect.objectContaining({
            specialty: 'Internal Medicine',
            search: 'chest pain',
            patient_gender: 'Male',
            patient_age_min: 40,
            patient_age_max: 65
          })
        );
      });

      // Verify active filters are displayed
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('Search: "chest pain"')).toBeInTheDocument();
      expect(screen.getByText('Gender: Male')).toBeInTheDocument();
      expect(screen.getByText('Age: 40-65')).toBeInTheDocument();

      // Clear all filters
      const clearAllButton = screen.getByText('Clear All');
      await user.click(clearAllButton);

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(genderSelect).toHaveValue('');
        expect(minAgeInput).toHaveValue('');
        expect(maxAgeInput).toHaveValue('');
      });
    });

    it('should handle complete simulation start workflow', async () => {
      (api.startSimulation as any).mockResolvedValue({ sessionId: 'session-123' });

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Acute Chest Pain')).toBeInTheDocument();
      });

      // Find and click start simulation button for first case
      const caseCards = screen.getAllByText('Start Simulation');
      await user.click(caseCards[0]);

      // Verify simulation start API calls
      await waitFor(() => {
        expect(api.startSimulation).toHaveBeenCalledWith('case-1');
        expect(api.setSpecialtyContext).toHaveBeenCalledWith('', 'Internal Medicine');
      });

      // Verify success notification
      expect(mockAddNotification).toHaveBeenCalledWith(
        'Starting simulation for "Acute Chest Pain"',
        'success'
      );
    });
  });

  describe('Cross-Specialty Navigation', () => {
    it('should handle navigation between different specialties', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      // Verify Internal Medicine page loads
      await waitFor(() => {
        expect(screen.getByText('Internal Medicine Cases')).toBeInTheDocument();
        expect(screen.getByText('Acute Chest Pain')).toBeInTheDocument();
      });

      // Navigate to Pediatrics
      rerender(
        <MemoryRouter initialEntries={['/pediatrics']}>
          <App />
        </MemoryRouter>
      );

      // Verify Pediatrics page loads with different cases
      await waitFor(() => {
        expect(screen.getByText('Pediatrics Cases')).toBeInTheDocument();
        expect(screen.getByText('Febrile Seizure')).toBeInTheDocument();
        expect(screen.getByText('Asthma Exacerbation')).toBeInTheDocument();
      });

      // Verify API was called with correct specialty
      expect(api.getCases).toHaveBeenCalledWith(
        expect.objectContaining({
          specialty: 'Pediatrics'
        })
      );

      // Navigate back to Internal Medicine
      rerender(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Internal Medicine Cases')).toBeInTheDocument();
      });
    });

    it('should maintain separate filter states for different specialties', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search within Internal Medicine/)).toBeInTheDocument();
      });

      // Apply search in Internal Medicine
      const searchInput = screen.getByPlaceholderText(/Search within Internal Medicine/);
      await user.type(searchInput, 'chest pain');

      // Navigate to Pediatrics
      rerender(
        <MemoryRouter initialEntries={['/pediatrics']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search within Pediatrics/)).toBeInTheDocument();
      });

      // Verify search is reset for new specialty
      const pediatricsSearchInput = screen.getByPlaceholderText(/Search within Pediatrics/);
      expect(pediatricsSearchInput).toHaveValue('');

      // Apply different search in Pediatrics
      await user.type(pediatricsSearchInput, 'fever');

      await waitFor(() => {
        expect(api.getCases).toHaveBeenCalledWith(
          expect.objectContaining({
            specialty: 'Pediatrics',
            search: 'fever'
          })
        );
      });
    });
  });

  describe('Error Scenarios and Recovery', () => {
    it('should handle and recover from API errors', async () => {
      // First call fails
      (api.getCases as any).mockRejectedValueOnce(new Error('Network timeout'));

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/Failed to load cases/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByText('Retry')).toBeInTheDocument();

      // Mock successful retry
      (api.getCases as any).mockResolvedValueOnce(mockInternalMedicineCases);

      // Click retry
      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      // Should recover and show cases
      await waitFor(() => {
        expect(screen.getByText('Acute Chest Pain')).toBeInTheDocument();
      });
    });

    it('should handle invalid specialty URLs gracefully', async () => {
      render(
        <MemoryRouter initialEntries={['/invalid_specialty_name']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Invalid specialty URL|Specialty not found/)).toBeInTheDocument();
      });

      // Should provide navigation options
      expect(screen.getByText('Browse Specialties')).toBeInTheDocument();
      expect(screen.getByText('All Cases')).toBeInTheDocument();
    });

    it('should handle simulation start errors gracefully', async () => {
      (api.startSimulation as any).mockRejectedValue(new Error('Simulation service unavailable'));

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Acute Chest Pain')).toBeInTheDocument();
      });

      const startButton = screen.getAllByText('Start Simulation')[0];
      await user.click(startButton);

      // Should show error notification
      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.stringContaining('Failed to start simulation'),
          'error'
        );
      });
    });
  });

  describe('Pagination and Large Data Sets', () => {
    it('should handle pagination correctly', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      });

      // Should show pagination controls
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();

      // Mock second page data
      const secondPageData = {
        ...mockInternalMedicineCases,
        cases: [
          {
            id: 'case-4',
            title: 'Heart Failure',
            description: 'A 70-year-old with congestive heart failure',
            specialty: 'Internal Medicine',
            patient_age: 70,
            patient_gender: 'Female',
            chief_complaint: 'Shortness of breath'
          }
        ],
        currentPage: 2,
        hasNextPage: false,
        hasPrevPage: true
      };

      (api.getCases as any).mockResolvedValueOnce(secondPageData);

      // Click next page
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(api.getCases).toHaveBeenCalledWith(
          expect.objectContaining({
            specialty: 'Internal Medicine',
            page: 2
          })
        );
      });

      // Should show second page content
      await waitFor(() => {
        expect(screen.getByText('Heart Failure')).toBeInTheDocument();
        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
      });
    });

    it('should handle cases per page selection', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('12')).toBeInTheDocument();
      });

      // Change cases per page
      const limitSelect = screen.getByDisplayValue('12');
      await user.selectOptions(limitSelect, '24');

      await waitFor(() => {
        expect(api.getCases).toHaveBeenCalledWith(
          expect.objectContaining({
            specialty: 'Internal Medicine',
            limit: 24,
            page: 1 // Should reset to page 1
          })
        );
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide proper loading states', async () => {
      // Delay API response to test loading state
      (api.getCases as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockInternalMedicineCases), 100))
      );

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      // Should show loading state
      expect(screen.getByText(/Loading Internal Medicine cases/)).toBeInTheDocument();

      // Should show spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('Acute Chest Pain')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should provide clear navigation options', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Internal Medicine Cases')).toBeInTheDocument();
      });

      // Should show quick navigation section
      expect(screen.getByText('Quick Navigation')).toBeInTheDocument();
      expect(screen.getByText('Browse All Cases')).toBeInTheDocument();
      expect(screen.getByText('Other Specialties')).toBeInTheDocument();
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search within Internal Medicine/)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search within Internal Medicine/);
      
      // Focus should work properly
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Tab navigation should work
      await user.tab();
      expect(document.activeElement).not.toBe(searchInput);
    });
  });
});