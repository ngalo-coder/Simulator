import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Debug logging - Step 1: Form submission started
      console.log('🔐 Login attempt started');
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password.length);

      const loginResult = await login(email, password);

      // Debug logging to see what's returned
      console.log('✅ Login result received:', loginResult);
      console.log('🔍 Login result details:', {
        hasToken: !!loginResult?.token,
        hasUser: !!loginResult?.user,
        hasRedirectTo: !!loginResult?.redirectTo,
        userRole: (loginResult as any)?.user?.primaryRole,
        redirectTo: loginResult?.redirectTo
      });

      // Use the redirectTo from backend response, fallback to dashboard for students
      const destination = loginResult?.redirectTo || '/dashboard';
      console.log('🎯 Redirecting to:', destination);

      navigate(destination);
    } catch (err) {
      console.error('❌ Login error occurred:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err
      });
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
      console.log('🔄 Login process completed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-medical-100 -mx-4 sm:-mx-6 lg:-mx-8 -my-8 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-medical-500 to-medical-600 rounded-medical-xl flex items-center justify-center shadow-medical-lg">
              <span className="text-white text-2xl font-bold">🏥</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to continue your clinical learning journey</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {error && (
            <div className="bg-emergency-50 border-l-4 border-emergency-500 p-4 mb-6 rounded-medical-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-emergency-500 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-emergency-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-3">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-medical-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  placeholder="Enter your email address"
                  required
                  aria-describedby="emailHelp"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">📧</span>
                </div>
              </div>
              <p id="emailHelp" className="mt-2 text-xs text-gray-500">Enter your registered email address</p>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-3">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-medical-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 text-black"
                  placeholder="Enter your password"
                  required
                  aria-describedby="passwordHelp"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-medical-500 rounded-medical-md p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="text-lg">{showPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
              <p id="passwordHelp" className="mt-2 text-xs text-gray-500">Enter your account password</p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-medical-600 to-medical-700 text-white py-4 px-6 rounded-medical-lg font-semibold hover:from-medical-700 hover:to-medical-800 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-medical-lg hover:shadow-medical-lg transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to Simuatech?</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="text-medical-600 hover:text-medical-800 font-medium transition-colors"
              >
                Create your free account →
              </Link>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-medical-50 rounded-medical-lg p-6 border border-medical-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">Need Help?</h3>
          <p className="text-gray-600 text-sm mb-4 text-center">
            Having trouble signing in? We're here to help you get back to learning.
          </p>
          <div className="space-y-3 text-center">
            <Link
              to="/forgot-password"
              className="block text-medical-600 hover:text-medical-800 text-sm font-medium transition-colors"
            >
              Reset your password
            </Link>
            <Link
              to="/"
              className="block text-gray-600 hover:text-gray-800 text-sm transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>

        {/* Demo Account Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-lg">💡</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Try Demo Account</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Want to explore first? Use these demo credentials:</p>
                <p className="mt-1 font-mono text-xs bg-yellow-100 p-2 rounded">
                  Email: demo@simuatech.com<br />
                  Password: demo123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;