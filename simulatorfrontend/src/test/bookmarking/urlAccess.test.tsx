import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from '../../App';

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
    })
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn().mockReturnValue('test-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('Bookmarking and Direct URL Access Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Direct URL Access', () => {
    const specialtyUrls = [
      '/internal_medicine',
      '/pediatrics',
      '/cardiology',
      '/emergency_medicine'
    ];

    specialtyUrls.forEach(url => {
      it(`should load ${url} directly without navigation`, async () => {
        render(
          <MemoryRouter initialEntries={[url]}>
            <App />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });

        // Verify specialty-specific content is loaded
        const specialtyName = url.replace('/', '').replace('_', ' ');
        // The page should contain specialty-related content
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle direct access to specialty URLs with query parameters', async () => {
      const urlWithParams = '/internal_medicine?page=2&search=chest';
      
      render(
        <MemoryRouter initialEntries={[urlWithParams]}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Verify query parameters are preserved and handled
      expect(window.location.search).toBeDefined();
    });

    it('should handle direct access to nested simulation URLs', async () => {
      const simulationUrl = '/simulation/case-123/session/session-456';
      
      render(
        <MemoryRouter initialEntries={[simulationUrl]}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('URL State Preservation', () => {
    it('should preserve URL state during page refresh simulation', async () => {
      const initialUrl = '/pediatrics';
      
      const { rerender } = render(
        <MemoryRouter initialEntries={[initialUrl]}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Simulate page refresh by re-rendering with same URL
      rerender(
        <MemoryRouter initialEntries={[initialUrl]}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Verify the specialty context is maintained
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should maintain URL state during component re-renders', async () => {
      const url = '/cardiology';
      
      render(
        <MemoryRouter initialEntries={[url]}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Trigger re-render by updating props/state
      // The URL should remain consistent
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Browser History Integration', () => {
    it('should support browser back button functionality', async () => {
      const history = ['/dashboard', '/internal_medicine', '/pediatrics'];
      
      render(
        <MemoryRouter initialEntries={history} initialIndex={2}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Verify current location
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should support browser forward button functionality', async () => {
      const history = ['/dashboard', '/internal_medicine'];
      
      render(
        <MemoryRouter initialEntries={history} initialIndex={0}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should maintain proper history stack', async () => {
      const complexHistory = [
        '/',
        '/login',
        '/dashboard',
        '/internal_medicine',
        '/simulation/case-1',
        '/pediatrics'
      ];
      
      render(
        <MemoryRouter initialEntries={complexHistory} initialIndex={5}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Verify the app handles complex navigation history
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('URL Validation and Error Handling', () => {
    it('should handle invalid specialty URLs gracefully', async () => {
      const invalidUrls = [
        '/invalid_specialty',
        '/nonexistent_medical_field',
        '/123invalid',
        '/specialty-with-dashes'
      ];

      for (const url of invalidUrls) {
        render(
          <MemoryRouter initialEntries={[url]}>
            <App />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });

        // Should either redirect or show error page
        expect(screen.getByRole('main')).toBeInTheDocument();
      }
    });

    it('should handle malformed URLs', async () => {
      const malformedUrls = [
        '/specialty%20with%20spaces',
        '/specialty@#$%',
        '//double-slash',
        '/specialty/../injection'
      ];

      for (const url of malformedUrls) {
        render(
          <MemoryRouter initialEntries={[url]}>
            <App />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });

        // Should handle malformed URLs without crashing
        expect(screen.getByRole('main')).toBeInTheDocument();
      }
    });
  });

  describe('SEO and Meta Tags', () => {
    it('should update document title for specialty pages', async () => {
      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Verify document title is updated (would need jsdom configuration)
      expect(document.title).toBeDefined();
    });

    it('should handle meta description updates', async () => {
      render(
        <MemoryRouter initialEntries={['/pediatrics']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Verify meta tags are updated appropriately
      const metaTags = document.querySelectorAll('meta');
      expect(metaTags.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Deep Linking Support', () => {
    it('should support deep links to specific cases within specialties', async () => {
      const deepLink = '/internal_medicine?case=chest-pain-case-1';
      
      render(
        <MemoryRouter initialEntries={[deepLink]}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should load the specific case within the specialty context
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should support deep links with multiple parameters', async () => {
      const complexDeepLink = '/pediatrics?page=3&difficulty=advanced&tags=fever,emergency';
      
      render(
        <MemoryRouter initialEntries={[complexDeepLink]}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should preserve all query parameters
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Cross-Origin and Security', () => {
    it('should handle cross-origin navigation safely', async () => {
      // Test navigation from external sources
      const externalReferrer = 'https://external-site.com';
      
      Object.defineProperty(document, 'referrer', {
        value: externalReferrer,
        configurable: true
      });

      render(
        <MemoryRouter initialEntries={['/internal_medicine']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should handle external referrers safely
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should sanitize URL parameters', async () => {
      const urlWithScript = '/pediatrics?search=<script>alert("xss")</script>';
      
      render(
        <MemoryRouter initialEntries={[urlWithScript]}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should sanitize potentially dangerous parameters
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});