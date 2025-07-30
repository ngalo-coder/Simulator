import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { userManagementAPI } from '../utils/userManagementApi';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [extendedProfile, setExtendedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    // Check if user is logged in on app start
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken) {
      try {
        // Basic token validation - check if it's not expired
        const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (tokenPayload.exp && tokenPayload.exp > currentTime) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          console.log('✅ Valid token found, user logged in');
        } else {
          console.log('⚠️ Token expired, clearing auth data');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('❌ Invalid token format, clearing auth data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login...');
      
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      console.log('✅ Login successful, setting auth data...');

      // Store in localStorage first
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update state
      setToken(token);
      setUser(user);

      // Load extended profile data (non-blocking)
      try {
        const profileResponse = await userManagementAPI.getExtendedProfile();
        if (profileResponse.success) {
          setExtendedProfile(profileResponse.user);
          console.log('✅ Extended profile loaded');
        }
      } catch (profileError) {
        console.warn('⚠️ Could not load extended profile:', profileError);
        // Don't fail login if extended profile fails
      }

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('❌ Login failed:', error);
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      console.log('🔄 Attempting registration with data:', userData);
      
      const response = await authAPI.register(userData);
      console.log('✅ Registration response:', response.data);
      
      const { token, user } = response.data;
  
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
  
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let message;
      if (error.code === 'ECONNABORTED') {
        message = 'Request timed out. Please try again.';
      } else {
        message = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
      }
      
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setExtendedProfile(null); // Clear extended profile too
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.user;

      // Update localStorage and state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    extendedProfile, // NEW: Extended user profile data
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};