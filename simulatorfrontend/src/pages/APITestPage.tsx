import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import Button from '../components/Button';
import Card from '../components/Card';

const APITestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const testCasesEndpoint = async () => {
    const response = await fetch('http://localhost:5003/api/simulation/cases');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };

  const testAuthStructure = async () => {
    const response = await fetch('http://localhost:5003/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'test' })
    });
    const data = await response.json();
    return { status: response.status, hasToken: !!data.token, hasUser: !!data.user };
  };

  const testHealthEndpoint = async () => {
    const response = await fetch('http://localhost:5003/health');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };

  const testApiServiceHealth = async () => {
    return await apiService.healthCheck();
  };

  const tests = [
    { name: 'Health Endpoint', test: testHealthEndpoint },
    { name: 'API Service Health Check', test: testApiServiceHealth },
    { name: 'Cases Endpoint', test: testCasesEndpoint },
    { name: 'Auth Endpoint Structure', test: testAuthStructure }
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-text dark:text-text-dark">
          API Integration Test Suite
        </h1>
        
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">
            Backend API Tests
          </h2>
          
          <div className="space-y-4">
            {tests.map(({ name, test }) => (
              <div key={name} className="border border-border dark:border-border-dark rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-text dark:text-text-dark">{name}</h3>
                  <Button
                    onClick={() => runTest(name, test)}
                    isLoading={loading[name]}
                    size="sm"
                  >
                    {loading[name] ? 'Testing...' : 'Run Test'}
                  </Button>
                </div>
                
                {testResults[name] && (
                  <div className={`p-3 rounded text-sm ${
                    testResults[name].success
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                  }`}>
                    <pre className="whitespace-pre-wrap">
                      {testResults[name].success
                        ? JSON.stringify(testResults[name].data, null, 2)
                        : `Error: ${testResults[name].error}`
                      }
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-text dark:text-text-dark mb-3">
            Test Results Summary
          </h3>
          <div className="space-y-2">
            {tests.map(({ name }) => (
              <div key={name} className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  !testResults[name] ? 'bg-gray-400' :
                  testResults[name].success ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-text-muted dark:text-text-dark-muted">
                  {name}: {!testResults[name] ? 'Not tested' : testResults[name].success ? '✓ Success' : '✗ Failed'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default APITestPage;