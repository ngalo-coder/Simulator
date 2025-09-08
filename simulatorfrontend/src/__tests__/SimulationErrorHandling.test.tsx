import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SimulationChatPage from '../pages/SimulationChatPage'

// Mock the API service
vi.mock('../services/apiService', () => ({
  api: {
    startSimulation: vi.fn(),
    isAuthenticated: vi.fn(() => true),
  }
}))

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    isAuthenticated: true
  })
}))

// Mock URL utilities
vi.mock('../utils/urlUtils', () => ({
  createSimulationSessionUrl: vi.fn((caseId, sessionId) => `/simulation/${caseId}/session/${sessionId}`),
  createSimulationCaseUrl: vi.fn((caseId) => `/simulation/${caseId}`),
  parseSimulationUrl: vi.fn((url) => ({ isValid: true, caseId: 'test-case', sessionId: null })),
  createSpecialtyContext: vi.fn(() => ({ returnUrl: '/simulation' })),
  preserveSpecialtyContext: vi.fn((state) => state || {}),
  updateBrowserHistoryForBookmarks: vi.fn(),
  isValidSimulationUrl: vi.fn(() => true)
}))

// Mock useParams and useNavigate
const mockNavigate = vi.fn()
const mockLocation = { state: {}, pathname: '/simulation/test-case' }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  }
})

// Helper function to render component with router
const renderWithRouter = (initialEntries: string[] = ['/simulation/test-case']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <SimulationChatPage />
    </MemoryRouter>
  )
}

describe('Simulation Error Handling and State Transitions - Requirements 3.1, 3.2, 3.3, 3.4', () => {
  let mockStartSimulation: any

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Get the mock function reference
    const { api } = await import('../services/apiService')
    mockStartSimulation = api.startSimulation
    
    // Reset console.error mock to track error logging
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Invalid Case ID Error Handling - Requirement 3.3', () => {
    it('should handle 404 case not found error correctly', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'invalid-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('404 - Case not found'))

      renderWithRouter(['/simulation/invalid-case'])

      await waitFor(() => {
        expect(screen.getByText(/case.*not.*found/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/could not be found/i)).toBeInTheDocument()
      
      // Should show redirect action
      const redirectButton = screen.getByText(/back to cases|browse cases/i)
      expect(redirectButton).toBeInTheDocument()
    })

    it('should handle "Case not found" error message', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'missing-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('Case not found'))

      renderWithRouter(['/simulation/missing-case'])

      await waitFor(() => {
        expect(screen.getByText(/case.*not.*found/i)).toBeInTheDocument()
      })

      // Should log error for debugging - Requirement 3.4
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Simulation Error'),
        expect.objectContaining({
          type: 'Simulation startup failed',
          caseId: 'missing-case'
        })
      )
    })

    it('should handle "Invalid case" error message', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'invalid-format' })
      
      mockStartSimulation.mockRejectedValue(new Error('Invalid case ID format'))

      renderWithRouter(['/simulation/invalid-format'])

      await waitFor(() => {
        expect(screen.getByText(/case.*not.*found/i)).toBeInTheDocument()
      })
    })

    it('should redirect to case browsing after invalid case error', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'invalid-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('404 - Case not found'))

      renderWithRouter(['/simulation/invalid-case'])

      await waitFor(() => {
        expect(screen.getByText(/case.*not.*found/i)).toBeInTheDocument()
      })

      // Fast-forward timers to trigger redirect
      vi.advanceTimersByTime(4000)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/simulation', expect.any(Object))
      })
    })
  })

  describe('Network Error Handling - Requirement 3.1', () => {
    it('should handle "Failed to fetch" network error', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('Failed to fetch'))

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/connection.*failed/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/check your internet/i)).toBeInTheDocument()
      
      // Should show retry button
      const retryButton = screen.getByText(/try again|retry/i)
      expect(retryButton).toBeInTheDocument()
    })

    it('should handle generic network error', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      const networkError = new Error('Network connection failed')
      networkError.name = 'NetworkError'
      mockStartSimulation.mockRejectedValue(networkError)

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/connection.*failed/i)).toBeInTheDocument()
      })

      // Should log network error - Requirement 3.4
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Simulation Error'),
        expect.objectContaining({
          type: 'Simulation startup failed',
          details: expect.objectContaining({
            errorType: 'network'
          })
        })
      )
    })

    it('should allow retry for network errors', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({
          sessionId: 'retry-session',
          patientName: 'Retry Patient',
          initialPrompt: 'Hello after retry',
          speaks_for: 'Retry Patient'
        })

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/connection.*failed/i)).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByText(/try again|retry/i)
      fireEvent.click(retryButton)

      // Should show retrying state
      await waitFor(() => {
        expect(screen.getByText(/retrying/i)).toBeInTheDocument()
      })

      // Should eventually succeed and navigate
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/simulation/test-case/session/retry-session',
          expect.any(Object)
        )
      })

      // Should have called startSimulation twice (original + retry)
      expect(mockStartSimulation).toHaveBeenCalledTimes(2)
    })
  })

  describe('Authentication Error Handling - Requirement 3.2', () => {
    it('should handle 401 unauthorized error', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('401 - Unauthorized'))

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/session.*expired/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/log in again/i)).toBeInTheDocument()
      
      // Should show login action
      const loginButton = screen.getByText(/sign in|login/i)
      expect(loginButton).toBeInTheDocument()
    })

    it('should handle "authentication" error message', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('Authentication failed'))

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/session.*expired/i)).toBeInTheDocument()
      })
    })

    it('should handle "Session expired" error message', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('Session expired'))

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/session.*expired/i)).toBeInTheDocument()
      })
    })

    it('should redirect to login after authentication error', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('401 - Unauthorized'))

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/session.*expired/i)).toBeInTheDocument()
      })

      // Fast-forward timers to trigger redirect
      vi.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Server Error Handling - Requirement 3.1', () => {
    it('should handle 500 internal server error', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('500 - Internal Server Error'))

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/server.*experiencing.*issues/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/try again.*few moments/i)).toBeInTheDocument()
      
      // Should show retry button
      const retryButton = screen.getByText(/try again|retry/i)
      expect(retryButton).toBeInTheDocument()
    })

    it('should handle 502 bad gateway error', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('502 - Bad Gateway'))

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/server.*experiencing.*issues/i)).toBeInTheDocument()
      })
    })

    it('should handle 503 service unavailable error', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('503 - Service Unavailable'))

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/server.*experiencing.*issues/i)).toBeInTheDocument()
      })
    })

    it('should allow retry for server errors', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation
        .mockRejectedValueOnce(new Error('500 - Internal Server Error'))
        .mockResolvedValueOnce({
          sessionId: 'server-retry-session',
          patientName: 'Server Retry Patient',
          initialPrompt: 'Hello after server retry',
          speaks_for: 'Server Retry Patient'
        })

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/server.*experiencing.*issues/i)).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByText(/try again|retry/i)
      fireEvent.click(retryButton)

      // Should eventually succeed
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/simulation/test-case/session/server-retry-session',
          expect.any(Object)
        )
      })
    })
  })

  describe('Timeout Error Handling', () => {
    it('should handle timeout error correctly', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'TimeoutError'
      mockStartSimulation.mockRejectedValue(timeoutError)

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/taking too long/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/try again/i)).toBeInTheDocument()
    })

    it('should handle generic timeout message', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('Connection timeout'))

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/taking too long/i)).toBeInTheDocument()
      })
    })
  })

  describe('Unknown Error Handling', () => {
    it('should handle unknown error with retry option', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('Something unexpected happened'))

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/unexpected error/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/contact support/i)).toBeInTheDocument()
      
      // Should show retry button
      const retryButton = screen.getByText(/try again|retry/i)
      expect(retryButton).toBeInTheDocument()
    })

    it('should handle error without message', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error())

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/unexpected error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Logging and Debugging - Requirement 3.4', () => {
    it('should log detailed error information for debugging', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'debug-case' })
      
      const testError = new Error('Test error for logging')
      testError.stack = 'Error stack trace...'
      mockStartSimulation.mockRejectedValue(testError)

      renderWithRouter(['/simulation/debug-case'])

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Simulation Error'),
          expect.objectContaining({
            timestamp: expect.any(String),
            type: 'Simulation startup failed',
            caseId: 'debug-case',
            sessionId: undefined,
            urlAccessPattern: expect.any(String),
            userAgent: expect.any(String),
            url: expect.any(String),
            retryCount: 0,
            details: expect.objectContaining({
              error: 'Test error for logging',
              errorType: 'unknown',
              stack: 'Error stack trace...'
            })
          })
        )
      })
    })

    it('should include retry count in error logs', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'retry-log-case' })
      
      mockStartSimulation
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))

      renderWithRouter(['/simulation/retry-log-case'])

      // Wait for first error
      await waitFor(() => {
        expect(screen.getByText(/try again|retry/i)).toBeInTheDocument()
      })

      // Click retry
      const retryButton = screen.getByText(/try again|retry/i)
      fireEvent.click(retryButton)

      // Wait for second error
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Simulation Error'),
          expect.objectContaining({
            details: expect.objectContaining({
              retryAttempt: 1
            })
          })
        )
      })
    })
  })

  describe('Retry Functionality and State Management', () => {
    it('should prevent multiple simultaneous retries', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('Failed to fetch'))

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/connection.*failed/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByText(/try again|retry/i)
      
      // Click retry multiple times rapidly
      fireEvent.click(retryButton)
      fireEvent.click(retryButton)
      fireEvent.click(retryButton)

      // Should only call startSimulation twice (original + one retry)
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledTimes(2)
      })
    })

    it('should reset error state on successful retry', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({
          sessionId: 'success-session',
          patientName: 'Success Patient',
          initialPrompt: 'Hello after success',
          speaks_for: 'Success Patient'
        })

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/connection.*failed/i)).toBeInTheDocument()
      })

      // Click retry
      const retryButton = screen.getByText(/try again|retry/i)
      fireEvent.click(retryButton)

      // Should clear error and navigate on success
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/simulation/test-case/session/success-session',
          expect.any(Object)
        )
      })

      // Error message should be cleared
      expect(screen.queryByText(/connection.*failed/i)).not.toBeInTheDocument()
    })

    it('should handle retry with network delay', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'test-case' })
      
      mockStartSimulation
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              sessionId: 'delayed-session',
              patientName: 'Delayed Patient',
              initialPrompt: 'Hello after delay',
              speaks_for: 'Delayed Patient'
            }), 100)
          )
        )

      renderWithRouter(['/simulation/test-case'])

      await waitFor(() => {
        expect(screen.getByText(/connection.*failed/i)).toBeInTheDocument()
      })

      // Click retry
      const retryButton = screen.getByText(/try again|retry/i)
      fireEvent.click(retryButton)

      // Should show retrying state
      await waitFor(() => {
        expect(screen.getByText(/retrying/i)).toBeInTheDocument()
      })

      // Fast-forward the delay
      vi.advanceTimersByTime(2000)

      // Should eventually succeed
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/simulation/test-case/session/delayed-session',
          expect.any(Object)
        )
      })
    })
  })

  describe('Specialty Context Preservation During Errors - Requirements 4.1, 4.2', () => {
    it('should preserve specialty context during error redirects', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'invalid-case' })
      
      // Set specialty context
      mockLocation.state = {
        specialtyContext: {
          specialty: 'Cardiology',
          returnUrl: '/cardiology'
        }
      }

      mockStartSimulation.mockRejectedValue(new Error('404 - Case not found'))

      renderWithRouter(['/simulation/invalid-case'])

      await waitFor(() => {
        expect(screen.getByText(/case.*not.*found/i)).toBeInTheDocument()
      })

      // Fast-forward to trigger redirect
      vi.advanceTimersByTime(4000)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/cardiology', // Should use specialty context returnUrl
          expect.objectContaining({
            state: expect.objectContaining({
              specialtyContext: expect.any(Object),
              fromSimulationError: true,
              errorType: 'invalid_case'
            })
          })
        )
      })
    })

    it('should fallback to default URL when no specialty context exists', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'invalid-case' })
      
      // No specialty context
      mockLocation.state = {}

      mockStartSimulation.mockRejectedValue(new Error('404 - Case not found'))

      renderWithRouter(['/simulation/invalid-case'])

      await waitFor(() => {
        expect(screen.getByText(/case.*not.*found/i)).toBeInTheDocument()
      })

      // Fast-forward to trigger redirect
      vi.advanceTimersByTime(4000)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/simulation', // Should fallback to default
          expect.any(Object)
        )
      })
    })
  })
})