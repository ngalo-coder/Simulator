import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SpecialtyNavigation from './SpecialtyNavigation';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';

// Mock the useSpecialtyContext hook
vi.mock('../hooks/useSpecialtyContext');
const mockUseSpecialtyContext = vi.mocked(useSpecialtyContext);

// Wrapper component for React Router
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('SpecialtyNavigation Component', () => {
  const mockSpecialtyRoutes = [
    { specialty: 'Internal Medicine', slug: 'internal_medicine', caseCount: 15, isActive: true },
    { specialty: 'Pediatrics', slug: 'pediatrics', caseCount: 8, isActive: false },
    { specialty: 'Surgery', slug: 'surgery', caseCount: 12, isActive: false },
    { specialty: 'Cardiology', slug: 'cardiology', caseCount: 6, isActive: false },
    { specialty: 'Emergency Medicine', slug: 'emergency_medicine', caseCount: 10, isActive: false },
    { specialty: 'Neurology', slug: 'neurology', caseCount: 4, isActive: false },
    { specialty: 'Psychiatry', slug: 'psychiatry', caseCount: 7, isActive: false },
  ];

  beforeEach(() => {
    mockUseSpecialtyContext.mockReturnValue({
      specialtyRoutes: mockSpecialtyRoutes,
      currentSpecialtySlug: 'internal_medicine',
      loading: false,
      error: null,
      currentSpecialty: 'Internal Medicine',
      availableSpecialties: mockSpecialtyRoutes.map(r => r.specialty),
      navigateToSpecialty: vi.fn(),
      navigateToSpecialtySlug: vi.fn(),
      isValidSpecialty: vi.fn(),
      isValidSpecialtySlug: vi.fn(),
      getSpecialtyFromSlug: vi.fn(),
      getSlugFromSpecialty: vi.fn(),
      refreshSpecialties: vi.fn(),
      clearError: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders specialty navigation links', () => {
    render(
      <RouterWrapper>
        <SpecialtyNavigation />
      </RouterWrapper>
    );

    expect(screen.getByText('Internal Medicine')).toBeInTheDocument();
    expect(screen.getByText('Pediatrics')).toBeInTheDocument();
    expect(screen.getByText('Surgery')).toBeInTheDocument();
  });

  it('shows case counts when enabled', () => {
    render(
      <RouterWrapper>
        <SpecialtyNavigation showCaseCounts={true} />
      </RouterWrapper>
    );

    expect(screen.getByText('15')).toBeInTheDocument(); // Internal Medicine count
    expect(screen.getByText('8')).toBeInTheDocument();  // Pediatrics count
  });

  it('hides case counts when disabled', () => {
    render(
      <RouterWrapper>
        <SpecialtyNavigation showCaseCounts={false} />
      </RouterWrapper>
    );

    expect(screen.queryByText('15')).not.toBeInTheDocument();
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });

  it('highlights active specialty', () => {
    render(
      <RouterWrapper>
        <SpecialtyNavigation />
      </RouterWrapper>
    );

    const activeLink = screen.getByRole('link', { name: /Internal Medicine/ });
    expect(activeLink).toHaveClass('bg-blue-100');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('limits visible specialties and shows "Show More" button', () => {
    render(
      <RouterWrapper>
        <SpecialtyNavigation maxVisible={3} />
      </RouterWrapper>
    );

    // Should show first 3 specialties
    expect(screen.getByText('Internal Medicine')).toBeInTheDocument();
    expect(screen.getByText('Pediatrics')).toBeInTheDocument();
    expect(screen.getByText('Surgery')).toBeInTheDocument();

    // Should not show the 4th specialty initially
    expect(screen.queryByText('Cardiology')).not.toBeInTheDocument();

    // Should show "Show More" button
    expect(screen.getByText('+4 More')).toBeInTheDocument();
  });

  it('expands to show all specialties when "Show More" is clicked', () => {
    render(
      <RouterWrapper>
        <SpecialtyNavigation maxVisible={3} />
      </RouterWrapper>
    );

    const showMoreButton = screen.getByText('+4 More');
    fireEvent.click(showMoreButton);

    // Should now show all specialties
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('Emergency Medicine')).toBeInTheDocument();
    expect(screen.getByText('Neurology')).toBeInTheDocument();
    expect(screen.getByText('Psychiatry')).toBeInTheDocument();

    // Button should change to "Show Less"
    expect(screen.getByText('Show Less')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseSpecialtyContext.mockReturnValue({
      specialtyRoutes: [],
      currentSpecialtySlug: null,
      loading: true,
      error: null,
      currentSpecialty: null,
      availableSpecialties: [],
      navigateToSpecialty: vi.fn(),
      navigateToSpecialtySlug: vi.fn(),
      isValidSpecialty: vi.fn(),
      isValidSpecialtySlug: vi.fn(),
      getSpecialtyFromSlug: vi.fn(),
      getSlugFromSpecialty: vi.fn(),
      refreshSpecialties: vi.fn(),
      clearError: vi.fn(),
    });

    const { container } = render(
      <RouterWrapper>
        <SpecialtyNavigation />
      </RouterWrapper>
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('returns null when there is an error', () => {
    mockUseSpecialtyContext.mockReturnValue({
      specialtyRoutes: [],
      currentSpecialtySlug: null,
      loading: false,
      error: 'Failed to load specialties',
      currentSpecialty: null,
      availableSpecialties: [],
      navigateToSpecialty: vi.fn(),
      navigateToSpecialtySlug: vi.fn(),
      isValidSpecialty: vi.fn(),
      isValidSpecialtySlug: vi.fn(),
      getSpecialtyFromSlug: vi.fn(),
      getSlugFromSpecialty: vi.fn(),
      refreshSpecialties: vi.fn(),
      clearError: vi.fn(),
    });

    const { container } = render(
      <RouterWrapper>
        <SpecialtyNavigation />
      </RouterWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when no specialty routes available', () => {
    mockUseSpecialtyContext.mockReturnValue({
      specialtyRoutes: [],
      currentSpecialtySlug: null,
      loading: false,
      error: null,
      currentSpecialty: null,
      availableSpecialties: [],
      navigateToSpecialty: vi.fn(),
      navigateToSpecialtySlug: vi.fn(),
      isValidSpecialty: vi.fn(),
      isValidSpecialtySlug: vi.fn(),
      getSpecialtyFromSlug: vi.fn(),
      getSlugFromSpecialty: vi.fn(),
      refreshSpecialties: vi.fn(),
      clearError: vi.fn(),
    });

    const { container } = render(
      <RouterWrapper>
        <SpecialtyNavigation />
      </RouterWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('generates correct links for specialty routes', () => {
    render(
      <RouterWrapper>
        <SpecialtyNavigation />
      </RouterWrapper>
    );

    const pediatricsLink = screen.getByRole('link', { name: /Pediatrics/ });
    expect(pediatricsLink).toHaveAttribute('href', '/pediatrics');

    const surgeryLink = screen.getByRole('link', { name: /Surgery/ });
    expect(surgeryLink).toHaveAttribute('href', '/surgery');
  });
});