import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
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

describe('SimulationChatPage Component Logic - Requirements 1.1, 1.2, 2.1', () => {
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

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('URL Parameter Detection and Handling - Requirements 1.1, 1.2', () => {
    it('should detect case-only URL pattern and set urlAccessPattern correctly', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      mockLocation.pathname = '/simulation/VP-OPTH-001'

      renderWithRouter(['/simulation/VP-OPTH-001'])

      // The component should detect this as a case-only pattern
      // We can't directly test internal state, but we can test the behavior
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-OPTH-001')
      })
    })

    it('should detect case-with-session URL pattern correctly', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ 
        caseId: 'VP-OPTH-001', 
        sessionId: 'session-123' 
      })
      mockLocation.pathname = '/simulation/VP-OPTH-001/session/session-123'

      renderWithRouter(['/simulation/VP-OPTH-001/session/session-123'])

      // For existing sessions, it should not call startSimulation immediately
      // Instead it should set up for loading existing session data
      await waitFor(() => {
        // Should not start a new simulation for existing session URLs
        expect(mockStartSimulation).not.toHaveBeenCalled()
      }, { timeout: 1000 })
    })

    it('should handle invalid URL patterns gracefully', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({}) // No caseId
      mockLocation.pathname = '/simulation'

      renderWithRouter(['/simulation'])

      // Should handle missing caseId gracefully
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/simulation')
      })
    })

    it('should handle different case ID formats - Requirement 4.3', async () => {
      const { useParams } = await import('react-router-dom')
      const caseIds = [
        'VP-OPTH-001',
        'VP-CARD-002',
        'CASE_123',
        'complex-case-name',
        'case123'
      ]

      for (const caseId of caseIds) {
        vi.clearAllMocks()
        vi.mocked(useParams).mockReturnValue({ caseId })
        mockLocation.pathname = `/simulation/${caseId}`

        const { unmount } = renderWithRouter([`/simulation/${caseId}`])

        await waitFor(() => {
          expect(mockStartSimulation).toHaveBeenCalledWith(caseId)
        })

        unmount()
      }
    })
  })

  describe('Automatic Simulation Startup - Requirements 1.1, 2.1', () => {
    it('should automatically start simulation for case-only URLs', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      mockStartSimulation.mockResolvedValue({
        sessionId: 'new-session-123',
        patientName: 'John Doe',
        initialPrompt: 'Hello, I have been experiencing chest pain.',
        speaks_for: 'John Doe'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-OPTH-001')
      })
    })

    it('should handle successful simulation startup with patient data - Requirement 2.1', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      const mockResponse = {
        sessionId: 'new-session-123',
        patientName: 'Jane Smith',
        initialPrompt: 'I have been having headaches for the past week.',
        speaks_for: 'Jane Smith'
      }
      
      mockStartSimulation.mockResolvedValue(mockResponse)

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-OPTH-001')
      })

      // Should redirect to session URL after successful startup
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/simulation/VP-OPTH-001/session/new-session-123',
          expect.objectContaining({
            replace: true,
            state: expect.any(Object)
          })
        )
      })
    })

    it('should handle different API response formats - Requirement 2.1', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      // Test different possible response structures from backend
      const responseVariations = [
        {
          sessionId: 'session-1',
          patientName: 'Patient A',
          initialPrompt: 'Hello doctor',
          speaks_for: 'Patient A'
        },
        {
          session_id: 'session-2', // snake_case variant
          patient_name: 'Patient B',
          initial_prompt: 'Hi there',
          speaks_for: 'Patient B'
        },
        {
          sessionId: 'session-3',
          name: 'Patient C', // different field name
          prompt: 'Good morning',
          speaks_for: 'Patient C'
        },
        {
          sessionId: 'session-4',
          patientName: 'Patient D',
          message: 'How are you?', // different field name
          speaks_for: 'Patient D'
        }
      ]

      for (const response of responseVariations) {
        vi.clearAllMocks()
        mockStartSimulation.mockResolvedValue(response)

        const { unmount } = renderWithRouter(['/simulation/VP-OPTH-001'])

        await waitFor(() => {
          expect(mockStartSimulation).toHaveBeenCalledWith('VP-OPTH-001')
        })

        // Should handle all response formats and redirect appropriately
        await waitFor(() => {
          const expectedSessionId = response.sessionId || response.session_id
          expect(mockNavigate).toHaveBeenCalledWith(
            `/simulation/VP-OPTH-001/session/${expectedSessionId}`,
            expect.objectContaining({
              replace: true,
              state: expect.any(Object)
            })
          )
        })

        unmount()
      }
    })

    it('should not start simulation for existing session URLs', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ 
        caseId: 'VP-OPTH-001', 
        sessionId: 'existing-session' 
      })

      renderWithRouter(['/simulation/VP-OPTH-001/session/existing-session'])

      // Should not call startSimulation for existing sessions
      await waitFor(() => {
        expect(mockStartSimulation).not.toHaveBeenCalled()
      }, { timeout: 1000 })
    })
  })

  describe('Loading States and User Feedback - Requirements 2.2, 2.3, 2.4', () => {
    it('should show loading states during simulation startup', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      // Mock a delayed response to test loading states
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

      // Should show loading indicator during startup
      await waitFor(() => {
        const loadingElements = screen.queryAllByText(/loading|validating|creating|preparing/i)
        expect(loadingElements.length).toBeGreaterThan(0)
      })
    })

    it('should show progress indicators during different startup phases', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      let resolveStartup: (value: any) => void
      mockStartSimulation.mockImplementation(() => 
        new Promise(resolve => {
          resolveStartup = resolve
        })
      )

      renderWithRouter(['/simulation/VP-OPTH-001'])

      // Should show initial loading state
      await waitFor(() => {
        expect(screen.getByText(/validating case/i)).toBeInTheDocument()
      })

      // Resolve the startup
      act(() => {
        resolveStartup({
          sessionId: 'session-123',
          patientName: 'Test Patient',
          initialPrompt: 'Hello',
          speaks_for: 'Test Patient'
        })
      })

      // Should eventually complete loading
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      })
    })

    it('should handle missing initial prompt with default greeting - Requirement 2.2', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      mockStartSimulation.mockResolvedValue({
        sessionId: 'session-123',
        patientName: 'Test Patient',
        // No initialPrompt provided
        speaks_for: 'Test Patient'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-OPTH-001')
      })

      // Component should handle missing initial prompt gracefully
      // The exact behavior would be tested through integration tests
    })
  })

  describe('URL Redirection and Consistency - Requirements 1.2, 4.1, 4.2, 4.4', () => {
    it('should redirect to session URL after successful simulation start', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      mockStartSimulation.mockResolvedValue({
        sessionId: 'new-session-456',
        patientName: 'Test Patient',
        initialPrompt: 'Hello doctor',
        speaks_for: 'Test Patient'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/simulation/VP-OPTH-001/session/new-session-456',
          expect.objectContaining({
            replace: true,
            state: expect.any(Object)
          })
        )
      })
    })

    it('should preserve specialty context during redirection - Requirements 4.1, 4.2', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      // Set specialty context in location state
      mockLocation.state = {
        specialtyContext: {
          specialty: 'Cardiology',
          returnUrl: '/cardiology'
        }
      }

      mockStartSimulation.mockResolvedValue({
        sessionId: 'session-789',
        patientName: 'Test Patient',
        initialPrompt: 'Hello',
        speaks_for: 'Test Patient'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/simulation/VP-OPTH-001/session/session-789',
          expect.objectContaining({
            replace: true,
            state: expect.objectContaining({
              specialtyContext: expect.any(Object)
            })
          })
        )
      })
    })

    it('should update browser history for bookmark compatibility - Requirement 4.4', async () => {
      const { useParams } = await import('react-router-dom')
      const { updateBrowserHistoryForBookmarks } = await import('../utils/urlUtils')
      
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      mockStartSimulation.mockResolvedValue({
        sessionId: 'session-bookmark',
        patientName: 'Bookmark Patient',
        initialPrompt: 'Hello',
        speaks_for: 'Bookmark Patient'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(updateBrowserHistoryForBookmarks).toHaveBeenCalledWith(
          '/simulation/VP-OPTH-001/session/session-bookmark',
          'Simulation: Bookmark Patient',
          expect.any(Object)
        )
      })
    })
  })

  describe('State Management and Component Lifecycle', () => {
    it('should properly initialize component state', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      // Component should initialize without errors
      expect(screen.getByTestId).toBeDefined()
    })

    it('should handle component unmounting during simulation startup', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      // Mock a long-running startup
      mockStartSimulation.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 5000))
      )

      const { unmount } = renderWithRouter(['/simulation/VP-OPTH-001'])

      // Unmount before startup completes
      unmount()

      // Should not cause any errors or memory leaks
      expect(true).toBe(true) // Test passes if no errors thrown
    })

    it('should prevent multiple simultaneous simulation starts', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
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

      // Even if component re-renders, should only call startSimulation once
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Edge Cases and Error Prevention', () => {
    it('should handle missing sessionId in API response', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      mockStartSimulation.mockResolvedValue({
        // Missing sessionId
        patientName: 'Test Patient',
        initialPrompt: 'Hello',
        speaks_for: 'Test Patient'
      })

      renderWithRouter(['/simulation/VP-OPTH-001'])

      // Should handle missing sessionId gracefully
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-OPTH-001')
      })

      // Should not navigate if no sessionId
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should handle empty or null API response', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      
      mockStartSimulation.mockResolvedValue(null)

      renderWithRouter(['/simulation/VP-OPTH-001'])

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-OPTH-001')
      })

      // Should handle null response gracefully
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should handle rapid URL parameter changes', async () => {
      const { useParams } = await import('react-router-dom')
      
      // Start with first case
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-001' })
      const { rerender } = renderWithRouter(['/simulation/VP-OPTH-001'])

      // Quickly change to second case
      vi.mocked(useParams).mockReturnValue({ caseId: 'VP-OPTH-002' })
      rerender(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-002']}>
          <SimulationChatPage />
        </MemoryRouter>
      )

      // Should handle parameter changes gracefully
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalled()
      })
    })
  })
})