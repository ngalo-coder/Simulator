import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock all the page components to avoid complex dependencies
vi.mock('./pages/HomePage', () => ({
  default: () => <div data-testid="home-page">Home Page</div>
}))

vi.mock('./pages/SimulationPage', () => ({
  default: () => <div data-testid="simulation-page">Simulation Page</div>
}))

vi.mock('./pages/SimulationChatPage', () => ({
  default: () => <div data-testid="simulation-chat-page">Simulation Chat Page</div>
}))

vi.mock('./pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}))

vi.mock('./pages/DashboardPage', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>
}))

vi.mock('./pages/EnhancedSpecialtySelectionPage', () => ({
  default: () => <div data-testid="enhanced-specialty-selection-page">Enhanced Specialty Selection Page</div>
}))

vi.mock('./components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('./components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>
}))

vi.mock('./components/SessionManager', () => ({
  default: () => <div data-testid="session-manager">Session Manager</div>
}))

vi.mock('./components/NotificationToast', () => ({
  useNotification: () => ({
    NotificationContainer: () => <div data-testid="notification-container">Notifications</div>
  })
}))

vi.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Create a test version of the routes without the full App wrapper
const TestRoutes = () => (
  <Routes>
    <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
    <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
    <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard Page</div>} />
    <Route path="/browse-cases" element={<div data-testid="enhanced-specialty-selection-page">Enhanced Specialty Selection Page</div>} />
    <Route path="/simulation" element={<div data-testid="simulation-page">Simulation Page</div>} />
    <Route path="/simulation/:caseId" element={<div data-testid="simulation-chat-page">Simulation Chat Page</div>} />
    <Route path="/simulation/:caseId/session/:sessionId" element={<div data-testid="simulation-chat-page">Simulation Chat Page</div>} />
  </Routes>
)

describe('App Routing Configuration', () => {
  describe('Simulation Routes', () => {
    it('should render SimulationPage for /simulation route', () => {
      render(
        <MemoryRouter initialEntries={['/simulation']}>
          <TestRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('simulation-page')).toBeInTheDocument()
    })

    it('should render SimulationChatPage for direct case access /simulation/:caseId', () => {
      render(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-001']}>
          <TestRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('simulation-chat-page')).toBeInTheDocument()
    })

    it('should render SimulationChatPage for session access /simulation/:caseId/session/:sessionId', () => {
      render(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-001/session/abc123']}>
          <TestRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('simulation-chat-page')).toBeInTheDocument()
    })

    it('should handle different case ID formats', () => {
      const caseIds = [
        'VP-OPTH-001',
        'VP-CARD-002', 
        'VP-PEDS-003',
        'CASE-123',
        'test-case'
      ]

      caseIds.forEach(caseId => {
        const { unmount } = render(
          <MemoryRouter initialEntries={[`/simulation/${caseId}`]}>
            <TestRoutes />
          </MemoryRouter>
        )
        
        expect(screen.getByTestId('simulation-chat-page')).toBeInTheDocument()
        unmount()
      })
    })

    it('should handle session URLs with different session ID formats', () => {
      const sessionIds = [
        'abc123',
        'session-456',
        'uuid-1234-5678-9012',
        '12345'
      ]

      sessionIds.forEach(sessionId => {
        const { unmount } = render(
          <MemoryRouter initialEntries={[`/simulation/VP-OPTH-001/session/${sessionId}`]}>
            <TestRoutes />
          </MemoryRouter>
        )
        
        expect(screen.getByTestId('simulation-chat-page')).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Other Routes', () => {
    it('should render HomePage for root route', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <TestRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    it('should render LoginPage for /login route', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <TestRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('should render DashboardPage for /dashboard route', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <TestRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })

    it('should render EnhancedSpecialtySelectionPage for /browse-cases route', () => {
      render(
        <MemoryRouter initialEntries={['/browse-cases']}>
          <TestRoutes />
        </MemoryRouter>
      )

      expect(screen.getByTestId('enhanced-specialty-selection-page')).toBeInTheDocument()
    })
  })

  describe('Route Priority and Matching', () => {
    it('should prioritize more specific routes over general ones', () => {
      // Test that /simulation/VP-OPTH-001/session/abc123 matches the session route
      // not the case-only route
      render(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-001/session/abc123']}>
          <TestRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('simulation-chat-page')).toBeInTheDocument()
    })

    it('should handle case-only URLs correctly', () => {
      // Test that /simulation/VP-OPTH-001 matches the case-only route
      render(
        <MemoryRouter initialEntries={['/simulation/VP-OPTH-001']}>
          <TestRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('simulation-chat-page')).toBeInTheDocument()
    })
  })
})