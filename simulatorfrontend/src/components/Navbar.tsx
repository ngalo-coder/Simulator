import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';
import ThemeToggle from './ThemeToggle';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSpecialty, currentSpecialtySlug } = useSpecialtyContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActivePath = (path: string) => {
    // Special handling for specialty routes
    if (currentSpecialtySlug && location.pathname === `/${currentSpecialtySlug}`) {
      return path === '/browse-cases' || path === '/simulation';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getLinkClasses = (path: string) => {
    const baseClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
    const activeClasses = "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
    const inactiveClasses = "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700";
    
    return `${baseClasses} ${isActivePath(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Specialty Context */}
          <div className="flex-shrink-0 flex items-center space-x-4">
            <Link to="/" className="flex items-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                🏥 Simuatech
              </div>
            </Link>
            
            {/* Current Specialty Indicator */}
            {currentSpecialty && (
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Current:
                </span>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {currentSpecialty}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {user ? (
                <>
                  <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
                    Dashboard
                  </Link>
                  <Link to="/browse-cases" className={getLinkClasses('/browse-cases')}>
                    Browse Cases
                  </Link>
                  <Link to="/simulation" className={getLinkClasses('/simulation')}>
                    All Cases
                  </Link>
                  <Link to="/progress" className={getLinkClasses('/progress')}>
                    Progress
                  </Link>
                  <Link to="/leaderboard" className={getLinkClasses('/leaderboard')}>
                    Leaderboard
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className={getLinkClasses('/admin')}>
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/login" className={getLinkClasses('/login')}>
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* User Menu (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Welcome,</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{user.username}</span>
                  {user.role === 'admin' && (
                    <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-gray-100 dark:bg-gray-700 inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 transition-colors duration-200">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`${getLinkClasses('/dashboard')} block`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/browse-cases" 
                  className={`${getLinkClasses('/browse-cases')} block`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Browse Cases
                </Link>
                <Link 
                  to="/simulation" 
                  className={`${getLinkClasses('/simulation')} block`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  All Cases
                </Link>
                <Link 
                  to="/progress" 
                  className={`${getLinkClasses('/progress')} block`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Progress
                </Link>
                <Link 
                  to="/leaderboard" 
                  className={`${getLinkClasses('/leaderboard')} block`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Leaderboard
                </Link>
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`${getLinkClasses('/admin')} block`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4 pb-3">
                  <div className="flex items-center px-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                      <div className="text-gray-500 dark:text-gray-400">{user.role}</div>
                    </div>
                  </div>
                  <div className="mt-3 px-3">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`${getLinkClasses('/login')} block`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="block bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;