import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';;

const APIConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [healthData, setHealthData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    testAPIConnection();
  }, []);

  const testAPIConnection = async () => {
    try {
      // Test health endpoint
      const response = await fetch('http://localhost:5003/health');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setHealthData(data);
      setConnectionStatus('success');
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const testAuthEndpoint = async () => {
    try {
      // Test a simple auth endpoint (login with mock credentials)
      const response = await fetch('http://localhost:5003/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      const data = await response.json();
      console.log('Auth test response:', data);
      return data;
    } catch (error) {
      console.error('Auth test failed:', error);
      throw error;
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">
        API Connection Test
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'testing' ? 'bg-yellow-500 animate-pulse' :
            connectionStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-neutral-700 dark:text-neutral-300">
            {connectionStatus === 'testing' && 'Testing connection to backend...'}
            {connectionStatus === 'success' && 'Successfully connected to backend!'}
            {connectionStatus === 'error' && 'Failed to connect to backend'}
          </span>
        </div>

        {connectionStatus === 'success' && healthData && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">
              Backend Health Status
            </h3>
            <pre className="text-xs text-green-700 dark:text-green-400 overflow-auto">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-red-800 dark:text-red-300 mb-2">
              Connection Error
            </h3>
            <p className="text-red-700 dark:text-red-400 text-sm">{errorMessage}</p>
            <p className="text-red-600 dark:text-red-500 text-xs mt-2">
              Please ensure the backend server is running on port 5003
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={testAPIConnection}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            Test Connection Again
          </button>
          
          <button
            onClick={testAuthEndpoint}
            className="px-4 py-2 bg-neutral-500 text-white rounded-md hover:bg-neutral-600 transition-colors"
          >
            Test Auth Endpoint
          </button>
        </div>
      </div>
    </div>
  );
};

export default APIConnectionTest;