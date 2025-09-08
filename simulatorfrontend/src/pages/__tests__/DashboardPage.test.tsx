import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import DashboardPage from '../DashboardPage';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/apiService';

// Mock the hooks and services
vi.mock('../../hooks/useAuth');
vi.mock('../../services/apiService');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockApi = api as vi.Mocked<typeof api>;

const renderDashboardPage = () => {
  return render(
    <BrowserRouter>
      <DashboardPage />
    </BrowserRouter>
  );
};

describe('DashboardPage Specialty Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'testuser', role: 'user' },
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
    });

    mockApi.getUserProgress.mockResolvedValue({
      progress: {
        totalCasesCompleted: 5,
        overallAverageScore: 85,
      },
      recentMetrics: [],
    });

    mockApi.getCaseCategories.mockResolvedValue({
      specialties: ['Internal Medicine', 'Pediatrics', 'Emergency Medicine'],
      specialty_counts: {
        'Internal Medicine': 10,
        'Pediatrics': 8,
        'Emergency Medicine': 12,
      },
    });

    mockApi.getSpecialtyContext.mockReturnValue(null);
    mockApi.clearSpecialtyContext.mockImplementation(() => {});
  });

  it('should display specialty quick access buttons', async () => {
    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('Quick Access by Specialty')).toBeInTheDocument();
    });

    expect(screen.getByText('Internal Medicine')).toBeInTheDocument();
    expect(screen.getByText('Pediatrics')).toBeInTheDocument();
    expect(screen.getByText('Emergency Medicine')).toBeInTheDocument();
  });

  it('should navigate to specialty-specific route when specialty button is clicked', async () => {
    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('Internal Medicine')).toBeInTheDocument();
    });

    const internalMedicineButton = screen.getByText('Internal Medicine');
    fireEvent.click(internalMedicineButton);

    expect(mockApi.clearSpecialtyContext).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/internal_medicine');
  });

  it('should show context-aware "View Cases" button text', async () => {
    mockApi.getSpecialtyContext.mockReturnValue({
      specialty: 'Internal Medicine',
      programArea: 'Specialty Program',
    });

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('View Internal Medicine Cases')).toBeInTheDocument();
    });
  });

  it('should show generic "View All Cases" when no context', async () => {
    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('View All Cases')).toBeInTheDocument();
    });
  });

  it('should navigate to specialty route when context exists and View Cases is clicked', async () => {
    mockApi.getSpecialtyContext.mockReturnValue({
      specialty: 'Internal Medicine',
      programArea: 'Specialty Program',
    });

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('View Internal Medicine Cases')).toBeInTheDocument();
    });

    const viewCasesButton = screen.getByText('View Internal Medicine Cases');
    fireEvent.click(viewCasesButton);

    expect(mockNavigate).toHaveBeenCalledWith('/internal_medicine');
  });

  it('should navigate to generic simulation when no context and View Cases is clicked', async () => {
    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('View All Cases')).toBeInTheDocument();
    });

    const viewCasesButton = screen.getByText('View All Cases');
    fireEvent.click(viewCasesButton);

    expect(mockNavigate).toHaveBeenCalledWith('/simulation');
  });
});