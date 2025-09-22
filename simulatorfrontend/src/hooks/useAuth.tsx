import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/apiService';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  institution: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkTokenExpiry = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
      // Decode JWT token to get expiry
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      
      if (Date.now() >= expiry) {
        console.log('Token expired, logging out user');
        logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      logout();
      return false;
    }
  };

  useEffect(() => {
    // Check for existing auth token on app load
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('currentUser');

    if (token && userData) {
      try {
        // Check if token is still valid
        if (checkTokenExpiry()) {
          const user = JSON.parse(userData);
          // Ensure user object has the correct role structure
          const userWithRole = {
            ...user,
            role: user.primaryRole || user.role || 'user'
          };
          setUser(userWithRole);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
      }
    }

    setLoading(false);
  }, []);

  // Check token expiry periodically
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkTokenExpiry();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    const { token, user } = response;

    // Ensure user object has the correct role structure
    const userWithRole = {
      ...user,
      role: user.primaryRole || user.role || 'user'
    };

    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(userWithRole));
    setUser(userWithRole);
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    institution: string;
  }) => {
    const response = await api.register(userData);
    const { token, user } = response;
    
    // Auto-login after registration
    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setUser(user);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};