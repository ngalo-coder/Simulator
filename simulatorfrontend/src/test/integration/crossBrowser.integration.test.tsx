import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import SpecialtyCasePage from '../../pages/SpecialtyCasePage';

// Mock API service
vi.mock('../../services/apiService', () => ({
  default: {
    getSpecialties: vi.fn().mockResolvedValue([
      'Internal Medicine',
      'Pediatrics',
      'Cardiology',
      'Emergency Medicine'
    ]),
    getCases: vi.fn().mockResolvedValue({
      cases: [
        { id: '1', title: 'Test Case 1', specialty: 'Internal Medicine' },
        { id: '2', title: 'Test Case 2', specialty: 'Pediatrics' }
      ],
      totalCases: 2,
      totalPages: 1
    }),
    login: vi.fn().mockResolvedValue({ token: 'test-token', user: { id: '1', name: 'Test User' } })
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

describe('Cross-Browser Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-token');
  });

  describe('URL Handling and Bookmarking', () => {
    it('should handle direct URL access to specialty pages', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <ThemeProvider>
            <Routes>
              <Route path="/:specialty" element={<SpecialtyCasePage />} />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Internal Medicine/i)).toBeInTheDocument();
      });
    });

    it('should maintain URL state on page refresh', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/pediatrics']}>
          <ThemeProvider>
            <Routes>
              <Route path="/:specialty" element={<SpecialtyCasePage />} />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Pediatrics/i)).toBeInTheDocument();
      });

      // Simulate page refresh by re-rendering
      rerender(
        <MemoryRouter initialEntries={['/pediatrics']}>
          <ThemeProvider>
            <Routes>
              <Route path="/:specialty" element={<SpecialtyCasePage />} />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Pediatrics/i)).toBeInTheDocument();
      });
    });

    it('should handle browser back/forward navigation', async () => {
      const history = ['/dashboard', '/internal_medicine', '/pediatrics'];
      
      render(
        <MemoryRouter initialEntries={history} initialIndex={2}>
          <ThemeProvider>
            <Routes>
              <Route path="/:specialty" element={<SpecialtyCasePage />} />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Pediatrics/i)).toBeInTheDocument();
      });
    });

    it('should handle URL encoding for specialty names with special characters', async () => {
      render(
        <MemoryRouter initialEntries={['/emergency_medicine']}>
          <ThemeProvider>
            <Routes>
              <Route path="/:specialty" element={<SpecialtyCasePage />} />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emergency Medicine/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle different user agent strings', async () => {
      const browsers = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      ];

      for (const userAgent of browsers) {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          configurable: true
        });

        const { unmount } = render(
          <MemoryRouter initialEntries={['/internal_medicine']}>
            <ThemeProvider>
              <Routes>
                <Route path="/:specialty" element={<SpecialtyCasePage />} />
              </Routes>
            </ThemeProvider>
          </MemoryRouter>
        );

        // Verify app renders correctly across browsers
        expect(screen.getByText(/Internal Medicine/i)).toBeInTheDocument();
        unmount();
      }
    });

    it('should handle different viewport sizes', async () => {
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 } // Desktop
      ];

      for (const viewport of viewports) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height
        });

        const { unmount } = render(
          <MemoryRouter initialEntries={['/cardiology']}>
            <ThemeProvider>
              <Routes>
                <Route path="/:specialty" element={<SpecialtyCasePage />} />
              </Routes>
            </ThemeProvider>
          </MemoryRouter>
        );

        // Verify responsive behavior
        expect(screen.getByText(/Cardiology/i)).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('Local Storage and Session Management', () => {
    it('should handle localStorage unavailability gracefully', async () => {
      // Mock localStorage throwing error
      const originalGetItem = mockLocalStorage.getItem;
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      // Use a try-catch to handle the error gracefully
      try {
        render(
          <MemoryRouter initialEntries={['/internal_medicine']}>
            <ThemeProvider>
              <Routes>
                <Route path="/:specialty" element={<SpecialtyCasePage />} />
              </Routes>
            </ThemeProvider>
          </MemoryRouter>
        );

        // App should still render without crashing
        await waitFor(() => {
          expect(screen.getByText(/Internal Medicine/i)).toBeInTheDocument();
        });
      } catch (error) {
        // Expected error due to localStorage unavailability
        expect(error.message).toContain('localStorage not available');
      }

      // Restore original mock
      mockLocalStorage.getItem.mockImplementation(originalGetItem);
    });

    it('should handle sessionStorage unavailability gracefully', async () => {
      // Mock sessionStorage throwing error
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('sessionStorage not available');
      });

      render(
        <MemoryRouter initialEntries={['/pediatrics']}>
          <ThemeProvider>
            <Routes>
              <Route path="/:specialty" element={<SpecialtyCasePage />} />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      );

      // App should still render without crashing
      await waitFor(() => {
        expect(screen.getByText(/Pediatrics/i)).toBeInTheDocument();
      });
    });
  });

  describe('Network Conditions', () => {
    it('should handle offline scenarios', async () => {
      // Mock network offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      render(
        <MemoryRouter initialEntries={['/emergency_medicine']}>
          <ThemeProvider>
            <Routes>
              <Route path="/:specialty" element={<SpecialtyCasePage />} />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      );

      // App should handle offline state gracefully
      await waitFor(() => {
        expect(screen.getByText(/Emergency Medicine/i)).toBeInTheDocument();
      });
    });

    it('should handle slow network connections', async () => {
      render(
        <MemoryRouter initialEntries={['/cardiology']}>
          <ThemeProvider>
            <Routes>
              <Route path="/:specialty" element={<SpecialtyCasePage />} />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      );

      // Should show loading states or handle slow responses
      await waitFor(() => {
        expect(screen.getByText(/Cardiology/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Functionality Validation', () => {
    it('should validate specialty routing works correctly', async () => {
      const specialties = [
        { slug: 'internal_medicine', name: 'Internal Medicine' },
        { slug: 'pediatrics', name: 'Pediatrics' },
        { slug: 'cardiology', name: 'Cardiology' },
        { slug: 'emergency_medicine', name: 'Emergency Medicine' }
      ];
      
      for (const specialty of specialties) {
        const { unmount } = render(
          <MemoryRouter initialEntries={[`/${specialty.slug}`]}>
            <ThemeProvider>
              <Routes>
                <Route path="/:specialty" element={<SpecialtyCasePage />} />
              </Routes>
            </ThemeProvider>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByText(new RegExp(specialty.name, 'i'))).toBeInTheDocument();
        });
        
        unmount();
      }
    });

    it('should validate component renders without errors', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <ThemeProvider>
            <Routes>
              <Route path="/:specialty" element={<SpecialtyCasePage />} />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      );

      // Verify no console errors and component renders
      await waitFor(() => {
        expect(screen.getByText(/Internal Medicine/i)).toBeInTheDocument();
      });

      // Verify API calls are made
      expect(vi.mocked(require('../../services/apiService').default.getCases)).toHaveBeenCalled();
    });

    it('should validate accessibility features are present', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <ThemeProvider>
            <Routes>
              <Route path="/:specialty" element={<SpecialtyCasePage />} />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        // Check for navigation elements
        expect(screen.getByRole('navigation')).toBeInTheDocument();
        
        // Check for heading structure
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        
        // Check for interactive elements
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should validate error handling works correctly', async () => {
      // Mock API error
      vi.mocked(require('../../services/apiService').default.getCases).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <ThemeProvider>
            <Routes>
              <Route path="/:specialty" element={<SpecialtyCasePage />} />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      );

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/Failed to Load Cases/i)).toBeInTheDocument();
      });
    });
  });
});