import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

const ServiceWakeup = ({ onReady }) => {
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10;

  const checkServices = async () => {
    try {
      setAttempts(prev => prev + 1);
      
      const response = await fetch('https://ai-patient-sim-gateway.onrender.com/health', {
        method: 'GET',
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if user service is configured
        if (data.services?.urls?.users) {
          // Try to ping user service
          const userServiceResponse = await fetch(data.services.urls.users + '/health', {
            method: 'GET',
            timeout: 15000
          });
          
          if (userServiceResponse.ok) {
            setStatus('ready');
            onReady();
            return;
          }
        }
      }
      
      if (attempts >= maxAttempts) {
        setStatus('failed');
      } else {
        setTimeout(checkServices, 3000); // Check again in 3 seconds
      }
    } catch (error) {
      console.log('Service still starting...', error.message);
      if (attempts >= maxAttempts) {
        setStatus('failed');
      } else {
        setTimeout(checkServices, 3000);
      }
    }
  };

  useEffect(() => {
    checkServices();
  }, []);

  if (status === 'ready') return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4">
        <div className="text-center">
          {status === 'checking' && (
            <>
              <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Waking Up Services
              </h3>
              <p className="text-gray-600 mb-4">
                Services are starting up. This usually takes 30-60 seconds on first use.
              </p>
              <div className="text-sm text-gray-500">
                Attempt {attempts} of {maxAttempts}
              </div>
            </>
          )}
          
          {status === 'failed' && (
            <>
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Services Unavailable
              </h3>
              <p className="text-gray-600 mb-4">
                Unable to connect to services. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceWakeup;   