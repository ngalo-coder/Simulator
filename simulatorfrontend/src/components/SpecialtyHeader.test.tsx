import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SpecialtyHeader from './SpecialtyHeader';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';

// Mock the useSpecialtyContext hook
vi.mock('../hooks/useSpecialtyContext');
const mockUseSpecialtyContext = vi.mocked(useSpecialtyContext);

// Wrapper component for React Router
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('SpecialtyHeader Component', () => {
  const mockSpecialtyRoutes = [
    { specialty: 'Internal Medicine', slug: 'internal_medicine', caseCount: 15, isActive: true },
    { specialty: 'Pediatrics', slug: 'pediatrics', caseCount: 8, isActive: false },
    { specialty: 'Surgery', slug: 'surgery', caseCount: 12, isActive: false },
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

  it('renders specialty header with name and title', () => {
    render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
        />
      </RouterWrapper>
    );

    expect(screen.getByText('Internal Medicine Cases')).toBeInTheDocument();
    expect(screen.getByText('Specialty')).toBeInTheDocument();
    expect(screen.getByText('Explore and practice cases specifically in Internal Medicine')).toBeInTheDocument();
  });

  it('displays case count when provided', () => {
    render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
          caseCount={25}
        />
      </RouterWrapper>
    );

    expect(screen.getByText('25 cases')).toBeInTheDocument();
  });

  it('displays case count from specialty routes when not provided', () => {
    render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
        />
      </RouterWrapper>
    );

    expect(screen.getByText('15 cases')).toBeInTheDocument();
  });

  it('handles singular case count correctly', () => {
    render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
          caseCount={1}
        />
      </RouterWrapper>
    );

    expect(screen.getByText('1 case')).toBeInTheDocument();
  });

  it('renders breadcrumbs when enabled', () => {
    render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
          showBreadcrumbs={true}
        />
      </RouterWrapper>
    );

    // Check for breadcrumb navigation
    const breadcrumbNav = screen.getByRole('navigation', { name: 'Breadcrumb navigation' });
    expect(breadcrumbNav).toBeInTheDocument();
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Browse Cases')).toBeInTheDocument();
    
    // Check for the breadcrumb item specifically (with aria-current="page")
    const breadcrumbItem = screen.getByText('Internal Medicine', { selector: '[aria-current="page"]' });
    expect(breadcrumbItem).toBeInTheDocument();
  });

  it('hides breadcrumbs when disabled', () => {
    render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
          showBreadcrumbs={false}
        />
      </RouterWrapper>
    );

    // Should not render breadcrumb navigation
    const breadcrumbNav = screen.queryByRole('navigation', { name: 'Breadcrumb navigation' });
    expect(breadcrumbNav).not.toBeInTheDocument();
  });

  it('renders navigation when enabled and multiple specialties exist', () => {
    render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
          showNavigation={true}
        />
      </RouterWrapper>
    );

    expect(screen.getByText('Switch Specialty:')).toBeInTheDocument();
    expect(screen.getByText('Pediatrics')).toBeInTheDocument();
    expect(screen.getByText('Surgery')).toBeInTheDocument();
  });

  it('hides navigation when disabled', () => {
    render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
          showNavigation={false}
        />
      </RouterWrapper>
    );

    expect(screen.queryByText('Switch Specialty:')).not.toBeInTheDocument();
  });

  it('hides navigation when only one specialty exists', () => {
    mockUseSpecialtyContext.mockReturnValue({
      specialtyRoutes: [mockSpecialtyRoutes[0]], // Only one specialty
      currentSpecialtySlug: 'internal_medicine',
      loading: false,
      error: null,
      currentSpecialty: 'Internal Medicine',
      availableSpecialties: ['Internal Medicine'],
      navigateToSpecialty: vi.fn(),
      navigateToSpecialtySlug: vi.fn(),
      isValidSpecialty: vi.fn(),
      isValidSpecialtySlug: vi.fn(),
      getSpecialtyFromSlug: vi.fn(),
      getSlugFromSpecialty: vi.fn(),
      refreshSpecialties: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
          showNavigation={true}
        />
      </RouterWrapper>
    );

    expect(screen.queryByText('Switch Specialty:')).not.toBeInTheDocument();
  });

  it('renders quick action links', () => {
    render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
        />
      </RouterWrapper>
    );

    const browseSpecialtiesLink = screen.getByRole('link', { name: /Browse Specialties/ });
    const allCasesLink = screen.getByRole('link', { name: 'All Cases' });

    expect(browseSpecialtiesLink).toHaveAttribute('href', '/browse-cases');
    expect(allCasesLink).toHaveAttribute('href', '/simulation');
  });

  it('applies custom className', () => {
    const { container } = render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
          className="custom-class"
        />
      </RouterWrapper>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles zero case count correctly', () => {
    render(
      <RouterWrapper>
        <SpecialtyHeader 
          specialtyName="Internal Medicine"
          specialtySlug="internal_medicine"
          caseCount={0}
        />
      </RouterWrapper>
    );

    // Should not display case count when it's 0
    expect(screen.queryByText('0 cases')).not.toBeInTheDocument();
  });
});