import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface SessionWarningProps {
  minutesLeft: number;
  onRefresh: () => void;
  onDismiss: () => void;
}

const SessionWarning: React.FC<SessionWarningProps> = ({ minutesLeft, onRefresh, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg z-50 max-w-sm animate-fade-in">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-yellow-400 text-xl">⚠️</span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-yellow-800">Session Expiring Soon</p>
          <p className="text-sm text-yellow-700 mt-1">
            Your session will expire in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}. 
            Please save your work and refresh to continue.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={onRefresh}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors"
            >
              Refresh Session
            </button>
            <button
              onClick={onDismiss}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-400 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SessionExpiredProps {
  onSignIn: () => void;
}

const SessionExpired: React.FC<SessionExpiredProps> = ({ onSignIn }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Expired</h3>
          <p className="text-gray-600 mb-6">
            Your session has expired for security reasons. Please sign in again to continue using Simuatech.
          </p>
          <button
            onClick={onSignIn}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign In Again
          </button>
        </div>
      </div>
    </div>
  );
};

const SessionManager: React.FC = () => {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(0);

  const getTokenExpiry = (): number | null => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (e) {
      return null;
    }
  };

  const checkSession = () => {
    if (!user) return;
    
    const expiry = getTokenExpiry();
    if (!expiry) return;
    
    const now = Date.now();
    const timeUntilExpiry = expiry - now;
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
    
    // Show warning 5 minutes before expiry
    if (timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 0) {
      setMinutesLeft(minutesUntilExpiry);
      setShowWarning(true);
    }
    
    // Token has expired
    if (timeUntilExpiry <= 0) {
      setShowWarning(false);
      setShowExpired(true);
      logout();
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Check immediately
    checkSession();
    
    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  const handleSignIn = () => {
    window.location.href = '/login';
  };

  return (
    <>
      {showWarning && (
        <SessionWarning
          minutesLeft={minutesLeft}
          onRefresh={handleRefresh}
          onDismiss={handleDismiss}
        />
      )}
      {showExpired && (
        <SessionExpired onSignIn={handleSignIn} />
      )}
    </>
  );
};

export default SessionManager;