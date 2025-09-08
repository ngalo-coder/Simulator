import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

// Mock all the page components to avoid complex dependencies
vi.mock('../pages/HomePage', () => ({
  default: () => <div data-testid="home-page">Home Page</div>
}))

vi.mock('../pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}))

vi.mock('../pages/SimulationPage', () => ({
  default: () => <div data-testid="simulation-page">Simulation Page</div>
}))

vi.mock('../pages/SimulationChatPage', () => ({
  default: () => <div data-testid="simulation-chat-page">Simulation Chat Page</div>
}))

vi.mock('../components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>
}))

vi.mock('../components/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>
}))

vi.mock('../components/SessionManager', () => ({
  default: () => <div data-testid="session-manager">Session Manager</div>
}))

vi.mock('../components/NotificationToast', () => ({
  useNotification: () => ({
    NotificationContainer: () => <div data-testid="notification-container">Notifications</div>
  })
}))