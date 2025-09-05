import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SpecialtyCasePage from './SpecialtyCasePage';
import { apiService } from '../services/apiService';;

// Mock the API service
vi.mock('../services/apiService', () => ({
  api: {
    getCases: vi.fn(),
    startSimulation: vi.fn(),
    setSpecialtyContext: vi.fn(),
  }
}));

// Mock the hooks
vi.mock('../hooks/useSpecialtyContext', () => ({
  useSpecialtyContext: () => ({
    currentSpecialty: 'Internal Medicine',
    availableSpecialties: ['Internal Medicine', 'Pediatrics', 'Cardiology'],
  })
}));

vi.mock('../components/NotificationToast', () => ({
  useNotification: () => ({
    addNotification: vi.fn(),
  })
}));

vi.mock('../hooks/useSpecialtyErrorHandler', () => ({
  useSpecialtyErrorHandler: () => ({})
}));

vi.mock('../utils/urlUtils', () => ({
  slugToSpecialty: (slug: string) => slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  isValidSpecialtySlug: (slug: string) => /^[a-z_]+$/.test(slug),
}));

vi.mock('../utils/errorHandling', () => ({
  createRetryFunction: vi.fn(),
  getSpecialtyErrorMessage: vi.fn(() => 'Error message'),
}));

vi.mock('../components/SpecialtyHeader', () => ({
  default: ({ specialtyName }: { specialtyName: string }) => (
    <div data-testid="specialty-header">{specialtyName}</div>
  )
}));

// Mock react-router-dom params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ specialty: 'internal_medicine' }),
    useNavigate: () => vi.fn(),
  };
});

const mockCasesResponse = {
  cases: [
    {
      id: '1',
      title: 'Test Case 1',
      description: 'Test description 1',
      specialty: 'Internal Medicine',
      patient_age: 45,
      patient_gender: 'Male',
      chief_complaint: 'Chest pain'
    },
    {
      id: '2',
      title: 'Test Case 2',
      description: 'Test description 2',
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

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <SpecialtyCasePage />
    </BrowserRouter>
  );
};

describe('SpecialtyCasePage Enhanced Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiService.getCases as any).mockResolvedValue(mockCasesResponse);
  });

  it('should render search input and filter controls', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search within Internal Medicine cases/)).toBeInTheDocument();
    });

    // Check for "More Filters" button
    expect(screen.getByText('More Filters')).toBeInTheDocument();
  });

  it('should show advanced filters when "More Filters" is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('More Filters')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('More Filters'));

    expect(screen.getByText('Patient Gender')).toBeInTheDocument();
    expect(screen.getByText('Min Age')).toBeInTheDocument();
    expect(screen.getByText('Max Age')).toBeInTheDocument();
  });

  it('should call API with correct filters when search term is entered', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search within Internal Medicine cases/)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search within Internal Medicine cases/);
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

  it('should display case count and pagination info', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/2 cases available in Internal Medicine/)).toBeInTheDocument();
    });
  });

  it('should show active filters summary when filters are applied', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('More Filters')).toBeInTheDocument();
    });

    // Open advanced filters
    fireEvent.click(screen.getByText('More Filters'));

    // Set a search term
    const searchInput = screen.getByPlaceholderText(/Search within Internal Medicine cases/);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('Search: "test"')).toBeInTheDocument();
    });
  });

  it('should clear all filters when "Clear All" is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('More Filters')).toBeInTheDocument();
    });

    // Set a search term to activate filters
    const searchInput = screen.getByPlaceholderText(/Search within Internal Medicine cases/);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Clear All'));

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('should handle pagination controls', async () => {
    const paginatedResponse = {
      ...mockCasesResponse,
      currentPage: 1,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: false
    };

    (apiService.getCases as any).mockResolvedValue(paginatedResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    // Should show pagination controls
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
  });

  it('should preserve specialty context when starting simulation', async () => {
    (apiService.startSimulation as any).mockResolvedValue({ sessionId: 'test-session' });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Case 1')).toBeInTheDocument();
    });

    const startButton = screen.getAllByText('Start Simulation')[0];
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(apiService.setSpecialtyContext).toHaveBeenCalledWith('', 'Internal Medicine');
    });
  });
});