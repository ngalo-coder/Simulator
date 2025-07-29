// ai-patient-sim-frontend/src/App.js - UPDATED WITH SIMULATION ROUTES
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ServiceWakeup from './components/ServiceWakeup';

// Pages
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import DashboardPage from './pages/DashboardPage';
import CaseSelection from './components/simulation/CaseSelection';
import SimulationPage from './pages/SimulationPage';
import SimulationHistory from './pages/SimulationHistory';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <ServiceWakeup>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginForm />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterForm />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/cases"
                element={
                  <ProtectedRoute>
                    <CaseSelection />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/simulation/:id"
                element={
                  <ProtectedRoute>
                    <SimulationPage />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <SimulationHistory />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" />} />

              {/* 404 Page */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900">404</h1>
                      <p className="text-gray-600 mt-2">Page not found</p>
                      <a
                        href="/dashboard"
                        className="text-blue-600 hover:text-blue-500 mt-4 inline-block"
                      >
                        Go to Dashboard
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>

            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  theme: {
                    primary: 'green',
                    secondary: 'black',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ServiceWakeup>
  );
}

export default App;