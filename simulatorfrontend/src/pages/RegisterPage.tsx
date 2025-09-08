import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    institution: '',
    discipline: '',
    primaryRole: 'student',
    specialization: '',
    yearOfStudy: '',
    licenseNumber: '',
    competencyLevel: 'novice'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { text: 'Very Weak', color: 'text-red-600' };
      case 2: return { text: 'Weak', color: 'text-orange-600' };
      case 3: return { text: 'Fair', color: 'text-yellow-600' };
      case 4: return { text: 'Good', color: 'text-blue-600' };
      case 5: return { text: 'Strong', color: 'text-green-600' };
      default: return { text: '', color: '' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.institution || !formData.discipline) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          institution: formData.institution,
          specialization: formData.specialization,
          yearOfStudy: formData.yearOfStudy ? parseInt(formData.yearOfStudy) : undefined,
          licenseNumber: formData.licenseNumber,
          competencyLevel: formData.competencyLevel
        },
        discipline: formData.discipline,
        primaryRole: formData.primaryRole
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 -mx-4 sm:-mx-6 lg:-mx-8 -my-8 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">🏥</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Join Simuatech</h2>
          <p className="text-gray-600">Create your free account and start learning today</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-blue-600">1</span>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-3">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter your first name"
                    required
                    aria-describedby="firstNameHelp"
                  />
                  <p id="firstNameHelp" className="mt-2 text-xs text-gray-500">Your legal first name as it appears on official documents</p>
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-3">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter your last name"
                    required
                    aria-describedby="lastNameHelp"
                  />
                  <p id="lastNameHelp" className="mt-2 text-xs text-gray-500">Your legal last name as it appears on official documents</p>
                </div>
              </div>
              
              <div className="mt-6">
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-3">
                  Institution <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  placeholder="Enter your institution name"
                  required
                  aria-describedby="institutionHelp"
                />
                <p id="institutionHelp" className="mt-2 text-xs text-gray-500">University, college, or healthcare facility name</p>
              </div>
              
              <div className="mt-6">
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-3">
                  Specialization (Optional)
                </label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  placeholder="e.g., Cardiology, Pediatrics, Surgery"
                  aria-describedby="specializationHelp"
                />
                <p id="specializationHelp" className="mt-2 text-xs text-gray-500">Your medical specialty or area of focus</p>
              </div>
            </div>
            
            {/* Professional Details Section */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600">2</span>
                Professional Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="discipline" className="block text-sm font-medium text-gray-700 mb-3">
                    Healthcare Discipline <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="discipline"
                    name="discipline"
                    value={formData.discipline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    required
                    aria-describedby="disciplineHelp"
                  >
                    <option value="">Select your discipline</option>
                    <option value="medicine">Medicine</option>
                    <option value="nursing">Nursing</option>
                    <option value="laboratory">Laboratory Science</option>
                    <option value="radiology">Radiology</option>
                    <option value="pharmacy">Pharmacy</option>
                  </select>
                  <p id="disciplineHelp" className="mt-2 text-xs text-gray-500">Your primary healthcare field</p>
                </div>
                
                <div>
                  <label htmlFor="primaryRole" className="block text-sm font-medium text-gray-700 mb-3">
                    Primary Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="primaryRole"
                    name="primaryRole"
                    value={formData.primaryRole}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    required
                    aria-describedby="roleHelp"
                  >
                    <option value="student">Student</option>
                    <option value="educator">Educator</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <p id="roleHelp" className="mt-2 text-xs text-gray-500">Your main role in the healthcare system</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label htmlFor="yearOfStudy" className="block text-sm font-medium text-gray-700 mb-3">
                    Year of Study (Optional)
                  </label>
                  <input
                    type="number"
                    id="yearOfStudy"
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="e.g., 3"
                    aria-describedby="yearHelp"
                  />
                  <p id="yearHelp" className="mt-2 text-xs text-gray-500">Current year of your program</p>
                </div>
                
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-3">
                    License Number (Optional)
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="e.g., MD12345"
                    aria-describedby="licenseHelp"
                  />
                  <p id="licenseHelp" className="mt-2 text-xs text-gray-500">Professional license number if applicable</p>
                </div>
              </div>
              
              <div className="mt-6">
                <label htmlFor="competencyLevel" className="block text-sm font-medium text-gray-700 mb-3">
                  Current Competency Level (Optional)
                </label>
                <select
                  id="competencyLevel"
                  name="competencyLevel"
                  value={formData.competencyLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  aria-describedby="competencyHelp"
                >
                  <option value="novice">Novice</option>
                  <option value="advanced_beginner">Advanced Beginner</option>
                  <option value="competent">Competent</option>
                  <option value="proficient">Proficient</option>
                  <option value="expert">Expert</option>
                </select>
                <p id="competencyHelp" className="mt-2 text-xs text-gray-500">Self-assessment of your current skill level</p>
              </div>
            </div>
            
            {/* Account Information Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 text-purple-600">3</span>
                Account Information
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-3">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="Choose a username"
                      required
                      aria-describedby="usernameHelp"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">👤</span>
                    </div>
                  </div>
                  <p id="usernameHelp" className="mt-2 text-xs text-gray-500">This will be your public display name (letters and numbers only)</p>
                </div>
            
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-3">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="Enter your email address"
                      required
                      aria-describedby="emailHelp"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">📧</span>
                    </div>
                  </div>
                  <p id="emailHelp" className="mt-2 text-xs text-gray-500">We'll use this for important updates and account recovery</p>
                </div>
            
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-3">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="Create a strong password"
                      required
                      aria-describedby="passwordHelp"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="text-lg">{showPassword ? '🙈' : '👁️'}</span>
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Password strength:</span>
                        <span className={`text-xs font-medium ${strengthInfo.color}`}>
                          {strengthInfo.text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength <= 1 ? 'bg-red-500' :
                            passwordStrength === 2 ? 'bg-orange-500' :
                            passwordStrength === 3 ? 'bg-yellow-500' :
                            passwordStrength === 4 ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <p id="passwordHelp" className="mt-2 text-xs text-gray-500">Minimum 6 characters with letters, numbers, and symbols</p>
                </div>
            
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-3">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : formData.confirmPassword && formData.password === formData.confirmPassword
                          ? 'border-green-300 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Confirm your password"
                      required
                      aria-describedby="confirmPasswordHelp"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="text-lg">{showConfirmPassword ? '🙈' : '👁️'}</span>
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-2 text-xs text-red-600" role="alert">Passwords do not match</p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="mt-2 text-xs text-green-600" role="status">Passwords match</p>
                  )}
                  <p id="confirmPasswordHelp" className="mt-2 text-xs text-gray-500">Re-enter your password for verification</p>
                </div>
              </div>
          </div>
          
          <button
              type="submit"
              disabled={loading || formData.password !== formData.confirmPassword || !formData.firstName || !formData.lastName || !formData.institution || !formData.discipline}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Free Account'
              )}
            </button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Sign in instead →
              </Link>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">What you'll get with Simuatech:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3 text-xs">✓</span>
              Access to hundreds of realistic patient cases
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3 text-xs">✓</span>
              AI-powered feedback and detailed evaluation
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3 text-xs">✓</span>
              Comprehensive progress tracking and analytics
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3 text-xs">✓</span>
              Leaderboards and achievement system
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3 text-xs">✓</span>
              Multi-specialty learning paths
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3 text-xs">✓</span>
              Safe, consequence-free practice environment
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="text-center text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
          <p>
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-800 font-medium">Terms of Service</Link>
            {' '}and acknowledge our{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-800 font-medium">Privacy Policy</Link>
            . Your data is securely stored and used only to enhance your learning experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;