// App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CaseBrowsingPage from './pages/CaseBrowsingPage';
import SimulationPage from './pages/SimulationPage';
import SimulationChatPage from './pages/SimulationChatPage';
import LazySpecialtyPage from './components/LazySpecialtyPage';
import ProgressPage from './pages/ProgressPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';

// Import components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import SessionManager from './components/SessionManager';
import SpecialtyRouteGuard from './components/SpecialtyRouteGuard';
import SpecialtyErrorBoundary from './components/SpecialtyErrorBoundary';
import { useNotification } from './components/NotificationToast';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const { NotificationContainer } = useNotification();

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Navbar />
          <NotificationContainer />
          <SessionManager />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
            <div className="animate-medical-fade-in">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/browse-cases"
                  element={
                    <ProtectedRoute>
                      <CaseBrowsingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/simulation"
                  element={
                    <ProtectedRoute>
                      <SimulationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/simulation/:caseId"
                  element={
                    <ProtectedRoute>
                      <SimulationChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/simulation/:caseId/session/:sessionId"
                  element={
                    <ProtectedRoute>
                      <SimulationChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ProtectedRoute>
                      <ProgressPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <LeaderboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:specialty"
                  element={
                    <ProtectedRoute>
                      <SpecialtyErrorBoundary>
                        <SpecialtyRouteGuard>
                          <LazySpecialtyPage />
                        </SpecialtyRouteGuard>
                      </SpecialtyErrorBoundary>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;