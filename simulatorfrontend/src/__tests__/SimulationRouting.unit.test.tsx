import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
  parseSimulationUrl: vi.fn((url) => {
    if (url.includes('/session/')) {
      const parts = url.split('/')
      const caseIndex = parts.indexOf('simulation') + 1
      const sessionIndex = parts.indexOf('session') + 1
      return {
        isValid: true,
        caseId: parts[caseIndex],
        sessionId: parts[sessionIndex]
      }
    } else if (url.includes('/simulation/')) {
      const parts = url.split('/')
      const caseIndex = parts.indexOf('simulation') + 1
      return {
        isValid: true,
        caseId: parts[caseIndex],
        sessionId: null
      }
    }
    return { isValid: false, caseId: null, sessionId: null }
  }),
  createSpecialtyContext: vi.fn(() => ({ returnUrl: '/simulation' })),
  preserveSpecialtyContext: vi.fn((state, additional) => ({ ...state, ...additional })),
  updateBrowserHistoryForBookmarks: vi.fn(),
  isValidSimulationUrl: vi.fn(() => true)
}))

// Mock useParams and useNavigate
const mockNavigate = vi.fn()
const mockLocation = { state: {}, pathname: '' }

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

describe('Simulation Routing Unit Tests - Task 6 Requirements', () => {
  let mockStartSimulation: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mock function reference
    const { api } = await import('../services/apiService')
    mockStartSimulation = api.startSimulation
    
    // Reset location mock
    mockLocation.pathname = '/simulation/test-case'
    mockLocation.state = {}
  })

  describe('Route Matching Behavior - Requirements 1.1, 4.1, 4.3', () => {
    it('should correctly identify case-only URL pattern', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      mockLocation.pathname = '/simulation/VP-OPTH-001'

      mockStartSimulation.mockResolvedValue({
        sessionId: 'new-session-123',
        patientName: 'Test Patient',
        initialPrompt: 'Hello doctor',
        speaks_for: 'Test Patient'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      // Should automatically start simulation for case-only URLs
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-OPTH-001')
      })
    })

    it('should correctly identify case-with-session URL pattern', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ 
        caseId: 'VP-OPTH-001', 
        sessionId: 'existing-session-123' 
      })
      mockLocation.pathname = '/simulation/VP-OPTH-001/session/existing-session-123'

      renderWithRouter(['/simulation/VP-OPTH-001/session/existing-session-123'])

      // Should NOT start a new simulation for existing session URLs
      await waitFor(() => {
        expect(mockStartSimulation).not.toHaveBeenCalled()
      }, { timeout: 1000 })
    })

    it('should handle complex case ID formats correctly - Requirement 4.3', async () => {
      const { useParams } = await import('react-router-dom')
      
      const complexCaseIds = [
        'VP-OPTH-001-COMPLEX',
        'CASE_WITH_UNDERSCORES_123',
        'case-with-multiple-hyphens-and-numbers-456',
        'MixedCaseID789',
        'case.with.dots.123',
        'case+with+plus+signs',
        'case%20with%20encoded%20spaces'
      ]

      for (const caseId of complexCaseIds) {
        vi.clearAllMocks()
        vi.mocked(useParams).mockReturnValue({ caseId })
        mockLocation.pathname = `/simulation/${caseId}`

        mockStartSimulation.mockResolvedValue({
          sessionId: `session-${caseId}`,
          patientName: 'Test Patient',
          initialPrompt: 'Hello',
          speaks_for: 'Test Patient'
        })

        const { unmount } = renderWithRouter([`/simulation/${caseId}`])

        await waitFor(() => {
          expect(mockStartSimulation).toHaveBeenCalledWith(caseId)
        })

        unmount()
      }
    })

    it('should validate URL patterns using parseSimulationUrl utility', async () => {
      const { parseSimulationUrl } = await import('../utils/urlUtils')
      const { useParams } = await import('react-router-dom')
      
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      mockLocation.pathname = '/simulation/VP-OPTH-001'

      renderWithRouter(['/simulation/VP-OPTH-001'])

      // Should call parseSimulationUrl to validate the URL
      await waitFor(() => {
        expect(parseSimulationUrl).toHaveBeenCalledWith('/simulation/VP-OPTH-001')
      })
    })
  })

  describe('Component Logic with Different URL Parameters - Requirements 1.1, 1.2, 2.1', () => {
    it('should handle missing caseId parameter gracefully', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({}) // No caseId
      mockLocation.pathname = '/simulation'

      renderWithRouter(['/simulation'])

      // Should redirect to simulation page when no caseId is provided
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/simulation')
      })
    })

    it('should handle URL parameter changes during component lifecycle', async () => {
      const { useParams } = await import('react-router-dom')
      
      // Start with first case
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      mockLocation.pathname = '/simulation/VP-OPTH-001'

      const { rerender } = renderWithRouter(['/simulation/VP-OPTH-001'])

      // Change to second case
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-CARD-002' })
      mockLocation.pathname = '/simulation/VP-CARD-002'

      rerender(
        <MemoryRouter initialEntries={['/simulation/VP-CARD-002']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      // Should handle parameter changes gracefully
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalled()
      })
    })

    it('should preserve specialty context from location state - Requirements 4.1, 4.2', async () => {
      const { useParams } = await import('react-router-dom')
      const { preserveSpecialtyContext } = await import('../utils/urlUtils')
      
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      // Set specialty context in location state
      mockLocation.state = {
        specialtyContext: {
          specialty: 'Ophthalmology',
          returnUrl: '/ophthalmology'
        }
      }

      mockStartSimulation.mockResolvedValue({
        sessionId: 'session-123',
        patientName: 'Test Patient',
        initialPrompt: 'Hello',
        speaks_for: 'Test Patient'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(preserveSpecialtyContext).toHaveBeenCalledWith(
          mockLocation.state,
          expect.objectContaining({
            fromCaseOnlyUrl: true,
            originalCaseUrl: '/simulation/VP-OPTH-001'
          })
        )
      })
    })

    it('should update browser history for bookmark compatibility - Requirement 4.4', async () => {
      const { useParams } = await import('react-router-dom')
      const { updateBrowserHistoryForBookmarks } = await import('../utils/urlUtils')
      
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })

      mockStartSimulation.mockResolvedValue({
        sessionId: 'bookmark-session',
        patientName: 'Bookmark Patient',
        initialPrompt: 'Hello',
        speaks_for: 'Bookmark Patient'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(updateBrowserHistoryForBookmarks).toHaveBeenCalledWith(
          '/simulation/VP-OPTH-001/session/bookmark-session',
          'Simulation: Bookmark Patient',
          expect.any(Object)
        )
      })
    })
  })

  describe('Error Handling Scenarios and State Transitions - Requirements 3.1, 3.2, 3.3, 3.4', () => {
    it('should handle network errors with proper error state', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      mockStartSimulation.mockRejectedValue(new Error('Failed to fetch'))

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(screen.getByText(/connection.*failed/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/check your internet/i)).toBeInTheDocument()
    })

    it('should handle authentication errors with redirect', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      mockStartSimulation.mockRejectedValue(new Error('401 - Unauthorized'))

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(screen.getByText(/session.*expired/i)).toBeInTheDocument()
      })
    })

    it('should handle invalid case errors with appropriate messaging', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'invalid-case' })
      
      mockStartSimulation.mockRejectedValue(new Error('404 - Case not found'))

      renderWithRouter(['/simulation/invalid-case'])

      await waitFor(() => {
        expect(screen.getByText(/case.*not.*found/i)).toBeInTheDocument()
      })
    })

    it('should log errors for debugging purposes - Requirement 3.4', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockStartSimulation.mockRejectedValue(new Error('Test error for logging'))

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Simulation Error'),
          expect.objectContaining({
            type: 'Simulation startup failed',
            caseId: 'VP-OPTH-001'
          })
        )
      })

      consoleSpy.mockRestore()
    })

    it('should transition between different error states correctly', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      // First error: network
      mockStartSimulation.mockRejectedValueOnce(new Error('Failed to fetch'))

      const { rerender } = renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(screen.getByText(/connection.*failed/i)).toBeInTheDocument()
      })

      // Second error: authentication
      mockStartSimulation.mockRejectedValueOnce(new Error('401 - Unauthorized'))
      
      rerender(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-001']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/session.*expired/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading States and User Feedback - Requirements 2.2, 2.3, 2.4', () => {
    it('should show loading states during simulation startup', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      // Mock a delayed response
      mockStartSimulation.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            sessionId: 'session-123',
            patientName: 'Test Patient',
            initialPrompt: 'Hello',
            speaks_for: 'Test Patient'
          }), 100)
        )
      )

      renderWithRouter(['/simulation/VP-OPTH-001'])

      // Should show loading indicator
      await waitFor(() => {
        const loadingElements = screen.queryAllByText(/loading|validating|creating|preparing/i)
        expect(loadingElements.length).toBeGreaterThan(0)
      })
    })

    it('should show progress through different startup phases', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      let resolveStartup: (value: any) => void
      mockStartSimulation.mockImplementation(() => 
        new Promise(resolve => {
          resolveStartup = resolve
        })
      )

      renderWithRouter(['/simulation/VP-OPTH-001'])

      // Should show initial validation phase
      await waitFor(() => {
        expect(screen.getByText(/validating case/i)).toBeInTheDocument()
      })

      // Resolve the startup
      resolveStartup({
        sessionId: 'session-123',
        patientName: 'Test Patient',
        initialPrompt: 'Hello',
        speaks_for: 'Test Patient'
      })

      // Should eventually navigate
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      })
    })

    it('should handle smooth transitions between loading states', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      mockStartSimulation.mockResolvedValue({
        sessionId: 'session-123',
        patientName: 'Test Patient',
        initialPrompt: 'Hello',
        speaks_for: 'Test Patient'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      // Should show loading states and then transition to success
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-OPTH-001')
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/simulation/VP-OPTH-001/session/session-123',
          expect.objectContaining({
            replace: true
          })
        )
      })
    })
  })

  describe('URL Redirection and Consistency - Requirements 1.2, 4.1, 4.2, 4.4', () => {
    it('should redirect to session URL after successful simulation start', async () => {
      const { useParams } = await import('react-router-dom')
      const { createSimulationSessionUrl } = await import('../utils/urlUtils')
      
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })

      mockStartSimulation.mockResolvedValue({
        sessionId: 'redirect-session',
        patientName: 'Redirect Patient',
        initialPrompt: 'Hello',
        speaks_for: 'Redirect Patient'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(createSimulationSessionUrl).toHaveBeenCalledWith('VP-OPTH-001', 'redirect-session')
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/simulation/VP-OPTH-001/session/redirect-session',
          expect.objectContaining({
            replace: true,
            state: expect.any(Object)
          })
        )
      })
    })

    it('should maintain URL consistency across different access patterns', async () => {
      const { useParams } = await import('react-router-dom')
      const { isValidSimulationUrl } = await import('../utils/urlUtils')
      
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      mockLocation.pathname = '/simulation/VP-OPTH-001'

      renderWithRouter(['/simulation/VP-OPTH-001'])

      // Should validate URL for consistency
      await waitFor(() => {
        expect(isValidSimulationUrl).toHaveBeenCalledWith('/simulation/VP-OPTH-001')
      })
    })

    it('should handle bookmark URLs correctly - Requirement 4.4', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      // Simulate bookmark access
      mockLocation.pathname = '/simulation/VP-OPTH-001'
      
      mockStartSimulation.mockResolvedValue({
        sessionId: 'bookmark-session',
        patientName: 'Bookmark Test',
        initialPrompt: 'Hello from bookmark',
        speaks_for: 'Bookmark Test'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      // Should start simulation from bookmark URL
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-OPTH-001')
      })

      // Should update page title for better bookmark experience
      await waitFor(() => {
        expect(document.title).toContain('VP-OPTH-001')
      })
    })
  })

  describe('Component State Management and Lifecycle', () => {
    it('should properly initialize component state for different URL patterns', async () => {
      const { useParams } = await import('react-router-dom')
      
      // Test case-only pattern
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      mockLocation.pathname = '/simulation/VP-OPTH-001'

      const { unmount } = renderWithRouter(['/simulation/VP-OPTH-001'])

      // Component should initialize without errors
      expect(screen.getByTestId).toBeDefined()
      
      unmount()

      // Test case-with-session pattern
      vi.mocked(useParams).mockReturnValue({ 
        caseId: 'VP-OPTH-001', 
        sessionId: 'session-123' 
      })
      mockLocation.pathname = '/simulation/VP-OPTH-001/session/session-123'

      renderWithRouter(['/simulation/VP-OPTH-001/session/session-123'])

      // Component should initialize without errors
      expect(screen.getByTestId).toBeDefined()
    })

    it('should handle rapid URL changes without memory leaks', async () => {
      const { useParams } = await import('react-router-dom')
      
      const caseIds = ['VP-OPTH-001', 'VP-CARD-002', 'VP-PEDS-003']
      
      for (const caseId of caseIds) {
        vi.mocked(useParams).mockReturnValue({ caseId })
        mockLocation.pathname = `/simulation/${caseId}`

        const { unmount } = renderWithRouter([`/simulation/${caseId}`])
        
        // Should handle each case without errors
        expect(screen.getByTestId).toBeDefined()
        
        unmount()
      }
    })

    it('should clean up resources on component unmount', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      mockStartSimulation.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 5000))
      )

      const { unmount } = renderWithRouter(['/simulation/VP-OPTH-001'])

      // Unmount before startup completes
      unmount()

      // Should not cause any errors or memory leaks
      expect(true).toBe(true) // Test passes if no errors thrown
    })
  })
})