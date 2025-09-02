import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SimulationChatPage from '../SimulationChatPage'
import * as apiService from '../../services/apiService'
import * as urlUtils from '../../utils/urlUtils'

// Mock the API service
vi.mock('../../services/apiService', () => ({
  api: {
    startSimulation: vi.fn()
  }
}))

// Mock the URL utils
vi.mock('../../utils/urlUtils', () => ({
  createSimulationSessionUrl: vi.fn(),
  createSimulationCaseUrl: vi.fn(),
  parseSimulationUrl: vi.fn(),
  createSpecialtyContext: vi.fn(),
  preserveSpecialtyContext: vi.fn(),
  updateBrowserHistoryForBookmarks: vi.fn(),
  isValidSimulationUrl: vi.fn()
}))

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    isAuthenticated: true
  })
}))

// Mock EventSource
const mockEventSource = {
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  readyState: 1,
  url: '',
  withCredentials: false,
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2
}

global.EventSource = vi.fn(() => mockEventSource) as any

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock console methods to avoid noise in tests
const originalConsole = { ...console }
beforeEach(() => {
  console.log = vi.fn()
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterEach(() => {
  Object.assign(console, originalConsole)
  vi.clearAllMocks()
})

describe('SimulationChatPage - Error Handling Scenarios and State Transitions', () => {
  beforeEach(() => {
    // Setup default mocks
    mockLocalStorage.getItem.mockReturnValue('mock-auth-token')
    
    // Default URL utils mocks
    vi.mocked(urlUtils.parseSimulationUrl).mockReturnValue({
      isValid: true,
      caseId: 'VP-OPTH-001',
      sessionId: null
    })
    
    vi.mocked(urlUtils.isValidSimulationUrl).mockReturnValue(true)
    vi.mocked(urlUtils.createSimulationSessionUrl).mockReturnValue('/simulation/VP-OPTH-001/session/123')
    vi.mocked(urlUtils.createSimulationCaseUrl).mockReturnValue('/simulation/VP-OPTH-001')
    vi.mocked(urlUtils.preserveSpecialtyContext).mockReturnValue({
      specialtyContext: { name: 'Ophthalmology', returnUrl: '/ophthalmology' }
    })
    vi.mocked(urlUtils.createSpecialtyContext).mockReturnValue({
      name: 'General',
      returnUrl: '/simulation'
    })
  })

  describe('Error Handling Scenarios', () => {
    it('should handle invalid case ID errors correctly', async () => {
      // Test Requirements: 3.3 - Invalid case error handling
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockRejectedValue(new Error('Case not found'))

      render(
        <MemoryRouter initialEntries={['/simulation/INVALID-CASE']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('INVALID-CASE')
      })

      // Should show invalid case error
      await waitFor(() => {
        expect(screen.getByText(/This case could not be found/)).toBeInTheDocument()
      })

      // Should not show retry button for invalid case
      expect(screen.queryByText(/Try Again/)).not.toBeInTheDocument()
    })

    it('should handle network errors with retry functionality', async () => {
      // Test Requirements: 3.1 - Network error handling with retry
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockRejectedValueOnce(new Error('Failed to fetch'))
      mockStartSimulation.mockResolvedValueOnce({
        sessionId: 'retry-success-123',
        patientName: 'Retry Success Patient',
        initialPrompt: 'Retry worked!',
        speaks_for: 'Retry Success Patient'
      })

      render(
        <MemoryRouter initialEntries={['/simulation/VP-RETRY-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-RETRY-001')
      })

      // Should show network error
      await waitFor(() => {
        expect(screen.getByText(/Connection failed/)).toBeInTheDocument()
        expect(screen.getByText(/check your internet connection/)).toBeInTheDocument()
      })

      // Should show retry button
      const retryButton = screen.getByText(/Try Again/)
      expect(retryButton).toBeInTheDocument()

      // Click retry button
      fireEvent.click(retryButton)

      // Should retry and succeed
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledTimes(2)
      })

      await waitFor(() => {
        expect(screen.getByText(/Retry Success Patient/)).toBeInTheDocument()
      })
    })

    it('should handle authentication errors correctly', async () => {
      // Test Requirements: 3.2 - Authentication error handling
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockRejectedValue(new Error('401 authentication failed'))

      render(
        <MemoryRouter initialEntries={['/simulation/VP-AUTH-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-AUTH-001')
      })

      // Should show authentication error
      await waitFor(() => {
        expect(screen.getByText(/Your session has expired/)).toBeInTheDocument()
        expect(screen.getByText(/Please log in again/)).toBeInTheDocument()
      })

      // Should not show retry button for auth errors
      expect(screen.queryByText(/Try Again/)).not.toBeInTheDocument()
    })

    it('should handle server errors with retry functionality', async () => {
      // Test Requirements: 3.1 - Server error handling
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockRejectedValue(new Error('500 Internal Server Error'))

      render(
        <MemoryRouter initialEntries={['/simulation/VP-SERVER-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-SERVER-001')
      })

      // Should show server error
      await waitFor(() => {
        expect(screen.getByText(/The server is experiencing issues/)).toBeInTheDocument()
        expect(screen.getByText(/Please try again in a few moments/)).toBeInTheDocument()
      })

      // Should show retry button for server errors
      expect(screen.getByText(/Try Again/)).toBeInTheDocument()
    })

    it('should handle timeout errors correctly', async () => {
      // Test Requirements: 3.1 - Timeout error handling
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'TimeoutError'
      mockStartSimulation.mockRejectedValue(timeoutError)

      render(
        <MemoryRouter initialEntries={['/simulation/VP-TIMEOUT-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-TIMEOUT-001')
      })

      // Should show timeout error
      await waitFor(() => {
        expect(screen.getByText(/The request is taking too long/)).toBeInTheDocument()
        expect(screen.getByText(/Please try again/)).toBeInTheDocument()
      })

      // Should show retry button for timeout errors
      expect(screen.getByText(/Try Again/)).toBeInTheDocument()
    })

    it('should handle unknown errors gracefully', async () => {
      // Test Requirements: 3.4 - Unknown error handling
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockRejectedValue(new Error('Unknown error occurred'))

      render(
        <MemoryRouter initialEntries={['/simulation/VP-UNKNOWN-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-UNKNOWN-001')
      })

      // Should show generic error message
      await waitFor(() => {
        expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
        expect(screen.getByText(/contact support if the problem persists/)).toBeInTheDocument()
      })

      // Should show retry button for unknown errors
      expect(screen.getByText(/Try Again/)).toBeInTheDocument()
    })

    it('should log errors for debugging purposes', async () => {
      // Test Requirements: 3.4 - Error logging
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      const testError = new Error('Test error for logging')
      mockStartSimulation.mockRejectedValue(testError)

      render(
        <MemoryRouter initialEntries={['/simulation/VP-LOG-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-LOG-001')
      })

      // Verify error was logged (console.error should be called)
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('🚨 Simulation Error:'),
          expect.objectContaining({
            type: 'Simulation startup failed',
            caseId: 'VP-LOG-001'
          })
        )
      })
    })

    it('should prevent multiple simultaneous simulation starts', async () => {
      // Test edge case: prevent race conditions
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              sessionId: 'race-test-123',
              patientName: 'Race Test Patient',
              initialPrompt: 'Race test prompt',
              speaks_for: 'Race Test Patient'
            })
          }, 100)
        })
      )

      const { rerender } = render(
        <MemoryRouter initialEntries={['/simulation/VP-RACE-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      // Trigger re-render while first simulation is still starting
      rerender(
        <MemoryRouter initialEntries={['/simulation/VP-RACE-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        // Should only call startSimulation once despite re-render
        expect(mockStartSimulation).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle state transitions correctly during error recovery', async () => {
      // Test Requirements: 2.4 - State transitions during error recovery
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      
      // First call fails, second succeeds
      mockStartSimulation
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          sessionId: 'recovery-123',
          patientName: 'Recovery Patient',
          initialPrompt: 'Recovery successful!',
          speaks_for: 'Recovery Patient'
        })

      render(
        <MemoryRouter initialEntries={['/simulation/VP-RECOVERY-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByText(/Connection failed/)).toBeInTheDocument()
      })

      // Click retry
      const retryButton = screen.getByText(/Try Again/)
      fireEvent.click(retryButton)

      // Should show loading state again
      await waitFor(() => {
        expect(screen.getByText(/Validating case/)).toBeInTheDocument()
      })

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByText(/Recovery Patient/)).toBeInTheDocument()
        expect(screen.getByText(/Recovery successful!/)).toBeInTheDocument()
      })

      // Error message should be cleared
      expect(screen.queryByText(/Connection failed/)).not.toBeInTheDocument()
    })

    it('should handle missing case ID in URL', async () => {
      // Test Requirements: 3.3 - Missing case ID handling
      render(
        <MemoryRouter initialEntries={['/simulation/']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      // Should show error for missing case ID
      await waitFor(() => {
        expect(screen.getByText(/No case ID was provided/)).toBeInTheDocument()
      })
    })

    it('should handle malformed API responses gracefully', async () => {
      // Test Requirements: 3.1 - Malformed response handling
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockResolvedValue({
        // Missing required sessionId
        patientName: 'Malformed Response Patient',
        initialPrompt: 'Test prompt'
      } as any)

      render(
        <MemoryRouter initialEntries={['/simulation/VP-MALFORMED-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-MALFORMED-001')
      })

      // Should handle missing sessionId gracefully
      await waitFor(() => {
        expect(screen.getByText(/No session ID received from server/)).toBeInTheDocument()
      })
    })
  })

  describe('URL Access Pattern Detection', () => {
    it('should correctly identify case-only URL pattern', async () => {
      // Test URL pattern detection logic
      vi.mocked(urlUtils.parseSimulationUrl).mockReturnValue({
        isValid: true,
        caseId: 'VP-PATTERN-001',
        sessionId: null
      })

      render(
        <MemoryRouter initialEntries={['/simulation/VP-PATTERN-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      // Should detect case-only pattern and start simulation
      await waitFor(() => {
        expect(apiService.api.startSimulation).toHaveBeenCalledWith('VP-PATTERN-001')
      })
    })

    it('should correctly identify case-with-session URL pattern', async () => {
      // Test URL pattern detection logic
      vi.mocked(urlUtils.parseSimulationUrl).mockReturnValue({
        isValid: true,
        caseId: 'VP-PATTERN-002',
        sessionId: 'existing-session-123'
      })

      render(
        <MemoryRouter initialEntries={['/simulation/VP-PATTERN-002/session/existing-session-123']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      // Should not start new simulation for existing session
      await waitFor(() => {
        expect(apiService.api.startSimulation).not.toHaveBeenCalled()
      })
    })

    it('should handle URL parameter mismatches', async () => {
      // Test edge case where URL parsing and route params don't match
      vi.mocked(urlUtils.parseSimulationUrl).mockReturnValue({
        isValid: true,
        caseId: 'VP-DIFFERENT-001',
        sessionId: null
      })

      render(
        <MemoryRouter initialEntries={['/simulation/VP-MISMATCH-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      // Should log warning about mismatch
      await waitFor(() => {
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('URL parameter mismatch detected'),
          expect.any(Object)
        )
      })
    })
  })
})