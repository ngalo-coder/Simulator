// ai-patient-sim-frontend/src/components/ServiceWakeup.js - UPDATED
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ServiceWakeup = ({ children }) => {
  const [wakingUp, setWakingUp] = useState(true);
  const [serviceStatus, setServiceStatus] = useState({
    gateway: 'checking',
    userService: 'checking',
    simulationService: 'checking'
  });

  useEffect(() => {
    const wakeUpServices = async () => {
      try {
        console.log('🔄 Waking up services...');
        
        const baseURL = process.env.REACT_APP_API_GATEWAY_URL || 'https://ai-patient-sim-gateway.onrender.com';
        
        // Create shorter timeout for service checks
        const axiosConfig = {
          timeout: 10000, // 10 seconds
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        };

        // Update status function
        const updateStatus = (service, status) => {
          setServiceStatus(prev => ({ ...prev, [service]: status }));
        };

        // Wake up gateway first
        try {
          updateStatus('gateway', 'waking');
          await axios.get(`${baseURL}/health`, axiosConfig);
          updateStatus('gateway', 'ready');
          console.log('✅ Gateway is awake');
        } catch (error) {
          updateStatus('gateway', 'error');
          console.warn('⚠️ Gateway health check failed:', error.message);
        }

        // Wake up user service
        try {
          updateStatus('userService', 'waking');
          await axios.get(`${baseURL}/api/users/health`, axiosConfig);
          updateStatus('userService', 'ready');
          console.log('✅ User service is awake');
        } catch (error) {
          updateStatus('userService', 'error');
          console.warn('⚠️ User service health check failed:', error.message);
        }

        // Try to wake up simulation service (might not be deployed yet)
        try {
          updateStatus('simulationService', 'waking');
          await axios.get(`${baseURL}/api/simulations/health`, axiosConfig);
          updateStatus('simulationService', 'ready');
          console.log('✅ Simulation service is awake');
        } catch (error) {
          updateStatus('simulationService', 'unavailable');
          console.warn('⚠️ Simulation service unavailable:', error.message);
          // Don't fail the whole app if simulation service is down
        }

        console.log('✅ Service wake-up process completed');
      } catch (error) {
        console.error('❌ Error during service wake-up:', error);
      } finally {
        // Continue with the app even if some services are down
        setTimeout(() => {
          setWakingUp(false);
        }, 1000); // Small delay to show status
      }
    };

    wakeUpServices();
  }, []);

  if (wakingUp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Starting Services</h2>
          <p className="text-gray-600 mb-6">Please wait while we prepare your simulation environment...</p>
          
          {/* Service Status */}
          <div className="space-y-3 text-left">
            <ServiceStatusItem 
              name="API Gateway" 
              status={serviceStatus.gateway} 
            />
            <ServiceStatusItem 
              name="User Service" 
              status={serviceStatus.userService} 
            />
            <ServiceStatusItem 
              name="Simulation Service" 
              status={serviceStatus.simulationService} 
            />
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            This may take up to 15 seconds for services to start
          </p>
        </div>
      </div>
    );
  }

  return children;
};

const ServiceStatusItem = ({ name, status }) => {
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'checking':
        return { icon: '⏳', text: 'Checking...', color: 'text-gray-500' };
      case 'waking':
        return { icon: '🔄', text: 'Starting...', color: 'text-blue-500' };
      case 'ready':
        return { icon: '✅', text: 'Ready', color: 'text-green-500' };
      case 'error':
        return { icon: '❌', text: 'Error', color: 'text-red-500' };
      case 'unavailable':
        return { icon: '⚠️', text: 'Unavailable', color: 'text-yellow-500' };
      default:
        return { icon: '⏳', text: 'Unknown', color: 'text-gray-500' };
    }
  };

  const { icon, text, color } = getStatusDisplay(status);

  return (
    <div className="flex items-center justify-between p-2 bg-white rounded border">
      <span className="text-sm font-medium text-gray-700">{name}</span>
      <div className="flex items-center space-x-2">
        <span>{icon}</span>
        <span className={`text-sm font-medium ${color}`}>{text}</span>
      </div>
    </div>
  );
};

export default ServiceWakeup;