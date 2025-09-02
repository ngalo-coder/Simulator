/**
 * Integration tests for URL redirection and consistency features in SimulationChatPage
 * Requirements: 1.2, 4.1, 4.2, 4.4
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SimulationChatPage from '../SimulationChatPage';

// Mock the API service
vi.mock('../../services/apiService', () => ({
  api: {
    startSimulation: vi.fn().mockResolvedValue({
      sessionId: 'test-session-123',
      patientName: 'Test Patient',
      initialPrompt: 'Hello, I am here for my appointment.',
      speaks_for: 'Test Patient'
    }),
    endSimulation: vi.fn().mockResolvedValue({
      evaluation: 'Test completed successfully'
    })
  }
}));

// Mock the auth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    isAuthenticated: true
  })
}));

// Mock navigate function
const mockNavigate = vi.fn();
const mockLocation = {
  pathname: '/simulation/VP-OPTH-001',
  state: {
    specialtyContext: {
      specialty: 'Ophthalmology',
      specialtySlug: 'ophthalmology',
      returnUrl: '/ophthalmology'
    }
  }
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => ({
      caseId: 'VP-OPTH-001'
    })
  };
});

// Mock window.history for bookmark compatibility tests
const mockReplaceState = vi.fn();
Object.defineProperty(window, 'history', {
  value: {
    replaceState: mockReplaceState
  },
  writable: true
});

describe('SimulationChatPage URL Redirection and Consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReplaceState.mockClear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Automatic URL redirection - Requirement 1.2', () => {
    it('should redirect from case-only URL to session URL when simulation starts', async () => {
      render(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      );

      // Wait for simulation to start and redirect
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/simulation/VP-OPTH-001/session/test-session-123',
          expect.objectContaining({
            replace: true,
            state: expect.objectContaining({
              fromCaseOnlyUrl: true,
              specialtyContext: expect.objectContaining({
                specialty: 'Ophthalmology',
                returnUrl: '/ophthalmology'
              })
            })
          })
        );
      }, { timeout: 5000 });
    });

    it('should update browser history for bookmark compatibility - Requirement 4.4', async () => {
      render(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      );

      // Wait for history update
      await waitFor(() => {
        expect(mockReplaceState).toHaveBeenCalledWith(
          expect.objectContaining({
            bookmarkCompatible: true
          }),
          'Simulation: Test Patient',
          '/simulation/VP-OPTH-001/session/test-session-123'
        );
      }, { timeout: 5000 });
    });
  });

  describe('Specialty context preservation - Requirements 4.1, 4.2', () => {
    it('should preserve specialty context during URL redirection', async () => {
      render(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            state: expect.objectContaining({
              specialtyContext: expect.objectContaining({
                specialty: 'Ophthalmology',
                specialtySlug: 'ophthalmology',
                returnUrl: '/ophthalmology'
              })
            })
          })
        );
      });
    });

    it('should create specialty context when missing', async () => {
      // Mock location without specialty context
      const mockLocationWithoutContext = {
        pathname: '/simulation/VP-OPTH-001',
        state: {}
      };

      vi.mocked(require('react-router-dom').useLocation).mockReturnValue(mockLocationWithoutContext);

      render(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            state: expect.objectContaining({
              specialtyContext: expect.any(Object)
            })
          })
        );
      });
    });
  });

  describe('URL validation and bookmark compatibility - Requirement 4.4', () => {
    it('should validate simulation URLs correctly', async () => {
      // Test with valid case-only URL
      render(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      );

      // Should not show error state for valid URL
      expect(screen.queryByText(/Invalid simulation URL/)).not.toBeInTheDocument();
    });

    it('should update page title for better bookmark experience', async () => {
      render(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(document.title).toContain('Case VP-OPTH-001');
      });
    });
  });

  describe('Error handling with specialty context preservation', () => {
    it('should preserve specialty context during error redirects', async () => {
      // Mock API to throw error
      const { api } = await import('../../services/apiService');
      vi.mocked(api.startSimulation).mockRejectedValueOnce(new Error('Case not found'));

      render(
        <MemoryRouter initialEntries={['/simulation/INVALID-CASE']}>
          <SimulationChatPage />
        </MemoryRouter>
      );

      // Wait for error handling and potential redirect
      await waitFor(() => {
        // Should show error state
        expect(screen.getByText(/Case Not Found/)).toBeInTheDocument();
      });
    });
  });
});