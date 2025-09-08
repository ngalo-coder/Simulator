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
    const baseClasses = "px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out";
    const activeClasses = "bg-blue-600 text-white shadow-md hover:bg-blue-700";
    const inactiveClasses = "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700/50";
    
    return `${baseClasses} ${isActivePath(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Specialty Context */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 group">
              <img src="/logo.png" alt="Simuatech Logo" className="h-8 w-auto" />
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-300">
                Simuatech
              </div>
            </Link>
            
            {/* Current Specialty Indicator */}
            {currentSpecialty && (
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-300 uppercase tracking-wide">
                  Current:
                </span>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-200">
                  {currentSpecialty}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-2xl mx-8" data-testid="desktop-nav">
            <div className="flex items-center space-x-1">
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
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* User Menu (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-right">
                  <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <span>Welcome, {user.username}</span>
                    {user.role === 'admin' && (
                      <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full font-bold uppercase tracking-wide">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="px-4 pt-2 pb-4 space-y-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-inner transition-all duration-300">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`${getLinkClasses('/dashboard')} block text-center`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/browse-cases" 
                  className={`${getLinkClasses('/browse-cases')} block text-center`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Browse Cases
                </Link>
                <Link 
                  to="/simulation" 
                  className={`${getLinkClasses('/simulation')} block text-center`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  All Cases
                </Link>
                <Link 
                  to="/progress" 
                  className={`${getLinkClasses('/progress')} block text-center`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Progress
                </Link>
                <Link 
                  to="/leaderboard" 
                  className={`${getLinkClasses('/leaderboard')} block text-center`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Leaderboard
                </Link>
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`${getLinkClasses('/admin')} block text-center`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4 pb-3">
                  <div className="flex items-center justify-center px-3">
                    <div className="text-sm text-center">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                      <div className="text-gray-500 dark:text-gray-400 capitalize">{user.role}</div>
                    </div>
                  </div>
                  <div className="mt-3 px-3">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
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
                  className={`${getLinkClasses('/login')} block text-center`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="block px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg text-center"
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