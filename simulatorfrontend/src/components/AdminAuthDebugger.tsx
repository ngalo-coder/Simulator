import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';

interface ApiTestResult {
  loading?: boolean;
  success?: boolean;
  data?: any;
  error?: string;
}

const AdminAuthDebugger: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [apiTests, setApiTests] = useState<Record<string, ApiTestResult>>({});

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    
    let decodedToken = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        decodedToken = {
          userId: payload.userId,
          role: payload.role,
          exp: payload.exp,
          expiresAt: new Date(payload.exp * 1000).toISOString(),
          isExpired: Date.now() >= (payload.exp * 1000)
        };
      } catch (e) {
        decodedToken = { error: 'Could not decode token' };
      }
    }

    setAuthStatus({
      hasToken: !!token,
      hasCurrentUser: !!currentUser,
      isAuthenticated: api.isAuthenticated(),
      tokenExpiry: api.getTimeUntilExpiry(),
      decodedToken,
      currentUser: currentUser ? JSON.parse(currentUser) : null
    });
  };

  const testAPI = async (endpoint: string, testFn: () => Promise<any>) => {
    try {
      setApiTests(prev => ({ ...prev, [endpoint]: { loading: true } }));
      const result = await testFn();
      setApiTests(prev => ({ 
        ...prev, 
        [endpoint]: { success: true, data: result, loading: false } 
      }));
    } catch (error: any) {
      setApiTests(prev => ({ 
        ...prev, 
        [endpoint]: { 
          success: false, 
          error: error.message, 
          loading: false 
        } 
      }));
    }
  };

  const testSystemStats = () => testAPI('systemStats', () => api.getSystemStats());
  const testAdminUsers = () => testAPI('adminUsers', () => api.getAdminUsers({ page: 1, limit: 5 }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">🔍 Admin Authentication Debugger</h3>
      
      {/* Auth Status */}
      <div>
        <h4 className="font-medium text-gray-800 mb-2">Authentication Status</h4>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
          <div>Has Token: <span className={authStatus?.hasToken ? 'text-green-600' : 'text-red-600'}>{authStatus?.hasToken ? '✅' : '❌'}</span></div>
          <div>Has Current User: <span className={authStatus?.hasCurrentUser ? 'text-green-600' : 'text-red-600'}>{authStatus?.hasCurrentUser ? '✅' : '❌'}</span></div>
          <div>Is Authenticated: <span className={authStatus?.isAuthenticated ? 'text-green-600' : 'text-red-600'}>{authStatus?.isAuthenticated ? '✅' : '❌'}</span></div>
          <div>Token Expiry: {authStatus?.tokenExpiry} minutes</div>
          
          {authStatus?.currentUser && (
            <div>
              <strong>Current User:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">{JSON.stringify(authStatus.currentUser, null, 2)}</pre>
            </div>
          )}
          
          {authStatus?.decodedToken && (
            <div>
              <strong>Decoded Token:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">{JSON.stringify(authStatus.decodedToken, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {/* API Tests */}
      <div>
        <h4 className="font-medium text-gray-800 mb-2">API Tests</h4>
        <div className="space-y-2">
          <button
            onClick={testSystemStats}
            disabled={apiTests.systemStats?.loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {apiTests.systemStats?.loading ? 'Testing...' : 'Test System Stats'}
          </button>
          
          <button
            onClick={testAdminUsers}
            disabled={apiTests.adminUsers?.loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-2"
          >
            {apiTests.adminUsers?.loading ? 'Testing...' : 'Test Admin Users'}
          </button>
        </div>
        
        {/* API Results */}
        <div className="mt-4 space-y-4">
          {Object.entries(apiTests).map(([endpoint, result]: [string, any]) => (
            <div key={endpoint} className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">{endpoint}</h5>
              {result.loading && <div className="text-blue-600">Loading...</div>}
              {result.success && (
                <div>
                  <div className="text-green-600 mb-2">✅ Success</div>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
              {result.error && (
                <div>
                  <div className="text-red-600 mb-2">❌ Error</div>
                  <div className="bg-red-50 p-2 rounded text-sm text-red-700">{result.error}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={checkAuthStatus}
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Refresh Auth Status
      </button>
    </div>
  );
};

export default AdminAuthDebugger;