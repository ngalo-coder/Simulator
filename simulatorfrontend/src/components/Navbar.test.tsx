import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import Navbar from './Navbar';
import { useAuth } from '../hooks/useAuth';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the hooks
vi.mock('../hooks/useAuth');
vi.mock('../hooks/useSpecialtyContext');

// Mock react-router-dom to preserve all exports and only mock specific functions
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
  };
});

const mockUseAuth = vi.mocked(useAuth);
const mockUseSpecialtyContext = vi.mocked(useSpecialtyContext);

// Wrapper component for React Router and ThemeProvider
const RouterWrapper: React.FC<{
  children: React.ReactNode;
  initialEntries?: string[];
}> = ({ children, initialEntries = ['/'] }) => (
  <ThemeProvider>
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="*" element={children} />
      </Routes>
    </MemoryRouter>
  </ThemeProvider>
);

describe('Navbar Component', () => {
  const mockLogout = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock matchMedia for theme detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Set default mock implementations for react-router-dom hooks
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default'
    });

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
      loading: false,
    });

    mockUseSpecialtyContext.mockReturnValue({
      currentSpecialty: null,
      currentSpecialtySlug: null,
      availableSpecialties: [],
      specialtyRoutes: [],
      loading: false,
      error: null,
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

  it('renders logo and brand name', () => {
    render(
      <RouterWrapper>
        <Navbar />
      </RouterWrapper>
    );

    expect(screen.getByText('🏥')).toBeInTheDocument();
    expect(screen.getByText('Simuatech')).toBeInTheDocument();
  });

  it('shows sign in and sign up links when user is not logged in', () => {
    render(
      <RouterWrapper>
        <Navbar />
      </RouterWrapper>
    );

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('shows user navigation links when user is logged in', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' },
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
      loading: false,
    });

    render(
      <RouterWrapper>
        <Navbar />
      </RouterWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Browse Cases')).toBeInTheDocument();
    expect(screen.getByText('All Cases')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('shows admin link when user has admin role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'adminuser', email: 'admin@example.com', role: 'admin' },
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
      loading: false,
    });

    render(
      <RouterWrapper>
        <Navbar />
      </RouterWrapper>
    );

    // Use getAllByText since there are multiple Admin elements (link and badge)
    const adminElements = screen.getAllByText('Admin');
    expect(adminElements).toHaveLength(2);
    expect(adminElements[0]).toBeInTheDocument();
  });

  it('displays current specialty when available', () => {
    mockUseSpecialtyContext.mockReturnValue({
      currentSpecialty: 'Internal Medicine',
      currentSpecialtySlug: 'internal-medicine',
      availableSpecialties: ['Internal Medicine'],
      specialtyRoutes: [{
        specialty: 'Internal Medicine',
        slug: 'internal-medicine',
        caseCount: 5,
        isActive: true
      }],
      loading: false,
      error: null,
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
        <Navbar />
      </RouterWrapper>
    );

    expect(screen.getByText('Current:')).toBeInTheDocument();
    expect(screen.getByText('Internal Medicine')).toBeInTheDocument();
  });

  it('applies active styling to current path', () => {
    // Mock useLocation to return a specific path for this test
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/dashboard',
      search: '',
      hash: '',
      state: null,
      key: 'default'
    });

    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' },
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
      loading: false,
    });

    render(
      <RouterWrapper initialEntries={['/dashboard']}>
        <Navbar />
      </RouterWrapper>
    );

    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink).toHaveClass('bg-blue-600');
    expect(dashboardLink).toHaveClass('text-white');
  });

  it('toggles mobile menu when hamburger button is clicked', () => {
    render(
      <RouterWrapper>
        <Navbar />
      </RouterWrapper>
    );

    // Mobile menu should be closed initially
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: 'Open main menu' });
    fireEvent.click(menuButton);

    // Mobile menu should now be open
    // Use getAllByText for Sign In and Sign Up since they appear in both desktop and mobile menus
    const signInElements = screen.getAllByText('Sign In');
    const signUpElements = screen.getAllByText('Sign Up');
    expect(signInElements).toHaveLength(2);
    expect(signUpElements).toHaveLength(2);
    expect(signInElements[0]).toBeInTheDocument();
    expect(signUpElements[0]).toBeInTheDocument();
  });

  it('closes mobile menu when a link is clicked', async () => {
    render(
      <RouterWrapper>
        <Navbar />
      </RouterWrapper>
    );

    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: 'Open main menu' });
    fireEvent.click(menuButton);

    // Click a link - use the mobile menu version specifically
    const mobileSignInLinks = screen.getAllByText('Sign In');
    // The mobile menu link is likely the second one (index 1) or we can filter by class
    const mobileSignInLink = mobileSignInLinks.find(link =>
      link.className.includes('block text-center')
    ) || mobileSignInLinks[1];
    fireEvent.click(mobileSignInLink);

    // Mobile menu should be closed
    await waitFor(() => {
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });
  });

  it('handles logout correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' },
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
      loading: false,
    });

    render(
      <RouterWrapper>
        <Navbar />
      </RouterWrapper>
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('displays user information when logged in', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'johndoe', email: 'john@example.com', role: 'user' },
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
      loading: false,
    });

    render(
      <RouterWrapper>
        <Navbar />
      </RouterWrapper>
    );

    expect(screen.getByText('Welcome, johndoe')).toBeInTheDocument();
  });

  it('shows admin badge for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'adminuser', email: 'admin@example.com', role: 'admin' },
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
      loading: false,
    });

    render(
      <RouterWrapper>
        <Navbar />
      </RouterWrapper>
    );

    // Use getAllByText for Admin since there are multiple elements
    const adminElements = screen.getAllByText('Admin');
    expect(adminElements).toHaveLength(2);
    expect(adminElements[0]).toBeInTheDocument();
    expect(screen.getByText('Welcome, adminuser')).toBeInTheDocument();
  });

  it('applies proper responsive classes for desktop and mobile', () => {
    render(
      <RouterWrapper>
        <Navbar />
      </RouterWrapper>
    );

    // Desktop navigation container should have hidden class
    const desktopNavContainer = screen.getByTestId('desktop-nav');
    expect(desktopNavContainer).toHaveClass('hidden');
    expect(desktopNavContainer).toHaveClass('md:flex');

    // Mobile menu button should be visible
    const mobileMenuButton = screen.getByRole('button', { name: 'Open main menu' });
    expect(mobileMenuButton).toBeInTheDocument();
  });
});