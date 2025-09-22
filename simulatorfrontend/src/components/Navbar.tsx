import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSpecialtyContext } from '../hooks/useSpecialtyContext';
import ThemeToggle from './ThemeToggle';
import { Button } from './ui';
import { Badge } from './ui';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  adminOnly?: boolean;
  description?: string;
}

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSpecialty, currentSpecialtySlug } = useSpecialtyContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path: string) => {
    // Special handling for specialty routes
    if (currentSpecialtySlug && location.pathname === `/${currentSpecialtySlug}`) {
      return path === '/browse-cases' || path === '/simulation';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      ),
      description: 'Overview of your medical simulation progress'
    },
    {
      name: 'Browse Cases',
      href: '/browse-cases',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Explore available medical simulation cases'
    },
    {
      name: 'Active Cases',
      href: '/simulation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      description: 'Start and manage patient simulation sessions'
    },
    {
      name: 'Progress',
      href: '/progress',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Track your medical training progress'
    },
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      description: 'Compare performance with peers'
    },
    {
      name: 'Admin Panel',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      adminOnly: true,
      description: 'Manage users and system settings'
    }
  ];

  const filteredNavigationItems = navigationItems.filter(item =>
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled
          ? 'bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md border-b border-gray-200 dark:border-dark-border shadow-medical-lg'
          : 'bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-3 group"
              aria-label="Simuatech - Medical Simulation Platform"
            >
              <div className="relative">
                <img
                  src="/logo.png"
                  alt=""
                  className="h-10 w-auto transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-stable-500 rounded-full animate-pulse-medical" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 dark:text-dark-primary">
                  Simuatech
                </h1>
                <p className="text-xs text-gray-500 dark:text-dark-secondary">
                  Medical Simulation Platform
                </p>
              </div>
            </Link>

            {/* Current Specialty Indicator */}
            {currentSpecialty && (
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-medical-100 dark:bg-medical-900/30 rounded-lg border border-medical-200 dark:border-medical-800">
                <div className="w-2 h-2 bg-medical-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-medical-700 dark:text-medical-300 uppercase tracking-wide">
                  Active Specialty:
                </span>
                <Badge variant="primary" size="sm">
                  {currentSpecialty}
                </Badge>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 max-w-4xl mx-8">
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-dark-surface rounded-xl p-1">
              {user ? (
                filteredNavigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 group
                      ${isActivePath(item.href)
                        ? 'bg-white dark:bg-dark-card text-medical-700 dark:text-medical-300 shadow-sm transform scale-105'
                        : 'text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary hover:bg-gray-50 dark:hover:bg-dark-hover'
                      }
                    `}
                    title={item.description}
                  >
                    <span className="transition-transform duration-200 group-hover:scale-110">
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" size="xs">
                        {item.badge}
                      </Badge>
                    )}
                    {isActivePath(item.href) && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-medical-500 rounded-full" />
                    )}
                  </Link>
                ))
              ) : (
                <div className="flex items-center space-x-2 px-4 py-2">
                  <div className="text-sm text-gray-500 dark:text-dark-secondary">
                    Sign in to access medical simulations
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Menu & Actions */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />

            {user ? (
              <div className="hidden md:flex items-center space-x-3">
                {/* User Info */}
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-dark-primary">
                    Dr. {user.username}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-dark-secondary capitalize">
                    {user.role}
                  </div>
                </div>

                {/* Role Badge */}
                {user.role === 'admin' && (
                  <Badge variant="error" size="sm">
                    Admin
                  </Badge>
                )}

                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    title="User Profile"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center p-2.5 rounded-lg text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary hover:bg-gray-100 dark:hover:bg-dark-hover focus:outline-none focus:ring-2 focus:ring-medical-500 focus:ring-offset-2 transition-colors duration-200"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              {!isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border shadow-medical-lg animate-medical-slide-up">
          <div className="px-4 py-6 space-y-4">
            {user ? (
              <>
                {/* User Info */}
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-dark-border">
                  <div className="w-10 h-10 bg-medical-100 dark:bg-medical-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-medical-600 dark:text-medical-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-dark-primary">
                      Dr. {user.username}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-dark-secondary capitalize">
                      {user.role}
                    </div>
                  </div>
                  {user.role === 'admin' && (
                    <Badge variant="error" size="sm">
                      Admin
                    </Badge>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="space-y-2">
                  {filteredNavigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${isActivePath(item.href)
                          ? 'bg-medical-50 dark:bg-medical-900/20 text-medical-700 dark:text-medical-300 border-l-4 border-medical-500'
                          : 'text-gray-700 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary hover:bg-gray-50 dark:hover:bg-dark-hover'
                        }
                      `}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-gray-400 dark:text-dark-tertiary">
                        {item.icon}
                      </span>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500 dark:text-dark-tertiary">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Mobile Actions */}
                <div className="pt-4 border-t border-gray-200 dark:border-dark-border space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      navigate('/profile');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    fullWidth
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    navigate('/register');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;